import type { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}

export function Panel({ children, title, eyebrow, action, className = '' }: PanelProps) {
  return (
    <section className={`border border-slate-800 bg-slate-900 shadow-panel ${className}`}>
      {(title || eyebrow || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
          <div>
            {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400">{eyebrow}</p>}
            {title && <h2 className="mt-1 text-base font-semibold text-slate-100">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
