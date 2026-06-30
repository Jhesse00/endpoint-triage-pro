import type { ReactNode } from 'react';

type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'critical';

interface StatusBadgeProps {
  children: ReactNode;
  tone?: StatusTone;
}

const toneClasses: Record<StatusTone, string> = {
  neutral: 'border-slate-700 bg-slate-800/70 text-slate-300',
  info: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  critical: 'border-red-400/30 bg-red-400/10 text-red-300',
};

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
