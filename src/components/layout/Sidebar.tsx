import { Button } from '../ui/Button';

export type AppView = 'home' | 'scan' | 'report' | 'history' | 'settings';

interface SidebarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onRunScan: () => void;
  scanIsActive: boolean;
}

const navItems: Array<{ id: AppView; label: string; detail: string }> = [
  { id: 'home', label: 'Dashboard', detail: 'Summary and recent findings' },
  { id: 'report', label: 'Current Report', detail: 'Endpoint health and notes' },
  { id: 'history', label: 'Scan History', detail: 'Saved local reports' },
  { id: 'settings', label: 'Settings', detail: 'Collector and storage' },
];

export function Sidebar({ activeView, onNavigate, onRunScan, scanIsActive }: SidebarProps) {
  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 px-5 py-5">
        <h1 className="text-sm font-semibold text-slate-100">Endpoint Triage Pro</h1>
      </div>

      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                aria-current={active ? 'page' : undefined}
                className={`w-full rounded-sm border-l-2 px-3 py-2 text-left transition-colors ${
                  active ? 'border-l-cyan-400 bg-slate-800 text-slate-100' : 'border-l-transparent text-slate-300 hover:bg-slate-900 hover:text-slate-100'
                }`}
                key={item.id}
                onClick={() => onNavigate(item.id)}
                type="button"
              >
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="block truncate text-xs text-slate-400">{item.detail}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-800 p-4">
        <Button className="w-full" disabled={scanIsActive} onClick={onRunScan} size="sm" variant="primary">
          {scanIsActive ? 'Scan in Progress' : 'Run New Scan'}
        </Button>

        <div className="mt-4 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Storage</span>
            <span className="font-semibold text-slate-300">Local Only</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Version</span>
            <span className="font-semibold text-slate-300">0.1.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
