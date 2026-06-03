import { useGameStore } from '../../store/useGameStore';
import type { ScreenId } from '../../types';

const NAV: { id: ScreenId; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏢' },
  { id: 'designer', label: 'Designer', icon: '🎨' },
  { id: 'lab', label: 'Lab', icon: '⚗️' },
  { id: 'market', label: 'Market', icon: '📣' },
  { id: 'research', label: 'R&D', icon: '🔬' },
  { id: 'factory', label: 'Factory', icon: '🏭' },
  { id: 'employees', label: 'Team', icon: '👥' },
];

export function Sidebar() {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const companyName = useGameStore((s) => s.companyName);
  const cash = useGameStore((s) => s.cash);

  return (
    <aside className="glass-strong hidden w-60 shrink-0 flex-col rounded-2xl p-4 lg:flex">
      <div className="mb-6 flex items-center gap-3 border-b border-border/60 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-glow text-lg font-bold text-white shadow-lg shadow-blue-500/25">
          DT
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{companyName}</p>
          <p className="font-mono text-xs text-success">${cash.toLocaleString()}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = screen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setScreen(item.id)}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                active
                  ? 'bg-gradient-to-r from-accent/25 to-glow/15 text-accent-soft shadow-[inset_0_0_0_1px_rgba(99,102,241,0.3)]'
                  : 'text-muted hover:bg-surface-hover hover:text-fg'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-accent to-glow" />
              )}
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
        <button
          type="button"
          onClick={() => setScreen('settings')}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
            screen === 'settings'
              ? 'bg-gradient-to-r from-accent/25 to-glow/15 text-accent-soft shadow-[inset_0_0_0_1px_rgba(99,102,241,0.3)]'
              : 'text-muted hover:bg-surface-hover hover:text-fg'
          }`}
        >
          <span className="text-lg">⚙️</span>
          Settings
        </button>
        <button
          type="button"
          onClick={() => setScreen('menu')}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-muted transition hover:bg-surface-hover hover:text-fg"
        >
          <span className="text-lg">🚪</span>
          Main Menu
        </button>
      </div>
    </aside>
  );
}
