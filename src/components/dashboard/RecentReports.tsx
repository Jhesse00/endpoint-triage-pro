import type { EndpointTriageReport } from '../../types/triage';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';

interface RecentReportsProps {
  reports: EndpointTriageReport[];
  onOpenReport: (report: EndpointTriageReport) => void;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export function RecentReports({ reports, onOpenReport }: RecentReportsProps) {
  return (
    <div className="overflow-hidden border border-slate-800">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-800/70 text-xs uppercase tracking-[0.16em] text-slate-400">
          <tr>
            <th className="px-4 py-3 font-semibold">Endpoint</th>
            <th className="px-4 py-3 font-semibold">User</th>
            <th className="px-4 py-3 font-semibold">Scan Time</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 text-right font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/70">
          {reports.map((report, index) => (
            <tr className="hover:bg-slate-800/60" key={report.reportId}>
              <td className="px-4 py-4 font-semibold text-slate-100">{report.hostname}</td>
              <td className="px-4 py-4 text-slate-300">{report.loggedInUser}</td>
              <td className="px-4 py-4 text-slate-400">{formatDate(report.scanTime)}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={index === 0 ? 'info' : 'neutral'}>{index === 0 ? 'Latest' : 'Saved'}</StatusBadge>
              </td>
              <td className="px-4 py-4 text-right">
                <Button onClick={() => onOpenReport(report)} size="sm" variant="ghost">
                  Open Report
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
