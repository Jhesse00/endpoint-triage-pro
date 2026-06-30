import type { EndpointTriageReport } from '../../types/triage';
import { EmptyState } from '../ui/EmptyState';
import { Panel } from '../ui/Panel';
import { StatusBadge } from '../ui/StatusBadge';

interface StorageTabProps {
  report: EndpointTriageReport;
}

const getDriveTone = (freePercent: number, freeGB: number) => {
  if (freePercent < 10 || freeGB < 10) return 'critical';
  if (freePercent < 20 || freeGB < 25) return 'warning';
  return 'success';
};

export function StorageTab({ report }: StorageTabProps) {
  return (
    <Panel title="Storage Health" eyebrow="Disk Space">
      {report.storage.drives.length > 0 ? (
        <div className="space-y-4">
          {report.storage.drives.map((drive) => {
            const usedPercent = Math.max(0, Math.min(100, 100 - drive.freePercent));
            const tone = getDriveTone(drive.freePercent, drive.freeGB);
            return (
              <article className="border border-slate-800 bg-slate-800/40 p-4" key={drive.name}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">{drive.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{drive.fileSystem} · {drive.totalGB} GB total</p>
                  </div>
                  <StatusBadge tone={tone}>{drive.freePercent.toFixed(1)}% free</StatusBadge>
                </div>
                <div className="mt-4 h-3 border border-slate-700 bg-slate-950">
                  <div className={tone === 'critical' ? 'h-full bg-red-400' : tone === 'warning' ? 'h-full bg-amber-400' : 'h-full bg-emerald-400'} style={{ width: `${usedPercent}%` }} />
                </div>
                <div className="mt-3 flex justify-between text-sm text-slate-400">
                  <span>{(drive.totalGB - drive.freeGB).toFixed(1)} GB used</span>
                  <span>{drive.freeGB.toFixed(1)} GB free</span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState description="No storage volume records were returned for this scan." title="No storage records" />
      )}
    </Panel>
  );
}
