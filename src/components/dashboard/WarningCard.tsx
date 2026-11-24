import type { TriageWarning } from '../../types/triage';
import { StatusBadge } from '../ui/StatusBadge';

interface WarningCardProps {
  warning: TriageWarning;
}

const severityLabel = { info: 'Info', warning: 'Warning', critical: 'Critical' } as const;

const toneBySeverity = {
  info: 'info',
  warning: 'warning',
  critical: 'critical',
} as const;

export function WarningCard({ warning }: WarningCardProps) {
  const accentClass =
    warning.severity === 'critical' ? 'border-l-red-400' : warning.severity === 'warning' ? 'border-l-amber-400' : 'border-l-cyan-400';

  return (
    <article className={`border-l-4 bg-slate-950/40 p-4 ${accentClass}`}>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-semibold text-slate-100">{warning.title}</h3>
        <StatusBadge tone={toneBySeverity[warning.severity]}>{severityLabel[warning.severity]}</StatusBadge>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{warning.description}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        <span className="font-semibold text-slate-100">What to do: </span>
        {warning.recommendedAction}
      </p>
    </article>
  );
}
