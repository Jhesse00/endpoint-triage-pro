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
                Windows endpoint health dashboard and help desk diagnostic console. Scan results are rendered from local report data.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Button onClick={onRunScan} variant="primary">
                  Run New Scan
                </Button>
                <StatusBadge tone="info">Reports stay on this machine</StatusBadge>
              </div>
            </div>
            <div className="grid min-w-64 grid-cols-2 gap-3">
              <div className="border border-slate-800 bg-slate-800/50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Scans</p>
                <p className="mt-3 text-3xl font-bold text-slate-100">{reports.length}</p>
              </div>
              <div className="border border-slate-800 bg-slate-800/50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Avg Score</p>
                <p className="mt-3 text-3xl font-bold text-cyan-300">{averageHealthScore}</p>
              </div>
            </div>
          </div>
        </Panel>

        <HealthScoreCard criticalCount={criticalCount} label={averageHealthLabel} score={averageHealthScore} />
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
              description="No local reports are stored yet. Run a scan to create the first endpoint report on this machine."
              title="No local reports"
            />
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Common Warnings" eyebrow="Generated Findings">
            {commonWarnings.length > 0 ? (
              <div className="space-y-3">
                {commonWarnings.map((warning) => (
                  <WarningCard key={warning.id} warning={warning} />
                ))}
              </div>
            ) : (
              <EmptyState description="The current report set does not contain generated warnings." title="No common warnings" />
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
