import { app, ipcMain, shell } from 'electron';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { generateStandaloneHtmlReport } from './reportExport';

const RUN_SCAN_CHANNEL = 'endpointTriage:runScan';
const CANCEL_SCAN_CHANNEL = 'endpointTriage:cancelScan';
const GET_REPORTS_CHANNEL = 'endpointTriage:getReports';
const EXPORT_JSON_CHANNEL = 'endpointTriage:exportJson';
const EXPORT_HTML_CHANNEL = 'endpointTriage:exportHtml';
const OPEN_JSON_CHANNEL = 'endpointTriage:openJson';
const OPEN_REPORTS_FOLDER_CHANNEL = 'endpointTriage:openReportsFolder';

const SCAN_TIMEOUT_MS = 180000;

type JsonRecord = Record<string, unknown>;

interface RunScanResult {
  success: boolean;
  report?: JsonRecord;
  rawOutput?: string;
  error?: string;
}

interface CollectorResult {
  report: JsonRecord;
  rawOutput: string;
}

class EndpointTriageError extends Error {
  constructor(message: string, readonly rawOutput?: string) {
    super(message);
    this.name = 'EndpointTriageError';
  }
}

let activeCollectorProcess: ChildProcessWithoutNullStreams | null = null;
let activeScanCancelled = false;

const getProjectRoot = () => {
  if (app.isPackaged) {
    return process.resourcesPath;
  }

  return app.getAppPath();
};

const getCollectorScriptPath = () => path.join(getProjectRoot(), 'scripts', 'Invoke-EndpointTriage.ps1');

const getReportsFolderPath = () => {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'reports');
  }

  return path.join(getProjectRoot(), 'reports');
};

const getExportsFolderPath = () => path.join(getReportsFolderPath(), 'exports');

const getStringField = (report: JsonRecord, fieldName: string, fallback = 'unknown') => {
  const value = report[fieldName];
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return fallback;
};

const sanitizeFileName = (value: string) => {
  const sanitized = value.replace(/[^a-z0-9._-]+/gi, '_').replace(/^_+|_+$/g, '');
  return sanitized || 'report';
};

const getStoredReportPath = (reportId: string) => path.join(getReportsFolderPath(), `${sanitizeFileName(reportId)}.json`);

const getExportBaseName = (report: JsonRecord) => {
  const hostname = sanitizeFileName(getStringField(report, 'hostname', 'endpoint'));
  const reportId = sanitizeFileName(getStringField(report, 'reportId', 'report'));
  const scanTime = sanitizeFileName(getStringField(report, 'scanTime', new Date().toISOString()).replace(/[:]/g, '-'));

  return `${hostname}_${scanTime}_${reportId}`;
};

const assertFileExists = async (filePath: string) => {
  try {
    await access(filePath);
  } catch {
    throw new EndpointTriageError(`Collector script was not found at ${filePath}.`);
  }
};

const getPowerShellCandidates = () => {
  if (process.platform === 'win32') {
    return ['powershell.exe', 'pwsh.exe'];
  }

  return ['pwsh', 'powershell'];
};

const getFriendlyProcessError = (error: NodeJS.ErrnoException, command: string) => {
  if (error.code === 'ENOENT') {
    return `PowerShell was not found. Tried ${command}. Install PowerShell or run on a Windows endpoint.`;
  }

  if (error.code === 'EACCES') {
    return `Permission denied while starting ${command}. Run the app with appropriate permissions.`;
  }

  return error.message || `Unable to start ${command}.`;
};

const getFriendlyPowerShellFailure = (stderr: string, exitCode: number | null) => {
  const details = stderr.trim();
  const lowerDetails = details.toLowerCase();

  if (lowerDetails.includes('running scripts is disabled') || lowerDetails.includes('execution of scripts is disabled')) {
    return 'PowerShell script execution is blocked by policy. The collector is launched with ExecutionPolicy Bypass, but local policy still prevented execution.';
  }

  if (lowerDetails.includes('access is denied') || lowerDetails.includes('unauthorizedaccessexception')) {
    return 'Permission denied while running the endpoint collector. Run as administrator for full results.';
  }

  if (details.length > 0) {
    return `PowerShell collector failed with exit code ${exitCode ?? 'unknown'}: ${details}`;
  }

  return `PowerShell collector failed with exit code ${exitCode ?? 'unknown'}.`;
};

const getRawOutput = (stdout: string, stderr: string) => {
  const sections = [];
  const trimmedStdout = stdout.trim();
  const trimmedStderr = stderr.trim();

  if (trimmedStdout) {
    sections.push(trimmedStdout);
  }

  if (trimmedStderr) {
    sections.push(`STDERR:\n${trimmedStderr}`);
  }

  return sections.join('\n\n');
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return 'An unknown endpoint scan error occurred.';
};

const parseCollectorJson = (stdout: string, rawOutput: string) => {
  const output = stdout.trim();
  if (!output) {
    throw new EndpointTriageError('PowerShell collector returned an empty report.', rawOutput);
  }

  try {
    return JSON.parse(output) as JsonRecord;
  } catch {
    throw new EndpointTriageError('PowerShell collector returned invalid JSON.', rawOutput);
  }
};

