interface HealthScoreCardProps {
  score: number;
  label: string;
  criticalCount: number;
}

const getScoreTone = (score: number) => {
  if (score >= 90) return 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10';
  if (score >= 75) return 'text-cyan-300 border-cyan-400/40 bg-cyan-400/10';
  if (score >= 60) return 'text-amber-300 border-amber-400/40 bg-amber-400/10';
  if (score >= 40) return 'text-orange-300 border-orange-400/40 bg-orange-400/10';
  return 'text-red-300 border-red-400/40 bg-red-400/10';
};

export function HealthScoreCard({ score, label, criticalCount }: HealthScoreCardProps) {
  return (
    <div className={`rounded-sm border p-5 ${getScoreTone(score)}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-80">Health Score</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-6xl font-black leading-none tracking-tight">{score}</p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em]">{label}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">{criticalCount}</p>
          <p className="text-xs opacity-75">Critical findings</p>
        </div>
      </div>
      <div className="mt-5 h-2 border border-slate-700 bg-slate-950/50">
        <div className="h-full bg-current" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
