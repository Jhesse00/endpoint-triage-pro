import type { EndpointTriageReport } from '../../types/triage';
import { Panel } from '../ui/Panel';
import { StatusBadge } from '../ui/StatusBadge';

interface SecurityTabProps {
  report: EndpointTriageReport;
}

const enabledTone = (value: string) => (value.toLowerCase().includes('enabled') ? 'success' : 'critical');

export function SecurityTab({ report }: SecurityTabProps) {
  return (
    <div className="grid grid-cols-[1fr_360px] gap-6">
      <div className="space-y-6">
        <Panel title="Endpoint Protection" eyebrow="Security State">
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-800 bg-slate-800/50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">BitLocker</p>
                  <p className="mt-2 text-sm text-slate-300">Operating system volume protection</p>
                </div>
                <StatusBadge tone={enabledTone(report.security.bitlockerStatus)}>{report.security.bitlockerStatus}</StatusBadge>
              </div>
            </div>
            <div className="border border-slate-800 bg-slate-800/50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Defender</p>
                  <p className="mt-2 text-sm text-slate-300">Microsoft Defender Antivirus</p>
                </div>
                <StatusBadge tone={enabledTone(report.security.defenderStatus)}>{report.security.defenderStatus}</StatusBadge>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Firewall Profiles" eyebrow="Network Protection">
          <div className="grid grid-cols-3 gap-4">
            {report.security.firewallProfiles.map((profile) => (
              <div className="border border-slate-800 bg-slate-800/50 p-4" key={profile.name}>
                <p className="text-sm font-semibold text-slate-100">{profile.name}</p>
                <div className="mt-3">
                  <StatusBadge tone={profile.enabled ? 'success' : 'critical'}>{profile.enabled ? 'Enabled' : 'Disabled'}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Local Administrators" eyebrow="Privilege Review">
        <div className="space-y-3">
          {report.security.localAdmins.map((admin) => (
            <div className="border border-slate-800 bg-slate-800/50 px-3 py-2 font-mono text-sm text-slate-300" key={admin}>
              {admin}
            </div>
          ))}
        </div>
        {report.permissions.limitedFields.length > 0 && (
          <div className="mt-5 border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
            Limited fields: {report.permissions.limitedFields.join(', ')}
          </div>
        )}
      </Panel>
    </div>
  );
}
