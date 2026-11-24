import { useState } from 'react';
import type { ScanState, ScanStatus } from '../../types/triage';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';

interface ScanProgressProps {
  scanState: ScanState;
  onBackHome: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onViewReport: () => void;
}

export const SCAN_STEPS = [
  'Initializing collector',
  'Collecting system summary',
  'Checking network configuration',
  'Checking storage health',
  'Checking memory and CPU',
  'Checking Windows Update status',
  'Checking BitLocker',
  'Reading event logs',
  'Checking printers',
  'Checking mapped drives',
  'Collecting installed apps',
  'Building report',
];

const statusLabel: Record<ScanStatus, string> = {
  idle: 'Not started',
  running: 'Scanning',
  'building-report': 'Building report',
  completed: 'Report ready',
  failed: 'Scan failed',
  cancelled: 'Scan cancelled',
};

const barColor: Record<ScanStatus, string> = {
  idle: 'bg-slate-500',
  running: 'bg-cyan-400',
  'building-report': 'bg-cyan-400',
  completed: 'bg-emerald-400',
  failed: 'bg-red-400',
  cancelled: 'bg-amber-400',
};

// Next step for the technician, keyed off the error text from electron/ipcHandlers.ts.
// ponytail: substring match on error text; switch to error codes if the IPC layer ever returns them.
export const getFailureAdvice = (error?: string) => {
  const text = (error ?? '').toLowerCase();
  if (text.includes('script was not found')) return 'The collector script is missing from the app folder. Reinstall Endpoint Triage Pro or restore scripts\Invoke-EndpointTriage.ps1, then run the scan again.';
  if (text.includes('powershell was not found')) return 'Install Windows PowerShell 5.1 or PowerShell 7, then run the scan again.';
  if (text.includes('blocked by policy')) return 'PowerShell script execution is blocked on this PC. Ask an administrator to allow signed scripts for this app, then run the scan again.';
  if (text.includes('permission denied')) return 'Close the app, right-click it and choose Run as administrator, then run the scan again.';
  if (text.includes('timed out')) return 'Run the scan again. If it times out again, open the collector output and attach it to the ticket.';
  return 'Open the collector output for details, then run the scan again.';
};

const getCurrentStepIndex = (scanState: ScanState) => {
  if (scanState.status === 'completed') return SCAN_STEPS.length;
  if (scanState.status === 'building-report') return SCAN_STEPS.length - 1;
  const index = SCAN_STEPS.indexOf(scanState.currentStep);
  return index >= 0 ? index : Math.max(0, SCAN_STEPS.length - 1);
};

export function ScanProgress({ scanState, onBackHome, onCancel, onRetry, onViewReport }: ScanProgressProps) {
  const [showRawOutput, setShowRawOutput] = useState(false);
  const currentStepIndex = getCurrentStepIndex(scanState);
  const isActive = scanState.status === 'running' || scanState.status === 'building-report';
  const hasFailed = scanState.status === 'failed';
  const isComplete = scanState.status === 'completed';

  return (
    <div className="mx-auto max-w-4xl">
      <Panel
        action={
          isActive && (
            <Button onClick={onCancel} size="sm" variant="danger">
              Cancel Scan
            </Button>
          )
        }
        title={statusLabel[scanState.status]}
      >
        <div aria-live="polite">
          {isActive && (
            <p className="text-sm text-slate-300">
              {scanState.currentStep}. The report opens when the collector finishes, usually in under a minute.
            </p>
          )}
        </div>

        <div
          aria-label="Scan progress"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={scanState.progress}
          className="mt-4 h-2 overflow-hidden bg-slate-950 ring-1 ring-slate-800"
          role="progressbar"
        >
          <div className={`h-full ${barColor[scanState.status]}`} style={{ width: `${scanState.progress}%` }} />
        </div>

        {isComplete && (
          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-300">The report was saved on this PC.</p>
            <Button onClick={onViewReport} size="sm" variant="primary">
              View Report
            </Button>
          </div>
        )}

        {hasFailed && (
          <div className="mt-5 border-l-2 border-red-400 pl-4" role="alert">
            <p className="whitespace-pre-line text-sm font-semibold text-red-200">{scanState.error ?? 'The collector stopped without returning details.'}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{getFailureAdvice(scanState.error)}</p>
            <p className="mt-1 text-sm text-slate-400">No report was saved.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={onRetry} size="sm" variant="primary">
                Run Scan Again
              </Button>
              <Button aria-expanded={showRawOutput} onClick={() => setShowRawOutput((current) => !current)} size="sm" variant="secondary">
                {showRawOutput ? 'Hide Collector Output' : 'Show Collector Output'}
              </Button>
              <Button onClick={onBackHome} size="sm" variant="ghost">
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}

        {scanState.status === 'cancelled' && (
          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-300">The scan was cancelled. No report was saved.</p>
            <div className="flex gap-3">
              <Button onClick={onRetry} size="sm" variant="primary">
                Run Scan Again
              </Button>
              <Button onClick={onBackHome} size="sm" variant="ghost">
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}

        {showRawOutput && (
          <pre className="mt-5 max-h-72 overflow-auto whitespace-pre-wrap border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-slate-300">
            {scanState.rawOutput?.trim() || 'No collector output was captured.'}
          </pre>
        )}

        {!hasFailed && (
          <ol className="mt-6 grid grid-cols-2 gap-x-6 gap-y-1.5 border-t border-slate-800 pt-5 text-sm">
            {SCAN_STEPS.map((step, index) => {
              const done = isComplete || index < currentStepIndex;
              const current = isActive && index === currentStepIndex;
              const state = done ? 'Done' : current ? 'In progress' : 'Waiting';
              return (
                <li className={`flex items-center gap-2 ${done ? 'text-slate-300' : current ? 'font-semibold text-slate-100' : 'text-slate-400'}`} key={step}>
                  <span aria-hidden="true" className="w-4 text-center">
                    {done ? '✓' : current ? '›' : '·'}
                  </span>
                  <span>{step}</span>
                  <span className="sr-only">: {state}</span>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
    </div>
  );
}
