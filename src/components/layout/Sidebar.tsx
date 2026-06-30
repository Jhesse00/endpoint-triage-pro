import { Button } from '../ui/Button';

export type AppView = 'home' | 'scan' | 'report' | 'history' | 'settings';

interface SidebarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onRunScan: () => void;
  scanIsActive: boolean;
}

const navItems: Array<{ id: AppView; label: string; detail: string; icon: string }> = [
  { id: 'home', label: 'Dashboard', detail: 'Summary and recent findings', icon: 'D' },
  { id: 'report', label: 'Current Report', detail: 'Endpoint health and notes', icon: 'R' },
  { id: 'history', label: 'Scan History', detail: 'Saved local reports', icon: 'H' },
  { id: 'settings', label: 'Settings', detail: 'Collector and storage', icon: 'S' },
];

export function Sidebar({ activeView, onNavigate, onRunScan, scanIsActive }: SidebarProps) {
  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-sm border border-cyan-400/30 bg-cyan-400/10 text-xs font-black tracking-[0.16em] text-cyan-200">
            ETP
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-slate-100">Endpoint Triage Pro</h1>
            <p className="mt-1 text-xs text-slate-500">Windows Endpoint Diagnostic Tool</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">Navigation</p>
        <div className="mt-3 space-y-1.5">
          {navItems.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                className={`w-full rounded-sm border px-3 py-3 text-left transition ${
                  active
                    ? 'border-cyan-400/30 bg-cyan-400/10 text-slate-100 shadow-[inset_3px_0_0_rgba(34,211,238,0.75)]'
                    : 'border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/80 hover:text-slate-100'
                }`}
                key={item.id}
                onClick={() => onNavigate(item.id)}
                type="button"
              >
                <span className="flex items-center gap-3">
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-sm border text-[11px] font-bold ${active ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200' : 'border-slate-800 bg-slate-900 text-slate-500'}`}>
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-1 block truncate text-xs text-slate-500">{item.detail}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-800 p-4">
        <Button className="w-full" disabled={scanIsActive} onClick={onRunScan} size="sm" variant="primary">
          {scanIsActive ? 'Scan in Progress' : 'Run New Scan'}
        </Button>

        <div className="mt-4 space-y-2 border border-slate-800 bg-slate-900/50 p-3 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Collector</span>
            <span className="font-semibold text-emerald-300">Ready</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Storage</span>
            <span className="font-semibold text-slate-300">Local Only</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Version</span>
            <span className="font-semibold text-slate-300">0.1.0</span>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          The PowerShell collector runs on this workstation. Reports stay local.
        </p>
      </div>
    </aside>
  );
}