const validateReport = (report: JsonRecord) => {
  const requiredFields = [
    'reportId',
    'scanTime',
    'hostname',
    'loggedInUser',
    'os',
    'hardware',
    'uptime',
    'network',
    'storage',
    'performance',
    'security',
    'updates',
    'events',
    'printers',
    'mappedDrives',
    'installedApps',
    'permissions',
  ];

  for (const field of requiredFields) {
    if (!(field in report)) {
      throw new EndpointTriageError(`PowerShell collector report is missing required field: ${field}.`);
    }
  }

  const objectFields = ['os', 'hardware', 'uptime', 'network', 'storage', 'performance', 'security', 'updates', 'events', 'printers', 'permissions'];
  for (const field of objectFields) {
    if (typeof report[field] !== 'object' || report[field] === null || Array.isArray(report[field])) {
      throw new EndpointTriageError(`PowerShell collector report has invalid object field: ${field}.`);
    }
  }

  const network = report.network as JsonRecord;
  const storage = report.storage as JsonRecord;
  const security = report.security as JsonRecord;
  const updates = report.updates as JsonRecord;
  const events = report.events as JsonRecord;
  const printers = report.printers as JsonRecord;
  const permissions = report.permissions as JsonRecord;

  const arrayFields: Array<[JsonRecord, string]> = [
    [network, 'ipAddresses'],
    [network, 'dnsServers'],
    [network, 'adapters'],
    [storage, 'drives'],
    [security, 'firewallProfiles'],
    [security, 'localAdmins'],
    [updates, 'lastHotfixes'],
    [events, 'failedLoginsLast24h'],
    [events, 'recentSystemErrors'],
    [events, 'recentApplicationErrors'],
    [printers, 'installedPrinters'],
    [permissions, 'limitedFields'],
    [report, 'mappedDrives'],
    [report, 'installedApps'],
  ];

  for (const [container, field] of arrayFields) {
    if (!Array.isArray(container[field])) {
      throw new EndpointTriageError(`PowerShell collector report has invalid array field: ${field}.`);
    }
  }

  return report;
};

const saveReport = async (report: JsonRecord) => {
  const reportId = getStringField(report, 'reportId', '');
  if (!reportId) {
    throw new EndpointTriageError('Cannot store report because reportId is missing.');
  }

  await mkdir(getReportsFolderPath(), { recursive: true });
  await writeFile(getStoredReportPath(reportId), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
};

const parseStoredReport = (content: string, fileName: string) => {
  try {
    return validateReport(JSON.parse(content) as JsonRecord);
  } catch {
    throw new EndpointTriageError(`Stored report is not valid JSON: ${fileName}`);
  }
};

const getStoredReports = async () => {
  const reportsFolder = getReportsFolderPath();
  await mkdir(reportsFolder, { recursive: true });

  const entries = await readdir(reportsFolder, { withFileTypes: true });
  const reports: JsonRecord[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.json')) {
      continue;
    }

    try {
      const content = await readFile(path.join(reportsFolder, entry.name), 'utf8');
      reports.push(parseStoredReport(content, entry.name));
    } catch {
      // Skip corrupted or partial report files instead of blocking the dashboard.
    }
  }

  return reports.sort((a, b) => {
    const aTime = Date.parse(getStringField(a, 'scanTime', '')) || 0;
    const bTime = Date.parse(getStringField(b, 'scanTime', '')) || 0;
    return bTime - aTime;
  });
};

const getStoredReportById = async (reportId: string) => {
  const directPath = getStoredReportPath(reportId);

  try {
    const content = await readFile(directPath, 'utf8');
    return parseStoredReport(content, path.basename(directPath));
  } catch {
    const reports = await getStoredReports();
    const report = reports.find((item) => getStringField(item, 'reportId', '') === reportId);

    if (report) {
      return report;
    }

    throw new EndpointTriageError(`Report was not found: ${reportId}`);
  }
};

