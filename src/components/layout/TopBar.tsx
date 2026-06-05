import { useGameStore } from '../../store/useGameStore';

const RANKS = [
  { min: 0, label: 'Garage Starter', icon: '🔧' },
  { min: 50000, label: 'Indie Maker', icon: '🛠️' },
  { min: 150000, label: 'Startup Pro', icon: '🚀' },
  { min: 500000, label: 'Tech Contender', icon: '⚡' },
  { min: 1500000, label: 'Market Disruptor', icon: '💎' },
  { min: 5000000, label: 'Industry Titan', icon: '👑' },
];

const SPEED_OPTIONS = [1, 2, 3, 5];

function getRank(valuation: number) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (valuation >= r.min) rank = r;
  }
  return rank;
}

export function TopBar() {
  const companyName = useGameStore((s) => s.companyName);
  const cash = useGameStore((s) => s.cash);
  const fans = useGameStore((s) => s.fans);
  const unlockedTech = useGameStore((s) => s.unlockedTech);
  const companyValuation = useGameStore((s) => s.companyValuation);
  const month = useGameStore((s) => s.month);
  const day = useGameStore((s) => s.day);
  const advanceDay = useGameStore((s) => s.advanceDay);
  const autoAdvance = useGameStore((s) => s.autoAdvance);
  const autoAdvanceSpeed = useGameStore((s) => s.autoAdvanceSpeed);
  const toggleAutoAdvance = useGameStore((s) => s.toggleAutoAdvance);
  const setAutoAdvanceSpeed = useGameStore((s) => s.setAutoAdvanceSpeed);

  const rank = getRank(companyValuation);
  const rankIndex = RANKS.indexOf(rank) + 1;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-surface-card/95 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Company Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-glow text-sm font-bold text-white shadow-lg shadow-accent/20">
            {rank.icon}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-fg">{companyName}</p>
            <p className="text-[10px] text-muted">Rank #{rankIndex} · {rank.label}</p>
          </div>
        </div>

        {/* Right: Core Assets + Timeline */}
        <div className="flex items-center gap-2">
          {/* Cash */}
          <div className="text-right">
            <p className="text-[8px] uppercase tracking-wider text-muted">Cash</p>
            <p className="font-mono text-xs font-bold text-success">${cash >= 1000000 ? `${(cash / 1000000).toFixed(1)}M` : cash >= 1000 ? `${(cash / 1000).toFixed(1)}K` : cash.toLocaleString()}</p>
          </div>
          <div className="h-6 w-px bg-border/60" />

          {/* Fans */}
          <div className="text-right">
            <p className="text-[8px] uppercase tracking-wider text-muted">Fans</p>
            <p className="font-mono text-xs font-bold text-cyan-400">{fans >= 1000 ? `${(fans / 1000).toFixed(1)}K` : fans}</p>
          </div>
          <div className="h-6 w-px bg-border/60" />

          {/* Research */}
          <div className="text-right">
            <p className="text-[8px] uppercase tracking-wider text-muted">RC</p>
            <p className="font-mono text-xs font-bold text-warning">{unlockedTech.length}</p>
          </div>
          <div className="h-6 w-px bg-border/60" />

          {/* Timeline Controls */}
          <div className="flex items-center gap-1.5">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={toggleAutoAdvance}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
                autoAdvance
                  ? 'bg-success/20 text-success shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                  : 'bg-surface-hover text-muted hover:text-fg'
              }`}
              title={autoAdvance ? 'Pause timeline' : 'Auto-advance days'}
            >
              {autoAdvance ? '⏸' : '▶'}
            </button>

            {/* Speed Selector */}
            {autoAdvance && (
              <div className="flex items-center gap-0.5 rounded-lg bg-surface-hover p-0.5">
                {SPEED_OPTIONS.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setAutoAdvanceSpeed(speed)}
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold transition ${
                      autoAdvanceSpeed === speed
                        ? 'bg-accent/20 text-accent-soft'
                        : 'text-muted hover:text-fg'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}

            {/* Manual Next Day */}
            <button
              type="button"
              onClick={advanceDay}
              className="flex items-center gap-1 rounded-lg bg-accent/15 px-2 py-1.5 text-[10px] font-semibold text-accent-soft transition hover:bg-accent/25 active:scale-95"
            >
              <span>⏭</span>
              <span className="hidden sm:inline">Day</span>
            </button>
          </div>

          {/* Date Display */}
          <div className="flex flex-col items-center rounded-lg bg-surface-hover px-2 py-1">
            <p className="text-[8px] uppercase text-muted">Month</p>
            <p className="font-mono text-xs font-bold text-fg">M{month}D{day}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
