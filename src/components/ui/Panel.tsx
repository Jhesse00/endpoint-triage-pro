import type { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  className?: string;
}

export function Panel({ children, title, action, className = '' }: PanelProps) {
  return (
    <section className={`rounded-sm border border-slate-800 bg-slate-900 ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-100">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
