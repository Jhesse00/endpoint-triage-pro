import type { EndpointTriageReport } from '../../types/triage';
import { EmptyState } from '../ui/EmptyState';
import { Panel } from '../ui/Panel';
import { StatusBadge } from '../ui/StatusBadge';

interface NetworkTabProps {
  report: EndpointTriageReport;
}

export function NetworkTab({ report }: NetworkTabProps) {
  return (
    <div className="space-y-6">
      <Panel title="Network Summary" eyebrow="Configuration">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="border border-slate-800 bg-slate-800/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Primary IP</p>
            <p className="mt-2 truncate font-mono text-slate-100">{report.network.ipAddresses[0] ?? 'Not reported'}</p>
          </div>
          <div className="border border-slate-800 bg-slate-800/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Gateway</p>
            <p className="mt-2 truncate font-mono text-slate-100">{report.network.defaultGateway || 'Not reported'}</p>
          </div>
          <div className="border border-slate-800 bg-slate-800/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Domain</p>
            <p className="mt-2 truncate text-slate-100">{report.network.domainOrWorkgroup || 'Not reported'}</p>
          </div>
          <div className="border border-slate-800 bg-slate-800/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">DNS</p>
            <p className="mt-2 truncate font-mono text-slate-100" title={report.network.dnsServers.join(', ')}>{report.network.dnsServers.join(', ') || 'None reported'}</p>
          </div>
        </div>
      </Panel>

      <Panel title="Adapters" eyebrow="Interface State">
        {report.network.adapters.length > 0 ? (
          <div className="space-y-4">
            {report.network.adapters.map((adapter) => (
              <article className="border border-slate-800 bg-slate-800/40 p-4" key={adapter.name}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{adapter.name}</h3>
                    <p className="mt-1 font-mono text-xs text-slate-500">{adapter.macAddress}</p>
                  </div>
                  <StatusBadge tone={adapter.status === 'Up' ? 'success' : 'neutral'}>{adapter.status}</StatusBadge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">IP Addresses</p>
                    <p className="mt-1 font-mono text-slate-300">{adapter.ipAddresses.length ? adapter.ipAddresses.join(', ') : 'None'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">DNS Servers</p>
                    <p className="mt-1 font-mono text-slate-300">{adapter.dnsServers.length ? adapter.dnsServers.join(', ') : 'None'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState description="The collector did not return network adapter details for this scan." title="No adapters reported" />
        )}
      </Panel>
    </div>
  );
}
