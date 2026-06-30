import type { EndpointTriageReport, TriageWarning } from '../../types/triage';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Panel } from '../ui/Panel';
import { StatusBadge } from '../ui/StatusBadge';
import { HealthScoreCard } from './HealthScoreCard';
import { RecentReports } from './RecentReports';
import { WarningCard } from './WarningCard';

interface HomeDashboardProps {
  reports: EndpointTriageReport[];
  warnings: TriageWarning[];
  averageHealthScore: number;
  averageHealthLabel: string;
  onRunScan: () => void;
  onOpenReport: (report: EndpointTriageReport) => void;
}

export function HomeDashboard({ reports, warnings, averageHealthScore, averageHealthLabel, onRunScan, onOpenReport }: HomeDashboardProps) {
  const criticalCount = warnings.filter((warning) => warning.severity === 'critical').length;
  const commonWarnings = warnings.slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-[1fr_320px] gap-6">
        <Panel className="bg-slate-900/95" title="Endpoint Triage Pro" eyebrow="Dashboard">
          <div className="grid grid-cols-[1fr_auto] gap-8">
            <div>
              <p className="max-w-2xl text-sm leading-6 text-slate-400">
                Windows endpoint diagnostics for help desk technicians. Run a local scan, review the findings, and prepare ticket-ready notes.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Button onClick={onRunScan} variant="primary">
                  Run New Scan
                </Button>
                <StatusBadge tone="info">Local Reports Only</StatusBadge>
              </div>
            </div>
            <div className="grid min-w-64 grid-cols-2 gap-3">
              <div className="border border-slate-800 bg-slate-800/50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Scans</p>
                <p className="mt-3 text-3xl font-bold text-slate-100">{reports.length}</p>
              </div>
              <div className="border border-slate-800 bg-slate-800/50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Avg Score</p>
                <p className="mt-3 text-3xl font-bold text-cyan-300">{reports.length > 0 ? averageHealthScore : 'N/A'}</p>
              </div>
            </div>
          </div>
        </Panel>

        {reports.length > 0 ? (
          <HealthScoreCard criticalCount={criticalCount} label={averageHealthLabel} score={averageHealthScore} />
        ) : (
          <Panel title="Collector Ready" eyebrow="Local Scan">
            <p className="text-sm leading-6 text-slate-300">No endpoint report is loaded yet.</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Run a new scan to generate a local diagnostic report.</p>
            <div className="mt-5">
              <Button onClick={onRunScan} size="sm" variant="primary">
                Run New Scan
              </Button>
            </div>
          </Panel>
        )}
      </section>

      <section className="grid grid-cols-[1fr_380px] gap-6">
        <Panel title="Recent Reports" eyebrow="Local History">
          {reports.length > 0 ? (
            <RecentReports reports={reports} onOpenReport={onOpenReport} />
          ) : (
            <EmptyState
              action={
                <Button onClick={onRunScan} variant="primary">
                  Run New Scan
                </Button>
              }
              description="Run a scan to create the first diagnostic report on this workstation."
              title="No reports saved"
            />
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Auto Review" eyebrow="Findings">
            {commonWarnings.length > 0 ? (
              <div className="space-y-3">
                {commonWarnings.map((warning) => (
                  <WarningCard key={warning.id} warning={warning} />
                ))}
              </div>
            ) : (
              <EmptyState description="Saved reports do not currently show recurring endpoint warnings." title="No recurring findings" />
            )}
          </Panel>

          <Panel title="Privacy Notice" eyebrow="Local Collection">
            <p className="text-sm leading-6 text-slate-300">Endpoint Triage Pro collects local device diagnostic data only.</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Reports are stored locally on this machine.</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">No passwords, files, browser history, or personal documents are collected.</p>
          </Panel>
        </div>
      </section>
    </div>
  );
}
