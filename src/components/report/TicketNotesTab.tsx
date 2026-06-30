import { useState } from 'react';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { StatusBadge } from '../ui/StatusBadge';

interface TicketNotesTabProps {
  ticketNotes: string;
  onExportReport: () => Promise<void>;
  onOpenJson: () => Promise<void>;
}

export function TicketNotesTab({ ticketNotes, onExportReport, onOpenJson }: TicketNotesTabProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copyNotes = async () => {
    try {
      await navigator.clipboard.writeText(ticketNotes);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1800);
    } catch {
      setCopyState('failed');
    }
  };

  return (
    <Panel
      action={
        <div className="flex items-center gap-3">
          {copyState === 'copied' && <StatusBadge tone="success">Notes Copied</StatusBadge>}
          {copyState === 'failed' && <StatusBadge tone="critical">Copy Failed</StatusBadge>}
          <Button onClick={copyNotes} size="sm" variant="primary">
            Copy Notes
          </Button>
          <Button onClick={() => void onExportReport()} size="sm" variant="secondary">
            Export Report
          </Button>
          <Button onClick={() => void onOpenJson()} size="sm" variant="ghost">
            Open JSON
          </Button>
        </div>
      }
      title="Help Desk Ticket Notes"
      eyebrow="Ticket-Ready Summary"
    >
      <p className="mb-4 text-sm leading-6 text-slate-400">
        Review the notes, copy them into the help desk ticket, and attach the exported report when needed.
      </p>
      <textarea
        className="min-h-[500px] w-full resize-none rounded-sm border border-slate-800 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-200 outline-none focus:border-cyan-400/50"
        readOnly
        value={ticketNotes}
      />
    </Panel>
  );
}
