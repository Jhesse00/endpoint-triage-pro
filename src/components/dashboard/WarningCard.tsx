import type { TriageWarning } from '../../types/triage';
import { StatusBadge } from '../ui/StatusBadge';

interface WarningCardProps {
  warning: TriageWarning;
}

const toneBySeverity = {
  info: 'info',
  warning: 'warning',
  critical: 'critical',
} as const;

export function WarningCard({ warning }: WarningCardProps) {
  return (
    <article className="border border-slate-800 bg-slate-800/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-semibold text-slate-100">{warning.title}</h3>
        <StatusBadge tone={toneBySeverity[warning.severity]}>{warning.severity}</StatusBadge>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{warning.description}</p>
      <div className="mt-4 border-l-2 border-cyan-400/50 pl-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">Recommended Action</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">{warning.recommendedAction}</p>
      </div>
    </article>
  );
}
