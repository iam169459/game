import { useGameStore } from '../../store/useGameStore';
import type { TabId } from '../../types';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'devices',      label: 'Market',      icon: '📱' },
  { id: 'blueprints',   label: 'Design',      icon: '🔧' },
  { id: 'lab',          label: 'R&D Lab',     icon: '⚗️' },
  { id: 'research',     label: 'Research',    icon: '🔬' },
  { id: 'factory',      label: 'Factory',     icon: '🏭' },
  { id: 'stores',       label: 'Stores',      icon: '🏪' },
  { id: 'stocks',       label: 'Stocks',      icon: '📈' },
  { id: 'employees',    label: 'Team',        icon: '👥' },
  { id: 'achievements', label: 'Achievements',icon: '🏆' },
];

export function BottomNav() {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);

  const activeTab = (screen as TabId) || 'devices';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-surface-card/95 backdrop-blur-xl safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-stretch overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setScreen(tab.id)}
              className={`relative flex flex-1 min-w-[56px] flex-col items-center gap-0.5 py-2.5 text-[9px] font-medium transition-all ${
                active ? 'text-accent-soft' : 'text-muted active:text-fg'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-accent to-glow" />
              )}
              <span className={`text-lg transition-transform ${active ? 'scale-110' : ''}`}>
                {tab.icon}
              </span>
              <span className={`text-center leading-tight ${active ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
