import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

const RANKS = [
  { min: 0,         label: 'Garage Starter',   icon: '🔧' },
  { min: 50000,     label: 'Indie Maker',       icon: '🛠️' },
  { min: 150000,    label: 'Startup Pro',       icon: '🚀' },
  { min: 500000,    label: 'Tech Contender',    icon: '⚡' },
  { min: 1500000,   label: 'Market Disruptor',  icon: '💎' },
  { min: 5000000,   label: 'Industry Titan',    icon: '👑' },
  { min: 20000000,  label: 'Global Tech Giant', icon: '🌍' },
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
  const companyName     = useGameStore((s) => s.companyName);
  const cash            = useGameStore((s) => s.cash);
  const companyValuation= useGameStore((s) => s.companyValuation);
  const marketShare     = useGameStore((s) => s.marketShare);
  const month           = useGameStore((s) => s.month);
  const day             = useGameStore((s) => s.day);
  const advanceDay      = useGameStore((s) => s.advanceDay);
  const autoAdvance     = useGameStore((s) => s.autoAdvance);
  const autoAdvanceSpeed= useGameStore((s) => s.autoAdvanceSpeed);
  const toggleAutoAdvance = useGameStore((s) => s.toggleAutoAdvance);
  const setAutoAdvanceSpeed = useGameStore((s) => s.setAutoAdvanceSpeed);
  const newsHistory     = useGameStore((s) => s.newsHistory);
  const notification    = useGameStore((s) => s.notification);
  const clearNotification = useGameStore((s) => s.clearNotification);
  const loans           = useGameStore((s) => s.loans);
  const retailStores    = useGameStore((s) => s.retailStores);

  const [tickerIndex, setTickerIndex] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  const rank = getRank(companyValuation);
  const rankIndex = RANKS.indexOf(rank) + 1;

  const totalDebt = loans.reduce((s, l) => s + l.remaining, 0);

  // Rotate news ticker
  useEffect(() => {
    if (newsHistory.length === 0) return;
    const timer = setInterval(() => {
      setTickerIndex((i) => (i + 1) % newsHistory.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [newsHistory.length]);

  // Show notification popup
  useEffect(() => {
    if (!notification) return;
    setShowNotif(true);
    const t = setTimeout(() => {
      setShowNotif(false);
      setTimeout(clearNotification, 300);
    }, 3500);
    return () => clearTimeout(t);
  }, [notification, clearNotification]);

  const formatCash = (n: number) =>
    n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M`
    : n >= 1000 ? `$${(n / 1000).toFixed(1)}K`
    : `$${n}`;

  const latestNews = newsHistory[newsHistory.length - 1 - tickerIndex];

  return (
    <>
      {/* Notification toast */}
      {notification && (
        <div
          className={`fixed top-16 left-1/2 z-[100] -translate-x-1/2 max-w-sm w-[90%] rounded-2xl border border-accent/30 bg-surface-card/95 px-4 py-3 shadow-xl shadow-black/40 backdrop-blur-xl transition-all duration-300 ${
            showNotif ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}
        >
          <p className="text-xs text-fg leading-snug">{notification}</p>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-border/60 bg-surface-card/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-3 py-2.5">
          {/* Left: Company Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-glow text-sm font-bold text-white shadow-lg shadow-accent/20">
              {rank.icon}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-fg leading-tight">{companyName}</p>
              <p className="text-[9px] text-muted">Rank #{rankIndex} · {rank.label}</p>
            </div>
          </div>

          {/* Center Stats */}
          <div className="flex items-center gap-2">
            {/* Cash */}
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-center">
              <p className="text-[8px] text-emerald-300/70 uppercase">Cash</p>
              <p className="font-mono text-xs font-bold text-emerald-300">{formatCash(cash)}</p>
            </div>

            {/* Market Share */}
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2 py-1 text-center">
              <p className="text-[8px] text-blue-300/70 uppercase">Share</p>
              <p className="font-mono text-xs font-bold text-blue-300">{marketShare}%</p>
            </div>

            {/* Debt indicator */}
            {totalDebt > 0 && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1 text-center">
                <p className="text-[8px] text-red-300/70 uppercase">Debt</p>
                <p className="font-mono text-xs font-bold text-red-300">{formatCash(totalDebt)}</p>
              </div>
            )}

            {/* Stores */}
            {retailStores.length > 0 && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-center">
                <p className="text-[8px] text-amber-300/70 uppercase">Stores</p>
                <p className="font-mono text-xs font-bold text-amber-300">{retailStores.length}</p>
              </div>
            )}
          </div>

          {/* Right: Timeline Controls */}
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

            {/* Date Display */}
            <div className="flex flex-col items-center rounded-lg bg-surface-hover px-2 py-1">
              <p className="text-[8px] uppercase text-muted">M{month}</p>
              <p className="font-mono text-[10px] font-bold text-fg">D{day}</p>
            </div>
          </div>
        </div>

        {/* News Ticker */}
        {latestNews && (
          <div className="border-t border-white/5 bg-white/3 px-4 py-1">
            <p className="text-[10px] text-muted truncate">
              <span className="text-accent-soft/70">{latestNews.icon}</span>{' '}
              {latestNews.text}
            </p>
          </div>
        )}
      </header>
    </>
  );
}
