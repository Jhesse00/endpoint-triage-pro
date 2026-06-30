import { useState } from 'react';
import type { ScanState, ScanStatus } from '../../types/triage';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { StatusBadge } from '../ui/StatusBadge';

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

const toneByStatus: Record<ScanStatus, 'neutral' | 'info' | 'success' | 'warning' | 'critical'> = {
  idle: 'neutral',
  running: 'info',
  'building-report': 'info',
  completed: 'success',
  failed: 'critical',
  cancelled: 'warning',
};

const statusLabel: Record<ScanStatus, string> = {
  idle: 'Ready',
  running: 'Collecting endpoint data',
  'building-report': 'Building report',
  completed: 'Report Ready',
  failed: 'Scan Failed',
  cancelled: 'Scan Cancelled',
};

const getProgressColor = (status: ScanStatus) => {
  if (status === 'completed') return '#34d399';
  if (status === 'failed') return '#f87171';
  if (status === 'cancelled') return '#fbbf24';
  return '#22d3ee';
};

const getCurrentStepIndex = (scanState: ScanState) => {
  if (scanState.status === 'completed') {
    return SCAN_STEPS.length;
  }

  if (scanState.status === 'building-report') {
    return SCAN_STEPS.length - 1;
  }

  const index = SCAN_STEPS.indexOf(scanState.currentStep);
  return index >= 0 ? index : Math.max(0, SCAN_STEPS.length - 1);
};

export function ScanProgress({ scanState, onBackHome, onCancel, onRetry, onViewReport }: ScanProgressProps) {
  const [showRawOutput, setShowRawOutput] = useState(false);
  const currentStepIndex = getCurrentStepIndex(scanState);
  const progressColor = getProgressColor(scanState.status);
  const isActive = scanState.status === 'running' || scanState.status === 'building-report';
  const hasFailed = scanState.status === 'failed';
  const isComplete = scanState.status === 'completed';

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-100">Scan Progress</h2>
        <p className="mt-1 text-sm text-slate-400">Running local Windows endpoint triage scan.</p>
      </div>

      <Panel className="bg-slate-900/95" title="PowerShell Collector" eyebrow="Local Endpoint Scan">
        <div className="grid grid-cols-[210px_1fr] gap-6">
          <div className="flex flex-col items-center justify-center border border-slate-800 bg-slate-950/70 p-5 text-center">
            <div
              className="grid h-32 w-32 place-items-center rounded-full border border-slate-800"
              style={{ background: `conic-gradient(${progressColor} ${scanState.progress * 3.6}deg, rgba(30, 41, 59, 0.95) 0deg)` }}
            >
              <div className="grid h-24 w-24 place-items-center rounded-full border border-slate-800 bg-slate-950">
                <div>
                  <p className="text-3xl font-black tracking-tight text-slate-100">{scanState.progress}%</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Progress</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Collector State</p>
            <div className="mt-2">
              <StatusBadge tone={toneByStatus[scanState.status]}>{statusLabel[scanState.status]}</StatusBadge>
            </div>
          </div>

          <div className="min-w-0">
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-slate-800 bg-slate-800/40 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
                <p className="mt-2 text-sm font-semibold text-slate-100">{statusLabel[scanState.status]}</p>
              </div>
              <div className="border border-slate-800 bg-slate-800/40 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Progress</p>
                <p className="mt-2 text-sm font-semibold text-slate-100">{scanState.progress}%</p>
              </div>
              <div className="border border-slate-800 bg-slate-800/40 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current Step</p>
                <p className="mt-2 truncate text-sm font-semibold text-slate-100">{scanState.currentStep}</p>
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-950 ring-1 ring-slate-800">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${scanState.progress}%`, backgroundColor: progressColor }} />
            </div>

            {isActive && (
              <div className="mt-5 flex items-center justify-between border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Final transition waits for a valid report from the Electron main process.</p>
                <Button onClick={onCancel} size="sm" variant="danger">
                  Cancel Scan
                </Button>
              </div>
            )}

            {isComplete && (
              <div className="mt-5 flex items-center justify-between border border-emerald-400/30 bg-emerald-400/10 p-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-200">Scan Complete</p>
                  <p className="mt-1 text-sm text-emerald-100/80">Report generated successfully.</p>
                </div>
                <Button onClick={onViewReport} size="sm" variant="primary">
                  View Report
                </Button>
              </div>
            )}

            {hasFailed && (
              <div className="mt-5 border border-red-400/30 bg-red-400/10 p-4">
                <p className="text-sm font-semibold text-red-200">PowerShell collector could not complete.</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-red-100/85">{scanState.error ?? 'No error details were returned.'}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button onClick={onRetry} size="sm" variant="primary">
                    Retry Scan
                  </Button>
                  <Button onClick={() => setShowRawOutput((current) => !current)} size="sm" variant="secondary">
                    View Raw Output
                  </Button>
                  <Button onClick={onBackHome} size="sm" variant="ghost">
                    Back Home
                  </Button>
                </div>
              </div>
            )}

            {scanState.status === 'cancelled' && (
              <div className="mt-5 flex items-center justify-between border border-amber-400/30 bg-amber-400/10 p-4">
                <p className="text-sm text-amber-100">Scan cancelled by user.</p>
                <div className="flex gap-3">
                  <Button onClick={onRetry} size="sm" variant="primary">
                    Retry Scan
                  </Button>
                  <Button onClick={onBackHome} size="sm" variant="ghost">
                    Back Home
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-800 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Checklist</p>
          <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
            {SCAN_STEPS.map((step, index) => {
              const done = scanState.status === 'completed' || index < currentStepIndex;
              const current = isActive && index === currentStepIndex;
              const failed = hasFailed && index === currentStepIndex;
              const icon = failed ? 'x' : done ? '✓' : current ? '→' : '○';

              return (
                <div
                  className={`flex items-center gap-3 rounded-sm border px-3 py-2 text-sm ${
                    failed
                      ? 'border-red-400/30 bg-red-400/10 text-red-200'
                      : done
                        ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300'
                        : current
                          ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
                          : 'border-slate-800 bg-slate-950/40 text-slate-500'
                  }`}
                  key={step}
                >
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs ${current ? 'animate-pulse bg-cyan-400 text-slate-950' : 'bg-slate-900'}`}>
                    {icon}
                  </span>
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        </div>

        {showRawOutput && (
          <div className="mt-5 border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Raw Collector Output</p>
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-300">
              {scanState.rawOutput?.trim() || 'No raw collector output was captured.'}
            </pre>
          </div>
        )}
      </Panel>
    </div>
  );
}
