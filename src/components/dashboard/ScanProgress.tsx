import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { StatusBadge } from '../ui/StatusBadge';

interface ScanProgressProps {
  error: string | null;
  statusText: string;
  onBackHome: () => void;
  onCancel: () => void;
  onRetry: () => void;
}

const steps = [
  'Initializing collector',
  'Collecting system summary',
  'Checking network configuration',
  'Checking storage health',
  'Checking memory and CPU',
  'Checking Windows Update status',
  'Checking BitLocker',
  'Checking Defender and firewall',
  'Reading event logs',
  'Checking printers',
  'Checking mapped drives',
  'Collecting installed apps',
  'Building report',
];

export function ScanProgress({ error, statusText, onBackHome, onCancel, onRetry }: ScanProgressProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = steps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);
  const hasError = Boolean(error);

  useEffect(() => {
    if (hasError || stepIndex >= steps.length - 1) {
      return;
    }

    const timer = window.setTimeout(() => {
      setStepIndex((current) => current + 1);
    }, 430);

    return () => window.clearTimeout(timer);
  }, [hasError, stepIndex]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl items-center">
      <Panel className="w-full" title={hasError ? 'Endpoint Scan Failed' : 'Running Endpoint Scan'} eyebrow="PowerShell Collector">
        <div className="grid grid-cols-[220px_1fr] gap-8">
          <div className={`border p-6 text-center ${hasError ? 'border-red-400/30 bg-red-400/10 text-red-300' : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'}`}>
            <div className={`mx-auto h-24 w-24 border-2 ${hasError ? 'border-red-400/30' : 'animate-spin border-cyan-400/20 border-t-cyan-300'}`} />
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em]">{hasError ? 'Stopped' : 'Scanning'}</p>
            <p className="mt-2 text-4xl font-black">{progress}%</p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-100">{currentStep}</p>
                <p className="mt-1 text-sm text-slate-400">{statusText}</p>
              </div>
              <StatusBadge tone={hasError ? 'critical' : 'info'}>{hasError ? 'Error' : 'Main Process'}</StatusBadge>
            </div>

            {hasError && (
              <div className="mt-5 border border-red-400/30 bg-red-400/10 p-4">
                <p className="text-sm font-semibold text-red-200">Scan did not return a valid report.</p>
                <p className="mt-2 text-sm leading-6 text-red-100/80">{error}</p>
                <div className="mt-4 flex gap-3">
                  <Button onClick={onRetry} variant="primary">
                    Retry Scan
                  </Button>
                  <Button onClick={onBackHome} variant="secondary">
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            )}

            {!hasError && (
              <div className="mt-5 flex items-center justify-between border border-slate-800 bg-slate-800/40 p-4">
                <p className="text-sm text-slate-400">The collector is running through the Electron main process.</p>
                <Button onClick={onCancel} variant="danger">
                  Cancel Scan
                </Button>
              </div>
            )}

            <div className="mt-6 h-3 border border-slate-700 bg-slate-950">
              <div className={`h-full transition-all duration-300 ${hasError ? 'bg-red-400' : 'bg-cyan-400'}`} style={{ width: `${progress}%` }} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {steps.map((step, index) => {
                const done = index < stepIndex;
                const active = index === stepIndex;
                return (
                  <div
                    className={`border px-3 py-2 text-xs ${
                      active
                        ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200'
                        : done
                          ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300'
                          : 'border-slate-800 bg-slate-800/40 text-slate-500'
                    }`}
                    key={step}
                  >
                    {step}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
