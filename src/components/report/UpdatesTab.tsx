import type { EndpointTriageReport } from '../../types/triage';
import { Panel } from '../ui/Panel';
import { StatusBadge } from '../ui/StatusBadge';

interface UpdatesTabProps {
  report: EndpointTriageReport;
}

export function UpdatesTab({ report }: UpdatesTabProps) {
  return (
    <div className="space-y-6">
      <Panel title="Windows Update Status" eyebrow="Servicing">
        <div className="flex items-center justify-between border border-slate-800 bg-slate-800/50 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-100">Pending Reboot</p>
            <p className="mt-1 text-sm text-slate-400">Indicates updates or system changes are waiting for restart.</p>
          </div>
          <StatusBadge tone={report.updates.pendingReboot ? 'warning' : 'success'}>{report.updates.pendingReboot ? 'Yes' : 'No'}</StatusBadge>
        </div>
      </Panel>

      <Panel title="Recent Hotfixes" eyebrow="Patch History">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-800/70 text-xs uppercase tracking-[0.16em] text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Hotfix</th>
              <th className="px-4 py-3 font-semibold">Installed On</th>
              <th className="px-4 py-3 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {report.updates.lastHotfixes.map((hotfix) => (
              <tr key={hotfix.hotfixId}>
                <td className="px-4 py-3 font-mono text-cyan-300">{hotfix.hotfixId}</td>
                <td className="px-4 py-3 text-slate-300">{hotfix.installedOn}</td>
                <td className="px-4 py-3 text-slate-400">{hotfix.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