const exportJsonReport = async (reportId: string) => {
  const report = await getStoredReportById(reportId);
  await mkdir(getExportsFolderPath(), { recursive: true });
  await writeFile(path.join(getExportsFolderPath(), `${getExportBaseName(report)}.json`), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
};

const exportHtmlReport = async (reportId: string) => {
  const report = await getStoredReportById(reportId);
  await mkdir(getExportsFolderPath(), { recursive: true });
  await writeFile(path.join(getExportsFolderPath(), `${getExportBaseName(report)}.html`), generateStandaloneHtmlReport(report), 'utf8');
};

const openJsonReport = async (reportId: string) => {
  await getStoredReportById(reportId);
  const result = await shell.openPath(getStoredReportPath(reportId));

  if (result) {
    throw new EndpointTriageError(`Unable to open JSON report: ${result}`);
  }
};

const runCollectorWithCommand = (command: string, scriptPath: string) =>
  new Promise<CollectorResult>((resolve, reject) => {
    if (activeScanCancelled) {
      reject(new EndpointTriageError('Scan cancelled by user.'));
      return;
    }

    const child = spawn(
      command,
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
      {
        shell: false,
        windowsHide: true,
      },
    );
    activeCollectorProcess = child;

    let stdout = '';
    let stderr = '';
    let settled = false;
    let timeout: NodeJS.Timeout;

    const cleanup = () => {
      clearTimeout(timeout);
      if (activeCollectorProcess === child) {
        activeCollectorProcess = null;
      }
    };

    const rejectWith = (error: EndpointTriageError) => {
      settled = true;
      cleanup();
      reject(error);
    };

    timeout = setTimeout(() => {
      if (settled) {
        return;
      }

      child.kill();
      rejectWith(new EndpointTriageError('Endpoint scan timed out before the collector returned results.', getRawOutput(stdout, stderr)));
    }, SCAN_TIMEOUT_MS);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });

    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      if (settled) {
        return;
      }

      rejectWith(new EndpointTriageError(getFriendlyProcessError(error, command), getRawOutput(stdout, stderr)));
    });

    child.on('close', (exitCode) => {
      if (settled) {
        return;
      }

      const rawOutput = getRawOutput(stdout, stderr);

      if (activeScanCancelled) {
        rejectWith(new EndpointTriageError('Scan cancelled by user.', rawOutput));
        return;
      }

      if (!stdout.trim()) {
        rejectWith(new EndpointTriageError(getFriendlyPowerShellFailure(stderr, exitCode), rawOutput));
        return;
      }

      try {
        const report = validateReport(parseCollectorJson(stdout, rawOutput));
        settled = true;
        cleanup();
        resolve({ report, rawOutput: stdout.trim() });
      } catch (error) {
        if (error instanceof EndpointTriageError) {
          rejectWith(error.rawOutput ? error : new EndpointTriageError(error.message, rawOutput));
          return;
        }

        rejectWith(new EndpointTriageError(getErrorMessage(error), rawOutput));
      }
    });
  });

const runCollector = async () => {
  const scriptPath = getCollectorScriptPath();
  await assertFileExists(scriptPath);

  const candidates = getPowerShellCandidates();
  const errors: string[] = [];

  for (const command of candidates) {
    if (activeScanCancelled) {
      throw new EndpointTriageError('Scan cancelled by user.');
    }

    try {
      return await runCollectorWithCommand(command, scriptPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown PowerShell execution error.';
      errors.push(message);

      const isMissingPowerShell = message.includes('PowerShell was not found');
      if (!isMissingPowerShell) {
        throw error;
      }
    }
  }

  throw new EndpointTriageError(errors[errors.length - 1] ?? 'PowerShell was not found.');
};

const requireReportId = (reportId: unknown) => {
  if (typeof reportId !== 'string' || reportId.trim().length === 0) {
    throw new EndpointTriageError('A valid reportId is required.');
  }

  return reportId;
};

const registerHandler = (channel: string, handler: Parameters<typeof ipcMain.handle>[1]) => {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, handler);
};

export const registerIpcHandlers = () => {
  registerHandler(RUN_SCAN_CHANNEL, async (): Promise<RunScanResult> => {
    activeScanCancelled = false;

    try {
      const result = await runCollector();

      if (activeScanCancelled) {
        return { success: false, error: 'Scan cancelled by user.', rawOutput: result.rawOutput };
      }

      await saveReport(result.report);
      return { success: true, report: result.report, rawOutput: result.rawOutput };
    } catch (error) {
      const rawOutput = error instanceof EndpointTriageError ? error.rawOutput : undefined;
      return { success: false, error: getErrorMessage(error), rawOutput };
    } finally {
      activeScanCancelled = false;
      activeCollectorProcess = null;
    }
  });

  registerHandler(CANCEL_SCAN_CHANNEL, async () => {
    activeScanCancelled = true;

    if (activeCollectorProcess && !activeCollectorProcess.killed) {
      activeCollectorProcess.kill();
    }
  });

  registerHandler(GET_REPORTS_CHANNEL, async () => getStoredReports());

  registerHandler(EXPORT_JSON_CHANNEL, async (_event, reportId: unknown) => {
    await exportJsonReport(requireReportId(reportId));
  });

  registerHandler(EXPORT_HTML_CHANNEL, async (_event, reportId: unknown) => {
    await exportHtmlReport(requireReportId(reportId));
  });

  registerHandler(OPEN_JSON_CHANNEL, async (_event, reportId: unknown) => {
    await openJsonReport(requireReportId(reportId));
  });

  registerHandler(OPEN_REPORTS_FOLDER_CHANNEL, async () => {
    const reportsFolder = getReportsFolderPath();
    await mkdir(reportsFolder, { recursive: true });
    const result = await shell.openPath(reportsFolder);

    if (result) {
      throw new EndpointTriageError(`Unable to open reports folder: ${result}`);
    }
  });
};
