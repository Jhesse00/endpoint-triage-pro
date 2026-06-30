import { app, ipcMain, shell } from 'electron';
import { spawn } from 'node:child_process';
import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { generateStandaloneHtmlReport } from './reportExport';

const RUN_SCAN_CHANNEL = 'endpointTriage:runScan';
const GET_REPORTS_CHANNEL = 'endpointTriage:getReports';
const EXPORT_JSON_CHANNEL = 'endpointTriage:exportJson';
const EXPORT_HTML_CHANNEL = 'endpointTriage:exportHtml';
const OPEN_REPORTS_FOLDER_CHANNEL = 'endpointTriage:openReportsFolder';

const SCAN_TIMEOUT_MS = 180000;

type JsonRecord = Record<string, unknown>;

class EndpointTriageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EndpointTriageError';
  }
}

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

const parseCollectorJson = (stdout: string) => {
  const output = stdout.trim();
  if (!output) {
    throw new EndpointTriageError('PowerShell collector returned an empty report.');
  }

  try {
    return JSON.parse(output) as JsonRecord;
  } catch {
    throw new EndpointTriageError('PowerShell collector returned invalid JSON.');
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

const runCollectorWithCommand = (command: string, scriptPath: string) =>
  new Promise<JsonRecord>((resolve, reject) => {
    const child = spawn(
      command,
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
      {
        shell: false,
        windowsHide: true,
      },
    );

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      child.kill();
      reject(new EndpointTriageError('Endpoint scan timed out before the collector returned results.'));
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

      settled = true;
      clearTimeout(timeout);
      reject(new EndpointTriageError(getFriendlyProcessError(error, command)));
    });

    child.on('close', (exitCode) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);

      if (!stdout.trim()) {
        reject(new EndpointTriageError(getFriendlyPowerShellFailure(stderr, exitCode)));
        return;
      }

      try {
        resolve(validateReport(parseCollectorJson(stdout)));
      } catch (error) {
        reject(error);
      }
    });
  });

const runCollector = async () => {
  const scriptPath = getCollectorScriptPath();
  await assertFileExists(scriptPath);

  const candidates = getPowerShellCandidates();
  const errors: string[] = [];

  for (const command of candidates) {
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
  registerHandler(RUN_SCAN_CHANNEL, async () => {
    const report = await runCollector();
    await saveReport(report);
    return report;
  });

  registerHandler(GET_REPORTS_CHANNEL, async () => getStoredReports());

  registerHandler(EXPORT_JSON_CHANNEL, async (_event, reportId: unknown) => {
    await exportJsonReport(requireReportId(reportId));
  });

  registerHandler(EXPORT_HTML_CHANNEL, async (_event, reportId: unknown) => {
    await exportHtmlReport(requireReportId(reportId));
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
