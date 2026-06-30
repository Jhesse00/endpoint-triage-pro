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
          {copyState === 'copied' && <StatusBadge tone="success">Copied</StatusBadge>}
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
      eyebrow="Generated Technician Summary"
    >
      <textarea
        className="min-h-[520px] w-full resize-none border border-slate-800 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-200 outline-none focus:border-cyan-400/50"
        readOnly
        value={ticketNotes}
      />
    </Panel>
  );
}
