import { useGameStore } from '../../store/useGameStore';
import type { TabId } from '../../types';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'devices', label: 'Devices', icon: '📱' },
  { id: 'blueprints', label: 'Blueprints', icon: '🔧' },
  { id: 'employees', label: 'Employees', icon: '👥' },
  { id: 'social', label: 'Social Hub', icon: '🌐' },
];

export function BottomNav() {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);

  const activeTab = (screen as TabId) || 'devices';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-surface-card/95 backdrop-blur-xl safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-stretch">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setScreen(tab.id)}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] font-medium transition-all ${
                active
                  ? 'text-accent-soft'
                  : 'text-muted active:text-fg'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-accent to-glow" />
              )}
              <span className={`text-xl transition-transform ${active ? 'scale-110' : ''}`}>
                {tab.icon}
              </span>
              <span className={active ? 'font-bold' : ''}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
