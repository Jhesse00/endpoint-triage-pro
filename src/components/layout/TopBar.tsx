interface TopBarProps {
  title: string;
  subtitle: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="flex h-[72px] items-center border-b border-slate-800 bg-slate-950 px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
    </header>
  );
}
