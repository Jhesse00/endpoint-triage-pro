import type { EndpointTriageReport } from '../../types/triage';
import { EmptyState } from '../ui/EmptyState';
import { Panel } from '../ui/Panel';
import { StatusBadge } from '../ui/StatusBadge';

interface DrivesTabProps {
  report: EndpointTriageReport;
}

export function DrivesTab({ report }: DrivesTabProps) {
  return (
    <Panel title="Mapped Drives" eyebrow="Network Shares">
      {report.mappedDrives.length > 0 ? (
        <div className="space-y-3">
          {report.mappedDrives.map((drive) => (
            <article className="grid grid-cols-[100px_1fr_auto] items-center gap-4 border border-slate-800 bg-slate-800/40 p-4" key={drive.driveLetter}>
              <div className="font-mono text-lg font-semibold text-slate-100">{drive.driveLetter}</div>
              <div className="truncate font-mono text-sm text-slate-300" title={drive.remotePath}>{drive.remotePath}</div>
              <StatusBadge tone={drive.status === 'OK' ? 'success' : 'warning'}>{drive.status}</StatusBadge>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState description="No mapped drives were returned for this scan." title="No mapped drives reported" />
      )}
    </Panel>
  );
}
