import { useEffect, useRef, useState } from 'react';
import { HomeDashboard } from './components/dashboard/HomeDashboard';
import { ScanProgress } from './components/dashboard/ScanProgress';
import { AppShell } from './components/layout/AppShell';
import type { AppView } from './components/layout/Sidebar';
import { EndpointReport } from './components/report/EndpointReport';
import { calculateHealthScore, getHealthLabel } from './lib/healthScore';
import { sampleReport, sampleReports } from './lib/sampleData';
import { generateTicketNotes } from './lib/ticketNotes';
import { generateWarnings } from './lib/warningEngine';
import type { EndpointTriageReport } from './types/triage';

type Screen = 'home' | 'scan' | 'report';
type ExportStatus = { type: 'success' | 'error'; message: string } | null;

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const getAverageHealthScore = (reports: EndpointTriageReport[]) => {
  if (reports.length === 0) {
    return 100;
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

function getShellCopy(screen: Screen) {
  if (screen === 'scan') {
    return {
      title: 'Scan Progress',
      subtitle: 'PowerShell collector is running through secure Electron IPC.',
    };
  }

  if (screen === 'report') {
    return {
      title: 'Endpoint Report',
      subtitle: 'Structured triage report returned from the scan flow.',
    };
  }

  return {
    title: 'Endpoint Triage Pro',
    subtitle: 'Windows endpoint health dashboard and diagnostic console.',
  };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedReport, setSelectedReport] = useState<EndpointTriageReport>(sampleReport);
  const [reports, setReports] = useState<EndpointTriageReport[]>(sampleReports);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState('Preparing endpoint collector.');
  const [isScanning, setIsScanning] = useState(false);
  const [scanSessionId, setScanSessionId] = useState(0);
  const [exportStatus, setExportStatus] = useState<ExportStatus>(null);
  const activeScanIdRef = useRef(0);
  const shellCopy = getShellCopy(screen);
  const currentHealth = calculateHealthScore(selectedReport);
  const currentWarnings = generateWarnings(selectedReport);
  const currentTicketNotes = generateTicketNotes(selectedReport, currentWarnings);
  const averageHealthScore = getAverageHealthScore(reports);
  const dashboardWarnings = getCommonWarnings(reports);

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
        if (storedReports.length > 0) {
          setSelectedReport(storedReports[0]);
        }
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

  const handleRunScan = async () => {
    if (isScanning) {
      return;
    }

    const scanId = activeScanIdRef.current + 1;
    activeScanIdRef.current = scanId;

    setScreen('scan');
    setScanSessionId(scanId);
    setScanError(null);
    setScanStatus('Launching PowerShell collector from the Electron main process.');
    setIsScanning(true);

    try {
      if (window.endpointTriage?.runScan) {
        const report = await window.endpointTriage.runScan();
        if (activeScanIdRef.current !== scanId) {
          return;
        }

        setSelectedReport(report);
        setReports((currentReports) => [report, ...currentReports.filter((item) => item.reportId !== report.reportId)]);
        setExportStatus(null);
        setScreen('report');
        return;
      }

      setScanStatus('Electron preload API is unavailable. Showing sample data for renderer preview.');
      await wait(2200);
      if (activeScanIdRef.current !== scanId) {
        return;
      }

      setSelectedReport(sampleReport);
      setExportStatus(null);
      setScreen('report');
    } catch (error) {
      if (activeScanIdRef.current === scanId) {
        setScanError(getErrorMessage(error));
        setScanStatus('The collector stopped before a valid endpoint report was returned.');
      }
    } finally {
      if (activeScanIdRef.current === scanId) {
        setIsScanning(false);
      }
    }
  };

  const handleCancelScan = () => {
    activeScanIdRef.current += 1;
    setIsScanning(false);
    setScanError(null);
    setScanStatus('Scan cancelled by user.');
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

  const handleExportJson = () =>
    runReportAction(() => window.endpointTriage!.exportJson(selectedReport.reportId), 'JSON report exported to the local reports folder.');

  const handleExportHtml = () =>
    runReportAction(() => window.endpointTriage!.exportHtml(selectedReport.reportId), 'HTML report exported to the local reports folder.');

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
      subtitle={shellCopy.subtitle}
      title={shellCopy.title}
    >
      {screen === 'home' && (
        <HomeDashboard
          averageHealthLabel={getHealthLabel(averageHealthScore)}
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
          error={scanError}
          onBackHome={() => setScreen('home')}
          onCancel={handleCancelScan}
          onRetry={handleRunScan}
          statusText={scanStatus}
        />
      )}

      {screen === 'report' && (
        <EndpointReport
          healthLabel={currentHealth.label}
          healthScore={currentHealth.score}
          exportStatus={exportStatus}
          onExportHtml={handleExportHtml}
          onExportJson={handleExportJson}
          onOpenReportsFolder={handleOpenReportsFolder}
          onRunScan={handleRunScan}
          report={selectedReport}
          ticketNotes={currentTicketNotes}
          warnings={currentWarnings}
        />
      )}
    </AppShell>
  );
}
