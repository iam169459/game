import { useEffect, useState, useCallback } from 'react';
import type { ComponentType } from 'react';
import { SciFiLoading } from './components/SciFiLoading';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { useStoreHydration } from './hooks/useStoreHydration';
import { AccessLogin } from './screens/AccessLogin';
import { Dashboard } from './screens/Dashboard';
import { Designer } from './screens/Designer';
import { Employees } from './screens/Employees';
import { Factory } from './screens/Factory';
import { Lab } from './screens/Lab';
import { MainMenu } from './screens/MainMenu';
import { Market } from './screens/Market';
import { Research } from './screens/Research';
import { Settings } from './screens/Settings';
import { useGameStore } from './store/useGameStore';
import type { ScreenId } from './types';

const SCREENS: Record<Exclude<ScreenId, 'menu'>, ComponentType> = {
  dashboard: Dashboard,
  designer: Designer,
  lab: Lab,
  market: Market,
  research: Research,
  factory: Factory,
  employees: Employees,
  settings: Settings,
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

function isGameScreen(screen: ScreenId): screen is Exclude<ScreenId, 'menu'> {
  return screen !== 'menu' && screen in SCREENS;
}

type AppPhase = 'loading' | 'login' | 'menu' | 'game';

export default function App() {
  const hydrated = useStoreHydration();
  const screen = useGameStore((s) => s.screen);
  const gameStarted = useGameStore((s) => s.gameStarted);
  const startGame = useGameStore((s) => s.startGame);
  const continueGame = useGameStore((s) => s.continueGame);

  const [phase, setPhase] = useState<AppPhase>(!hydrated ? 'loading' : 'login');

  // Loading → Login
  const handleLoadingComplete = useCallback(() => {
    setPhase('login');
  }, []);

  // Login → Menu/Game
  const handleAccess = useCallback(
    (name: string) => {
      const state = useGameStore.getState();
      if (state.gameStarted) {
        continueGame();
      } else {
        startGame(name);
      }
    },
    [startGame, continueGame]
  );

  // Once hydrated and game started, move to game
  useEffect(() => {
    if (hydrated && phase === 'login' && gameStarted) {
      setPhase('game');
    }
  }, [hydrated, phase, gameStarted]);

  // Phase transitions based on store state
  useEffect(() => {
    if (phase !== 'login' && phase !== 'game') return;
    if (screen === 'menu') {
      setPhase('menu');
    } else if (gameStarted) {
      setPhase('game');
    }
  }, [screen, gameStarted, phase]);

  // Loading screen
  if (phase === 'loading' || !hydrated) {
    return <SciFiLoading onComplete={handleLoadingComplete} />;
  }

  // Login screen
  if (phase === 'login') {
    return <AccessLogin onAccess={handleAccess} />;
  }

  // Menu (after login or explicit menu navigation)
  const showMenu = !gameStarted || screen === 'menu';
  if (showMenu && phase === 'menu') {
    return (
      <>
        <MainMenu />
        <Notification />
      </>
    );
  }

  // Game screens
  const activeScreen = isGameScreen(screen) ? screen : 'dashboard';
  const Screen = SCREENS[activeScreen];

  return (
    <div className="bg-game min-h-screen p-3 sm:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1600px] flex-col lg:flex-row lg:gap-5">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 pb-8">
            <Screen />
          </main>
        </div>
      </div>
      <Notification />
    </div>
  );
}
