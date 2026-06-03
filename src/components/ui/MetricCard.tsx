import type { ReactNode } from 'react';

const ACCENTS = {
  cash: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
  fans: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
  rep: 'from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-300',
  stock: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
  sales: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
} as const;

export function MetricCard({
  label,
  value,
  sub,
  icon,
  accent = 'cash',
  className = '',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  accent?: keyof typeof ACCENTS;
  className?: string;
}) {
  return (
    <div
      className={`card-shine group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 transition hover:scale-[1.02] hover:shadow-lg ${ACCENTS[accent]} ${className}`}
    >
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl transition group-hover:bg-white/10" />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">{label}</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-fg">{value}</p>
          {sub && <p className="mt-0.5 text-xs opacity-60">{sub}</p>}
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/20 text-xl backdrop-blur-sm">
          {icon}
        </span>
      </div>
    </div>
  );
}
