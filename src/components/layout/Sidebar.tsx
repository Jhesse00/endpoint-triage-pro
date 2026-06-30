import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';

export type AppView = 'home' | 'scan' | 'report';

interface SidebarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onRunScan: () => void;
}

const navItems: Array<{ id: AppView; label: string; detail: string }> = [
  { id: 'home', label: 'Home', detail: 'Scan history and summary' },
  { id: 'report', label: 'Report', detail: 'Current endpoint results' },
];

export function Sidebar({ activeView, onNavigate, onRunScan }: SidebarProps) {
  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950/95">
      <div className="border-b border-slate-800 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center border border-cyan-400/40 bg-cyan-400/10 text-sm font-black text-cyan-300">
            ETP
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-100">Endpoint</p>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Triage Pro</p>
          </div>
        </div>
        <div className="mt-5">
          <StatusBadge tone="info">Offline Desktop Tool</StatusBadge>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-5">
        {navItems.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              className={`w-full border px-4 py-3 text-left transition ${
                active
                  ? 'border-cyan-400/40 bg-cyan-400/10 text-slate-100'
                  : 'border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900 hover:text-slate-100'
              }`}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="mt-1 block text-xs text-slate-500">{item.detail}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <Button className="w-full" onClick={onRunScan} variant="primary">
          Run New Scan
        </Button>
        <p className="mt-3 text-xs leading-5 text-slate-500">Phase 1 uses sample data only. PowerShell collection is not wired yet.</p>
      </div>
    </aside>
  );
}
