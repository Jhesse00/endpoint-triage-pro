import { useState } from 'react';
import type { EndpointTriageReport, TriageWarning } from '../../types/triage';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Panel } from '../ui/Panel';
import { StatusBadge } from '../ui/StatusBadge';
import { HealthScoreCard } from '../dashboard/HealthScoreCard';
import { WarningCard } from '../dashboard/WarningCard';
import { AppsTab } from './AppsTab';
import { DrivesTab } from './DrivesTab';
import { EventsTab } from './EventsTab';
import { NetworkTab } from './NetworkTab';
import { OverviewTab } from './OverviewTab';
import { PrintersTab } from './PrintersTab';
import { SecurityTab } from './SecurityTab';
import { StorageTab } from './StorageTab';
import { TicketNotesTab } from './TicketNotesTab';
import { UpdatesTab } from './UpdatesTab';

type ReportTab = 'overview' | 'network' | 'storage' | 'security' | 'updates' | 'events' | 'printers' | 'drives' | 'apps' | 'ticket-notes';

interface EndpointReportProps {
  report: EndpointTriageReport;
  warnings: TriageWarning[];
  healthScore: number;
  healthLabel: string;
  ticketNotes: string;
  exportStatus: { type: 'success' | 'error'; message: string } | null;
  onExportHtml: () => Promise<void>;
  onExportJson: () => Promise<void>;
  onOpenReportsFolder: () => Promise<void>;
  onRunScan: () => void;
}

const tabs: Array<{ id: ReportTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'network', label: 'Network' },
  { id: 'storage', label: 'Storage' },
  { id: 'security', label: 'Security' },
  { id: 'updates', label: 'Updates' },
  { id: 'events', label: 'Events' },
  { id: 'printers', label: 'Printers' },
  { id: 'drives', label: 'Drives' },
  { id: 'apps', label: 'Apps' },
  { id: 'ticket-notes', label: 'Ticket Notes' },
];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export function EndpointReport({
  report,
  warnings,
  healthScore,
  healthLabel,
  ticketNotes,
  exportStatus,
  onExportHtml,
  onExportJson,
  onOpenReportsFolder,
  onRunScan,
}: EndpointReportProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const criticalCount = warnings.filter((warning) => warning.severity === 'critical').length;

  return (
    <div className="space-y-6">
      <Panel className="bg-slate-900/95">
        <div className="grid grid-cols-[1fr_320px] gap-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400">Endpoint Report</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">{report.hostname}</h2>
                <p className="mt-2 text-sm text-slate-400">{report.loggedInUser} · {report.os.name} {report.os.version} · build {report.os.build}</p>
                {report.status === 'PermissionRequired' && (
                  <div className="mt-4 border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                    {report.message ?? 'Run as administrator for full results.'}
                  </div>
                )}
              </div>
              <div className="flex max-w-sm flex-wrap justify-end gap-2">
                <Button onClick={onRunScan} variant="primary">Run New Scan</Button>
                <Button onClick={() => void onExportJson()} variant="secondary">Export JSON</Button>
                <Button onClick={() => void onExportHtml()} variant="secondary">Export HTML</Button>
                <Button onClick={() => void onOpenReportsFolder()} variant="ghost">Open Folder</Button>
                {exportStatus && (
                  <div className={`w-full border p-2 text-right text-xs ${exportStatus.type === 'success' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-red-400/30 bg-red-400/10 text-red-200'}`}>
                    {exportStatus.message}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-3">
              <div className="border border-slate-800 bg-slate-800/50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Scan Time</p>
                <p className="mt-2 text-sm font-semibold text-slate-100">{formatDate(report.scanTime)}</p>
              </div>
              <div className="border border-slate-800 bg-slate-800/50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Critical Warnings</p>
                <p className="mt-2 text-2xl font-bold text-red-300">{criticalCount}</p>
              </div>
              <div className="border border-slate-800 bg-slate-800/50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pending Reboot</p>
                <div className="mt-2">
                  <StatusBadge tone={report.updates.pendingReboot ? 'warning' : 'success'}>{report.updates.pendingReboot ? 'Yes' : 'No'}</StatusBadge>
                </div>
              </div>
              <div className="border border-slate-800 bg-slate-800/50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Report ID</p>
                <p className="mt-2 truncate font-mono text-xs text-slate-300">{report.reportId}</p>
              </div>
            </div>
          </div>

          <HealthScoreCard criticalCount={criticalCount} label={healthLabel} score={healthScore} />
        </div>
      </Panel>

      <div className="grid grid-cols-[1fr_360px] gap-6">
        <div className="min-w-0 space-y-5">
          <div className="flex overflow-x-auto border border-slate-800 bg-slate-900 p-1">
            {tabs.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <button
                  className={`whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                    active ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'overview' && <OverviewTab report={report} />}
          {activeTab === 'network' && <NetworkTab report={report} />}
          {activeTab === 'storage' && <StorageTab report={report} />}
          {activeTab === 'security' && <SecurityTab report={report} />}
          {activeTab === 'updates' && <UpdatesTab report={report} />}
          {activeTab === 'events' && <EventsTab report={report} />}
          {activeTab === 'printers' && <PrintersTab report={report} />}
          {activeTab === 'drives' && <DrivesTab report={report} />}
          {activeTab === 'apps' && <AppsTab report={report} />}
          {activeTab === 'ticket-notes' && <TicketNotesTab ticketNotes={ticketNotes} />}
        </div>

        <Panel title="Warnings" eyebrow="Auto Review">
          {warnings.length > 0 ? (
            <div className="space-y-3">
              {warnings.map((warning) => (
                <WarningCard key={warning.id} warning={warning} />
              ))}
            </div>
          ) : (
            <EmptyState description="The warning engine did not find immediate health warnings in this report." title="No warnings generated" />
          )}
        </Panel>
      </div>
    </div>
  );
}
