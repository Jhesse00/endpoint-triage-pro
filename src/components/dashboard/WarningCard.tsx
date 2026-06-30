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
  const accentClass =
    warning.severity === 'critical' ? 'border-l-red-400' : warning.severity === 'warning' ? 'border-l-amber-400' : 'border-l-cyan-400';

  return (
    <article className={`border border-l-4 border-slate-800 bg-slate-900/70 p-4 ${accentClass}`}>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-semibold text-slate-100">{warning.title}</h3>
        <StatusBadge tone={toneBySeverity[warning.severity]}>{warning.severity}</StatusBadge>
      </div>
      <div className="mt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Finding</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">{warning.description}</p>
      </div>
      <div className="mt-4 border border-slate-800 bg-slate-950/50 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Recommended Action</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">{warning.recommendedAction}</p>
      </div>
    </article>
  );
}
