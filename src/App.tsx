import { useEffect, useRef, useState } from 'react';
import { HomeDashboard } from './components/dashboard/HomeDashboard';
import { RecentReports } from './components/dashboard/RecentReports';
import { ScanProgress, SCAN_STEPS } from './components/dashboard/ScanProgress';
import { AppShell } from './components/layout/AppShell';
import type { AppView } from './components/layout/Sidebar';
import { EndpointReport } from './components/report/EndpointReport';
import { Button } from './components/ui/Button';
import { EmptyState } from './components/ui/EmptyState';
import { Panel } from './components/ui/Panel';
import { calculateHealthScore, getHealthLabel } from './lib/healthScore';
import { generateTicketNotes } from './lib/ticketNotes';
import { generateWarnings } from './lib/warningEngine';
import type { EndpointTriageReport, ScanState } from './types/triage';

type Screen = AppView;
type ExportStatus = { type: 'success' | 'error'; message: string } | null;

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const getInitialScanState = (): ScanState => ({
  status: 'idle',
  currentStep: SCAN_STEPS[0],
  progress: 0,
});

const getAverageHealthScore = (reports: EndpointTriageReport[]) => {
  if (reports.length === 0) {
    return 0;
  }

  const total = reports.reduce((sum, report) => sum + calculateHealthScore(report).score, 0);
  return Math.round(total / reports.length);
};

const getCommonWarnings = (reports: EndpointTriageReport[]) => {
  const warningsByTitle = new Map<string, ReturnType<typeof generateWarnings>[number]>();

  for (const report of reports) {
    for (const warning of generateWarnings(report)) {
      if (!warningsByTitle.has(warning.title)) {
        warningsByTitle.set(warning.title, warning);
      }
    }
  }

  return Array.from(warningsByTitle.values());
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return 'An unknown scan error occurred.';
}

const requireRecord = (value: unknown, fieldName: string) => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`PowerShell collector report has invalid object field: ${fieldName}.`);
  }

  return value as Record<string, unknown>;
};

const validateEndpointReport = (value: unknown): EndpointTriageReport => {
  const report = requireRecord(value, 'report');
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
      throw new Error(`PowerShell collector report is missing required field: ${field}.`);
    }
  }

  const network = requireRecord(report.network, 'network');
  const storage = requireRecord(report.storage, 'storage');
  const security = requireRecord(report.security, 'security');
  const updates = requireRecord(report.updates, 'updates');
  const events = requireRecord(report.events, 'events');
  const printers = requireRecord(report.printers, 'printers');
  const permissions = requireRecord(report.permissions, 'permissions');

  const arrayFields: Array<[Record<string, unknown>, string]> = [
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
      throw new Error(`PowerShell collector report has invalid array field: ${field}.`);
    }
  }

  return value as EndpointTriageReport;
};

