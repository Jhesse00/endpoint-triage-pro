import type { EndpointTriageReport } from '../../types/triage';
import { Panel } from '../ui/Panel';
import { StatusBadge } from '../ui/StatusBadge';

interface OverviewTabProps {
  report: EndpointTriageReport;
}

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not reported';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export function OverviewTab({ report }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <Panel title="Device Summary">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-slate-400">Hostname</dt>
            <dd className="mt-1 font-semibold text-slate-100">{report.hostname}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Logged-In User</dt>
            <dd className="mt-1 font-semibold text-slate-100">{report.loggedInUser}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">OS</dt>
            <dd className="mt-1 text-slate-300">{report.os.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Version</dt>
            <dd className="mt-1 text-slate-300">{report.os.version} build {report.os.build}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Architecture</dt>
            <dd className="mt-1 text-slate-300">{report.os.architecture}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Scan Time</dt>
            <dd className="mt-1 text-slate-300">{formatDate(report.scanTime)}</dd>
          </div>
        </dl>
      </Panel>

      <Panel title="Hardware">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-slate-400">Manufacturer</dt>
            <dd className="mt-1 text-slate-300">{report.hardware.manufacturer}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Model</dt>
            <dd className="mt-1 text-slate-300">{report.hardware.model}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Serial Number</dt>
            <dd className="mt-1 font-mono text-slate-300">{report.hardware.serialNumber}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Permissions</dt>
            <dd className="mt-1">
              <StatusBadge tone={report.permissions.isAdmin ? 'success' : 'warning'}>{report.permissions.isAdmin ? 'Admin' : 'Standard User'}</StatusBadge>
            </dd>
          </div>
        </dl>
      </Panel>

      <Panel title="Uptime">
        <div className="grid grid-cols-[180px_1fr] gap-6">
          <div className="border border-amber-400/30 bg-amber-400/10 p-5 text-amber-200">
            <p className="text-5xl font-black">{report.uptime.uptimeDays}</p>
            <p className="mt-2 text-xs font-semibold">Days Uptime</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Last boot time</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">{formatDate(report.uptime.lastBootTime)}</p>
            <p className="mt-4 text-sm leading-6 text-slate-400">Long-running sessions can leave driver updates, policy refreshes, and pending reboots incomplete.</p>
          </div>
        </div>
      </Panel>

      <Panel title="Performance">
        <div className="space-y-5">
          <div>
            <p className="text-xs text-slate-400">CPU</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{report.performance.cpuName}</p>
            <p className="mt-1 text-sm text-slate-400">Current load: {report.performance.cpuLoadPercent === null ? 'Not reported' : `${report.performance.cpuLoadPercent}%`}</p>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-slate-100">Memory</span>
              <span className="text-slate-400">{report.performance.ramUsedGB} GB / {report.performance.ramTotalGB} GB</span>
            </div>
            <div className="mt-2 h-3 border border-slate-700 bg-slate-950">
              <div className="h-full bg-cyan-400" style={{ width: `${report.performance.ramUsagePercent}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-400">{report.performance.ramUsagePercent}% used</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
