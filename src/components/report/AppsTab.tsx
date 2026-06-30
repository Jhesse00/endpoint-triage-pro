import type { EndpointTriageReport } from '../../types/triage';
import { Panel } from '../ui/Panel';

interface AppsTabProps {
  report: EndpointTriageReport;
}

export function AppsTab({ report }: AppsTabProps) {
  return (
    <Panel title="Installed Applications" eyebrow="Software Inventory">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-800/70 text-xs uppercase tracking-[0.16em] text-slate-400">
          <tr>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Version</th>
            <th className="px-4 py-3 font-semibold">Publisher</th>
            <th className="px-4 py-3 font-semibold">Install Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {report.installedApps.map((app) => (
            <tr className="hover:bg-slate-800/50" key={`${app.name}-${app.version}`}>
              <td className="px-4 py-3 font-semibold text-slate-100">{app.name}</td>
              <td className="px-4 py-3 font-mono text-slate-300">{app.version}</td>
              <td className="px-4 py-3 text-slate-400">{app.publisher}</td>
              <td className="px-4 py-3 text-slate-400">{app.installDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