function getShellCopy(screen: Screen) {
  if (screen === 'scan') {
    return {
      title: 'Scan Progress',
      subtitle: 'Running local Windows endpoint triage scan.',
    };
  }

  if (screen === 'report') {
    return {
      title: 'Endpoint Report',
      subtitle: 'Current local diagnostic report and technician findings.',
    };
  }

  if (screen === 'history') {
    return {
      title: 'Scan History',
      subtitle: 'Local endpoint reports stored on this workstation.',
    };
  }

  if (screen === 'settings') {
    return {
      title: 'Settings',
      subtitle: 'Local collector and report storage configuration.',
    };
  }

  return {
    title: 'Endpoint Triage Pro',
    subtitle: 'Windows endpoint health dashboard and diagnostic console.',
  };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedReport, setSelectedReport] = useState<EndpointTriageReport | null>(null);
  const [reports, setReports] = useState<EndpointTriageReport[]>([]);
  const [scanState, setScanState] = useState<ScanState>(getInitialScanState);
  const [scanSessionId, setScanSessionId] = useState(0);
  const [exportStatus, setExportStatus] = useState<ExportStatus>(null);
  const activeScanIdRef = useRef(0);
  const shellCopy = getShellCopy(screen);
  const currentHealth = selectedReport ? calculateHealthScore(selectedReport) : null;
  const currentWarnings = selectedReport ? generateWarnings(selectedReport) : [];
  const currentTicketNotes = selectedReport ? generateTicketNotes(selectedReport, currentWarnings) : '';
  const averageHealthScore = getAverageHealthScore(reports);
  const dashboardWarnings = getCommonWarnings(reports);
  const scanIsActive = scanState.status === 'running' || scanState.status === 'building-report';

  useEffect(() => {
    let active = true;

    const loadReports = async () => {
      if (!window.endpointTriage?.getReports) {
        return;
      }

      try {
        const storedReports = await window.endpointTriage.getReports();
        if (!active) {
          return;
        }

        setReports(storedReports);
        setSelectedReport(storedReports[0] ?? null);
      } catch (error) {
        if (active) {
          setExportStatus({ type: 'error', message: `Unable to load local reports: ${getErrorMessage(error)}` });
        }
      }
    };

    void loadReports();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (scanState.status !== 'running') {
      return;
    }

    const timer = window.setInterval(() => {
      setScanState((current) => {
        if (current.status !== 'running') {
          return current;
        }

        const increment = current.progress < 35 ? 6 : current.progress < 70 ? 4 : 2;
        const progress = Math.min(90, current.progress + increment);
        const lastCollectingIndex = SCAN_STEPS.length - 2;
        const stepIndex = Math.min(lastCollectingIndex, Math.floor((progress / 90) * (lastCollectingIndex + 1)));

        return {
          ...current,
          currentStep: SCAN_STEPS[stepIndex],
          progress,
        };
      });
    }, 650);

    return () => window.clearInterval(timer);
  }, [scanState.status]);

  useEffect(() => {
    if (scanState.status !== 'building-report') {
      return;
    }

    const timer = window.setTimeout(() => {
      setScanState((current) => {
        if (current.status !== 'building-report') {
          return current;
        }

        return {
          ...current,
          status: 'failed',
          currentStep: 'Report generation timed out',
          progress: Math.min(current.progress, 98),
          error: 'Report generation timed out.\nThe collector finished, but the app did not receive a valid report.',
        };
      });
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [scanState.status, scanSessionId]);

  const setFailedScan = (error: string, rawOutput?: string) => {
    setScanState((current) => ({
      ...current,
      status: 'failed',
      currentStep: 'Scan failed',
      progress: Math.min(current.progress, 98),
      error,
      rawOutput,
    }));
  };

  const handleRunScan = async () => {
    if (scanIsActive) {
      return;
    }

    const scanId = activeScanIdRef.current + 1;
    activeScanIdRef.current = scanId;

    setScreen('scan');
    setScanSessionId(scanId);
    setExportStatus(null);
    setScanState({
      status: 'running',
      currentStep: SCAN_STEPS[0],
      progress: 4,
    });

    try {
      if (!window.endpointTriage?.runScan) {
        throw new Error('Electron preload API is unavailable. Run the app through the Electron desktop runtime to start a local scan.');
      }

      const result = await window.endpointTriage.runScan();
      if (activeScanIdRef.current !== scanId) {
        return;
      }

      setScanState((current) => ({
        ...current,
        status: 'building-report',
        currentStep: 'Building report',
        progress: Math.max(current.progress, 96),
        rawOutput: result.rawOutput,
      }));

      await wait(150);
      if (activeScanIdRef.current !== scanId) {
        return;
      }

      if (!result.success) {
        setFailedScan(result.error ?? 'PowerShell collector could not complete.', result.rawOutput);
        return;
      }

      if (!result.report) {
        setFailedScan('The collector finished, but the app did not receive a valid report.', result.rawOutput);
        return;
      }

      const report = validateEndpointReport(result.report);
      setSelectedReport(report);
      setReports((currentReports) => [report, ...currentReports.filter((item) => item.reportId !== report.reportId)]);
      setExportStatus(null);
      setScanState({
        status: 'completed',
        currentStep: 'Report ready',
        progress: 100,
        report,
        rawOutput: result.rawOutput,
      });

      await wait(500);
      if (activeScanIdRef.current === scanId) {
        setScreen('report');
      }
    } catch (error) {
      if (activeScanIdRef.current === scanId) {
        setFailedScan(getErrorMessage(error));
      }
    }
  };

  const handleCancelScan = () => {
    activeScanIdRef.current += 1;
    void window.endpointTriage?.cancelScan?.().catch(() => undefined);
    setScanState((current) => ({
      ...current,
      status: 'cancelled',
      currentStep: 'Scan cancelled by user.',
      error: undefined,
    }));
    setScreen('home');
  };

  const handleOpenReport = (report: EndpointTriageReport) => {
    setSelectedReport(report);
    setExportStatus(null);
    setScreen('report');
  };

  const runReportAction = async (action: () => Promise<void>, successMessage: string) => {
    try {
      if (!window.endpointTriage) {
        throw new Error('Report export requires the Electron desktop runtime.');
      }

      await action();
      setExportStatus({ type: 'success', message: successMessage });
    } catch (error) {
      setExportStatus({ type: 'error', message: getErrorMessage(error) });
    }
  };

  const requireSelectedReport = () => {
    if (!selectedReport) {
      throw new Error('No endpoint report loaded.');
    }

    return selectedReport;
  };

  const handleExportJson = () =>
    runReportAction(() => window.endpointTriage!.exportJson(requireSelectedReport().reportId), 'JSON report exported to the local reports folder.');

  const handleExportHtml = () =>
    runReportAction(() => window.endpointTriage!.exportHtml(requireSelectedReport().reportId), 'HTML report exported to the local reports folder.');

  const handleOpenJson = () =>
    runReportAction(() => window.endpointTriage!.openJson(requireSelectedReport().reportId), 'JSON report opened in the system viewer.');

  const handleOpenReportsFolder = () => runReportAction(() => window.endpointTriage!.openReportsFolder(), 'Reports folder opened.');

  const handleNavigate = (view: AppView) => {
    if (view === 'scan') {
      handleRunScan();
      return;
    }

    setScreen(view);
  };

  return (
    <AppShell
      activeView={screen}
      onNavigate={handleNavigate}
      onRunScan={handleRunScan}
      scanIsActive={scanIsActive}
      subtitle={shellCopy.subtitle}
      title={shellCopy.title}
    >
      {screen === 'home' && (
        <HomeDashboard
          averageHealthLabel={reports.length > 0 ? getHealthLabel(averageHealthScore) : 'Healthy'}
          averageHealthScore={averageHealthScore}
          onOpenReport={handleOpenReport}
          onRunScan={handleRunScan}
          reports={reports}
          warnings={dashboardWarnings}
        />
      )}

      {screen === 'scan' && (
        <ScanProgress
          key={scanSessionId}
          onBackHome={() => setScreen('home')}
          onCancel={handleCancelScan}
          onRetry={handleRunScan}
          onViewReport={() => setScreen('report')}
          scanState={scanState}
        />
      )}

      {screen === 'report' && selectedReport && currentHealth && (
        <EndpointReport
          healthLabel={currentHealth.label}
          healthScore={currentHealth.score}
          exportStatus={exportStatus}
          onExportHtml={handleExportHtml}
          onExportJson={handleExportJson}
          onOpenJson={handleOpenJson}
          onOpenReportsFolder={handleOpenReportsFolder}
          onRunScan={handleRunScan}
          report={selectedReport}
          ticketNotes={currentTicketNotes}
          warnings={currentWarnings}
        />
      )}

      {screen === 'report' && !selectedReport && (
        <EmptyState
          action={
            <Button onClick={handleRunScan} variant="primary">
              Run New Scan
            </Button>
          }
          description="Run a new scan to generate a local diagnostic report."
          title="No endpoint report loaded."
        />
      )}

      {screen === 'history' && (
        <Panel title="Scan History" eyebrow="Local Reports">
          {reports.length > 0 ? (
            <RecentReports reports={reports} onOpenReport={handleOpenReport} />
          ) : (
            <EmptyState
              action={
                <Button onClick={handleRunScan} variant="primary">
                  Run New Scan
                </Button>
              }
              description="Run a new scan to create the first local endpoint report."
              title="No scan history yet"
            />
          )}
        </Panel>
      )}

      {screen === 'settings' && (
        <div className="max-w-3xl space-y-5">
          <Panel title="Collector" eyebrow="Local Execution">
            <p className="text-sm leading-6 text-slate-300">PowerShell collector runs locally through secure Electron IPC.</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Reports are stored locally only. No cloud uploads, accounts, telemetry, or external services are used.</p>
          </Panel>
          <Panel title="Storage" eyebrow="Reports">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="border border-slate-800 bg-slate-800/50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Storage Mode</p>
                <p className="mt-2 font-semibold text-slate-100">Local Only</p>
              </div>
              <div className="border border-slate-800 bg-slate-800/50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Collector Status</p>
                <p className="mt-2 font-semibold text-emerald-300">Ready</p>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </AppShell>
  );
}
