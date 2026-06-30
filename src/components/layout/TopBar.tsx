import { StatusBadge } from '../ui/StatusBadge';

interface TopBarProps {
  title: string;
  subtitle: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="flex h-[72px] items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge tone="success">Local Reports</StatusBadge>
        <StatusBadge tone="neutral">Windows Endpoint</StatusBadge>
      </div>
    </header>
  );
}
