import type { EventRecord, EndpointTriageReport } from '../../types/triage';
import { Panel } from '../ui/Panel';
import { StatusBadge } from '../ui/StatusBadge';

interface EventsTabProps {
  report: EndpointTriageReport;
}

interface EventTableProps {
  title: string;
  eyebrow: string;
  events: EventRecord[];
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));

function EventTable({ title, eyebrow, events }: EventTableProps) {
  return (
    <Panel title={title} eyebrow={eyebrow}>
      <div className="space-y-3">
        {events.map((event) => (
          <article className="border border-slate-800 bg-slate-800/40 p-4" key={`${event.timeCreated}-${event.eventId}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-100">{event.providerName}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">{formatDate(event.timeCreated)} · Event ID {event.eventId}</p>
              </div>
              <StatusBadge tone={event.levelDisplayName === 'Error' ? 'critical' : 'warning'}>{event.levelDisplayName}</StatusBadge>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">{event.message}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function EventsTab({ report }: EventsTabProps) {
  return (
    <div className="space-y-6">
      <EventTable eyebrow="Security" events={report.events.failedLoginsLast24h} title="Failed Logins Last 24 Hours" />
      <EventTable eyebrow="System" events={report.events.recentSystemErrors} title="Recent System Errors" />
      <EventTable eyebrow="Application" events={report.events.recentApplicationErrors} title="Recent Application Errors" />
    </div>
  );
}
