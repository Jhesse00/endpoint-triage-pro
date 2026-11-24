import type { EndpointTriageReport, TriageWarning } from '../../types/triage';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Panel } from '../ui/Panel';
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
    <div className="grid grid-cols-[1fr_380px] gap-6">
      <Panel title="Recent reports">
        {reports.length > 0 ? (
          <RecentReports reports={reports} onOpenReport={onOpenReport} />
        ) : (
          <EmptyState
            action={
              <Button onClick={onRunScan} variant="primary">
                Run New Scan
              </Button>
            }
            description="No scan has been run on this PC yet. Run a scan to collect system, network, storage, security and event log data into a local report."
            title="No reports saved"
          />
        )}
      </Panel>

      <div className="space-y-6">
        {reports.length > 0 && <HealthScoreCard criticalCount={criticalCount} label={averageHealthLabel} score={averageHealthScore} />}

        <Panel title="Recurring findings">
          {commonWarnings.length > 0 ? (
            <div className="space-y-3">
              {commonWarnings.map((warning) => (
                <WarningCard key={warning.id} warning={warning} />
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-300">
              {reports.length > 0 ? 'Saved reports show no recurring warnings.' : 'Findings appear here after the first scan.'}
            </p>
          )}
        </Panel>

        <Panel title="Data collected">
          <p className="text-sm leading-6 text-slate-300">Device diagnostics only. Reports are saved on this PC and are not uploaded.</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">No passwords, files, browser history or personal documents are collected.</p>
        </Panel>
      </div>
    </div>
  );
}
