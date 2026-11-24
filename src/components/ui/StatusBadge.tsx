import type { ReactNode } from 'react';

type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'critical';

interface StatusBadgeProps {
  children: ReactNode;
  tone?: StatusTone;
}

const toneClasses: Record<StatusTone, string> = {
  neutral: 'border-slate-700 bg-slate-800/80 text-slate-300',
  info: 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200',
  success: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200',
  warning: 'border-amber-400/35 bg-amber-400/10 text-amber-200',
  critical: 'border-red-400/35 bg-red-400/10 text-red-200',
};

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
