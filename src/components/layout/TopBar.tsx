import { Button } from '../ui/Button';
import { useGameStore } from '../../store/useGameStore';

export function TopBar() {
  const cash = useGameStore((s) => s.cash);
  const fans = useGameStore((s) => s.fans);
  const reputation = useGameStore((s) => s.reputation);
  const month = useGameStore((s) => s.month);
  const day = useGameStore((s) => s.day);
  const profit = useGameStore((s) => s.lastDayFinance.profit);
  const advanceDay = useGameStore((s) => s.advanceDay);
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);

  const navItems = [
    { id: 'dashboard' as const, label: 'HQ', icon: '🏢' },
    { id: 'designer' as const, label: 'Design', icon: '🎨' },
    { id: 'lab' as const, label: 'Lab', icon: '⚗️' },
    { id: 'market' as const, label: 'Market', icon: '📣' },
    { id: 'research' as const, label: 'R&D', icon: '🔬' },
    { id: 'factory' as const, label: 'Factory', icon: '🏭' },
    { id: 'employees' as const, label: 'Team', icon: '👥' },
  ];

  return (
    <header className="glass-strong sticky top-0 z-40 mb-5 rounded-2xl px-4 py-3 lg:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="rounded-xl bg-surface-raised/80 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Timeline</p>
            <p className="font-mono text-sm font-bold">
              M{month} <span className="text-muted">·</span> D{day}
            </p>
          </div>

          <div className="hidden h-10 w-px bg-border sm:block" />

          <div className="hidden items-center gap-4 sm:flex">
            {[
              { label: 'Cash', value: `$${cash.toLocaleString()}`, color: 'text-success' },
              { label: 'Fans', value: fans.toLocaleString(), color: 'text-cyan-400' },
              { label: 'Rep', value: String(Math.round(reputation)), color: 'text-fg' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-[10px] uppercase text-muted">{s.label}</p>
                <p className={`font-mono text-sm font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
            <div>
              <p className="text-[10px] uppercase text-muted">24h P/L</p>
              <p className={`font-mono text-sm font-bold ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
                {profit >= 0 ? '+' : ''}${profit.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-raised/60 p-1 lg:hidden">
            {navItems.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setScreen(n.id)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  screen === n.id
                    ? 'bg-accent/25 text-accent-soft shadow-sm'
                    : 'text-muted hover:text-fg'
                }`}
              >
                {n.icon}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setScreen('settings')}
              className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                screen === 'settings'
                  ? 'bg-accent/25 text-accent-soft shadow-sm'
                  : 'text-muted hover:text-fg'
              }`}
            >
              ⚙️
            </button>
          </div>
          <Button onClick={advanceDay} className="whitespace-nowrap shadow-lg shadow-blue-500/20">
            <span className="text-base">▶</span> Next Day
          </Button>
        </div>
      </div>
    </header>
  );
}
