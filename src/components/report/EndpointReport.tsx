import { useState } from 'react';
import type { EndpointTriageReport, TriageWarning } from '../../types/triage';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Panel } from '../ui/Panel';
import { StatusBadge } from '../ui/StatusBadge';
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
  onOpenJson: () => Promise<void>;
  onOpenReportsFolder: () => Promise<void>;
  onRunScan: () => void;
}

interface SummaryCardProps {
  label: string;
  value: string;
  detail?: string;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'critical';
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

const toneClasses: Record<NonNullable<SummaryCardProps['tone']>, string> = {
  neutral: 'text-slate-100',
  info: 'text-cyan-300',
  success: 'text-emerald-300',
  warning: 'text-amber-300',
  critical: 'text-red-300',
};

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unavailable';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const getHealthTone = (score: number): SummaryCardProps['tone'] => {
  if (score >= 90) return 'success';
  if (score >= 75) return 'info';
  if (score >= 60) return 'warning';
  return 'critical';
};

const getDiskFreeSummary = (report: EndpointTriageReport): { value: string; detail: string; tone: NonNullable<SummaryCardProps['tone']> } => {
  const drive = report.storage.drives.find((item) => item.name.toLowerCase().startsWith('c')) ?? report.storage.drives[0];

  if (!drive) {
    return { value: 'Unavailable', detail: 'No local disk data returned', tone: 'neutral' as const };
  }

  const tone: NonNullable<SummaryCardProps['tone']> = drive.freeGB < 10 || drive.freePercent < 10 ? 'critical' : drive.freeGB < 25 || drive.freePercent < 20 ? 'warning' : 'success';
  return {
    value: `${drive.freeGB.toFixed(1)} GB`,
    detail: `${drive.name} free, ${drive.freePercent.toFixed(1)}% available`,
    tone,
  };
};

function SummaryCard({ label, value, detail, tone = 'neutral' }: SummaryCardProps) {
  return (
    <div className="border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${toneClasses[tone]}`}>{value}</p>
      {detail && <p className="mt-1 truncate text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

export function EndpointReport({
  report,
  warnings,
  healthScore,
  healthLabel,
  ticketNotes,
  exportStatus,
  onExportHtml,
  onExportJson,
  onOpenJson,
  onOpenReportsFolder,
  onRunScan,
}: EndpointReportProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const criticalCount = warnings.filter((warning) => warning.severity === 'critical').length;
  const diskFree = getDiskFreeSummary(report);
  const failedLogins = report.events.failedLoginsLast24h.length;
  const healthTone = getHealthTone(healthScore);

  return (
    <div className="space-y-5">
      <Panel className="bg-slate-900/95">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400">Endpoint Report</p>
            <h2 className="mt-2 truncate text-3xl font-bold tracking-tight text-slate-100">{report.hostname}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {report.hostname} · {report.loggedInUser} · {report.os.name}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <StatusBadge tone={healthTone}>Status: {healthLabel}</StatusBadge>
              <StatusBadge tone={healthTone}>Health Score: {healthScore} / 100</StatusBadge>
              <StatusBadge tone="neutral">Generated: {formatDate(report.scanTime)}</StatusBadge>
            </div>
            {report.status === 'PermissionRequired' && (
              <div className="mt-4 border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                {report.message ?? 'Run as administrator for full results.'}
              </div>
            )}
          </div>

          <div className="flex w-[360px] shrink-0 flex-wrap justify-end gap-2">
            <Button onClick={onRunScan} size="sm" variant="primary">
              Run New Scan
            </Button>
            <Button onClick={() => void onExportJson()} size="sm" variant="secondary">
              Export JSON
            </Button>
            <Button onClick={() => void onExportHtml()} size="sm" variant="secondary">
              Export Report
            </Button>
            <Button onClick={() => void onOpenJson()} size="sm" variant="ghost">
              Open JSON
            </Button>
            <Button onClick={() => void onOpenReportsFolder()} size="sm" variant="ghost">
              Open Folder
            </Button>
            {exportStatus && (
              <div className={`w-full border p-2 text-right text-xs ${exportStatus.type === 'success' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-red-400/30 bg-red-400/10 text-red-200'}`}>
                {exportStatus.message}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-6 gap-3">
          <SummaryCard detail={healthLabel} label="Health Score" tone={healthTone} value={`${healthScore} / 100`} />
          <SummaryCard detail="Auto-generated findings" label="Critical Warnings" tone={criticalCount > 0 ? 'critical' : 'success'} value={`${criticalCount}`} />
          <SummaryCard detail="Days since last boot" label="Uptime" tone={report.uptime.uptimeDays > 14 ? 'warning' : 'success'} value={`${report.uptime.uptimeDays}d`} />
          <SummaryCard detail={diskFree.detail} label="Disk Free" tone={diskFree.tone} value={diskFree.value} />
          <SummaryCard detail="Windows servicing state" label="Pending Reboot" tone={report.updates.pendingReboot ? 'warning' : 'success'} value={report.updates.pendingReboot ? 'Yes' : 'No'} />
          <SummaryCard detail="Last 24 hours" label="Failed Logins" tone={failedLogins > 0 ? 'warning' : 'success'} value={`${failedLogins}`} />
        </div>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)_350px] gap-5">
        <div className="min-w-0 space-y-5">
          <div className="flex overflow-x-auto border border-slate-800 bg-slate-900 p-1">
            {tabs.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <button
                  className={`whitespace-nowrap rounded-sm border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                    active
                      ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
                      : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-100'
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
          {activeTab === 'ticket-notes' && <TicketNotesTab onExportReport={onExportHtml} onOpenJson={onOpenJson} ticketNotes={ticketNotes} />}
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
