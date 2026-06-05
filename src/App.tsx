import { useEffect, useState, useCallback } from 'react';
import { SciFiLoading } from './components/SciFiLoading';
import { TopBar } from './components/layout/TopBar';
import { BottomNav } from './components/layout/BottomNav';
import { useStoreHydration } from './hooks/useStoreHydration';
import { AccessLogin } from './screens/AccessLogin';
import { DevicesTab } from './screens/DevicesTab';
import { BlueprintsTab } from './screens/BlueprintsTab';
import { EmployeesTab } from './screens/EmployeesTab';
import { SocialTab } from './screens/SocialTab';
import { Settings } from './screens/Settings';
import { MainMenu } from './screens/MainMenu';
import { useGameStore } from './store/useGameStore';
import type { TabId, ScreenId } from './types';

const TABS: Record<TabId, React.ComponentType> = {
  devices: DevicesTab,
  blueprints: BlueprintsTab,
  employees: EmployeesTab,
  social: SocialTab,
};

function Notification() {
  const message = useGameStore((s) => s.notification);
  const clear = useGameStore((s) => s.clearNotification);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(clear, 4000);
    return () => clearTimeout(t);
  }, [message, clear]);

  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 cursor-pointer rounded-2xl border border-accent/50 bg-surface-card/95 px-5 py-3 text-sm shadow-2xl shadow-accent/20 backdrop-blur-xl animate-fade-up"
      onClick={clear}
    >
      <span className="mr-2 text-accent">◆</span>
      {message}
    </div>
  );
}

type AppPhase = 'loading' | 'login' | 'menu' | 'game';

export default function App() {
  const hydrated = useStoreHydration();
  const screen = useGameStore((s) => s.screen);
  const gameStarted = useGameStore((s) => s.gameStarted);
  const startGame = useGameStore((s) => s.startGame);
  const continueGame = useGameStore((s) => s.continueGame);

  const [phase, setPhase] = useState<AppPhase>(!hydrated ? 'loading' : 'login');

  const handleLoadingComplete = useCallback(() => {
    setPhase('login');
  }, []);

  const handleAccess = useCallback(
    (name: string) => {
      if (gameStarted) {
        continueGame();
      } else {
        startGame(name);
      }
    },
    [gameStarted, startGame, continueGame]
  );

  useEffect(() => {
    if (hydrated && phase === 'login' && gameStarted) {
      setPhase('game');
    }
  }, [hydrated, phase, gameStarted]);

  useEffect(() => {
    if (phase !== 'login' && phase !== 'game') return;
    if (screen === 'menu') {
      setPhase('menu');
    } else if (gameStarted) {
      setPhase('game');
    }
  }, [screen, gameStarted, phase]);

  // Auto-advance timeline
  const autoAdvance = useGameStore((s) => s.autoAdvance);
  const autoAdvanceSpeed = useGameStore((s) => s.autoAdvanceSpeed);
  const advanceDay = useGameStore((s) => s.advanceDay);

  useEffect(() => {
    if (!autoAdvance || phase !== 'game') return;
    const intervalMs = Math.round(1000 / autoAdvanceSpeed);
    const timer = setInterval(() => {
      advanceDay();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoAdvance, autoAdvanceSpeed, advanceDay, phase]);

  if (phase === 'loading' || !hydrated) {
    return <SciFiLoading onComplete={handleLoadingComplete} />;
  }

  if (phase === 'login') {
    return <AccessLogin onAccess={handleAccess} />;
  }

  const showMenu = !gameStarted || screen === 'menu';
  if (showMenu && phase === 'menu') {
    return (
      <>
        <MainMenu />
        <Notification />
      </>
    );
  }

  const isTab = (s: ScreenId): s is TabId => s !== 'menu' && s !== 'settings' && s in TABS;
  const activeTab: TabId = isTab(screen) ? screen : 'devices';

  const Tab = TABS[activeTab];

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-game">
      <TopBar />
      <main className="flex-1 overflow-y-auto px-4 pt-3 pb-24">
        {screen === 'settings' ? <Settings /> : <Tab />}
      </main>
      <BottomNav />
      <Notification />
    </div>
  );
}
