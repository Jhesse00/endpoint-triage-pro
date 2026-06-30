import type { ReactNode } from 'react';
import { Sidebar, type AppView } from './Sidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  activeView: AppView;
  title: string;
  subtitle: string;
  children: ReactNode;
  onNavigate: (view: AppView) => void;
  onRunScan: () => void;
}

export function AppShell({ activeView, title, subtitle, children, onNavigate, onRunScan }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar activeView={activeView} onNavigate={onNavigate} onRunScan={onRunScan} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar subtitle={subtitle} title={title} />
        <main className="min-h-0 flex-1 overflow-auto px-7 py-6">{children}</main>
      </div>
    </div>
  );
}
