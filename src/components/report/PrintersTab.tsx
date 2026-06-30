import type { EndpointTriageReport } from '../../types/triage';
import { Panel } from '../ui/Panel';
import { StatusBadge } from '../ui/StatusBadge';

interface PrintersTabProps {
  report: EndpointTriageReport;
}

export function PrintersTab({ report }: PrintersTabProps) {
  return (
    <div className="space-y-6">
      <Panel title="Print Spooler" eyebrow="Service State">
        <div className="flex items-center justify-between border border-slate-800 bg-slate-800/50 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-100">Spooler Service</p>
            <p className="mt-1 text-sm text-slate-400">Print queue and printer discovery dependency.</p>
          </div>
          <StatusBadge tone={report.printers.spoolerStatus === 'Running' ? 'success' : 'critical'}>{report.printers.spoolerStatus}</StatusBadge>
        </div>
      </Panel>

      <Panel title="Installed Printers" eyebrow="Devices">
        <div className="grid grid-cols-2 gap-4">
          {report.printers.installedPrinters.map((printer) => (
            <article className="border border-slate-800 bg-slate-800/40 p-4" key={printer.name}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">{printer.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{printer.isDefault ? 'Default printer' : 'Available printer'}</p>
                </div>
                <StatusBadge tone={printer.status === 'Ready' ? 'success' : 'warning'}>{printer.status}</StatusBadge>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
