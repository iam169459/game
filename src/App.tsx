import { useEffect, useState, useCallback } from 'react';
import { SciFiLoading } from './components/SciFiLoading';
import { TopBar } from './components/layout/TopBar';
import { BottomNav } from './components/layout/BottomNav';
import { useStoreHydration } from './hooks/useStoreHydration';
import { AccessLogin } from './screens/AccessLogin';
import { DevicesTab } from './screens/DevicesTab';
import { BlueprintsTab } from './screens/BlueprintsTab';
import { FactoryTab } from './screens/FactoryTab';
import { StoresTab } from './screens/StoresTab';
import { EmployeesTab } from './screens/EmployeesTab';
import { AchievementsTab } from './screens/AchievementsTab';
import { SocialTab } from './screens/SocialTab';
import { StocksTab } from './screens/StocksTab';
import { Settings } from './screens/Settings';
import { MainMenu } from './screens/MainMenu';
import { useGameStore } from './store/useGameStore';
import type { TabId, ScreenId } from './types';
import { QuarterlyReportModal } from './components/QuarterlyReportModal';
import { DeviceReviewModal } from './components/DeviceReviewModal';
import { Lab } from './screens/Lab';
import { Research } from './screens/Research';
import { BankruptcyScreen } from './components/BankruptcyScreen';

const TABS: Record<TabId, React.ComponentType> = {
  devices:      DevicesTab,
  blueprints:   BlueprintsTab,
  lab:          Lab,
  research:     Research,
  factory:      FactoryTab,
  stores:       StoresTab,
  stocks:       StocksTab,
  employees:    EmployeesTab,
  achievements: AchievementsTab,
  social:       SocialTab,
};

type AppPhase = 'loading' | 'login' | 'menu' | 'game';

export default function App() {
  const hydrated = useStoreHydration();
  const screen = useGameStore((s) => s.screen);
  const gameStarted = useGameStore((s) => s.gameStarted);
  const cash = useGameStore((s) => s.cash);
  const startGame = useGameStore((s) => s.startGame);
  const continueGame = useGameStore((s) => s.continueGame);

  const isBankrupt = gameStarted && cash < -10000000;

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
    [gameStarted, startGame, continueGame],
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
    if (!autoAdvance || phase !== 'game' || isBankrupt) return;
    const intervalMs = Math.round(3000 / autoAdvanceSpeed);
    const timer = setInterval(() => {
      advanceDay();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoAdvance, autoAdvanceSpeed, advanceDay, phase, isBankrupt]);

  if (phase === 'loading' || !hydrated) {
    return <SciFiLoading onComplete={handleLoadingComplete} />;
  }

  if (phase === 'login') {
    return <AccessLogin onAccess={handleAccess} />;
  }

  const showMenu = !gameStarted || screen === 'menu';
  if (showMenu && phase === 'menu') {
    return <MainMenu />;
  }

  if (isBankrupt) {
    return <BankruptcyScreen />;
  }

  const isTab = (s: ScreenId): s is TabId =>
    s !== 'menu' && s !== 'settings' && s in TABS;
  const activeTab: TabId = isTab(screen) ? screen : 'devices';
  const Tab = TABS[activeTab];

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-game">
      <TopBar />
      <main className="flex-1 overflow-y-auto px-4 pt-3 pb-24">
        {screen === 'settings' ? <Settings /> : <Tab />}
      </main>
      <BottomNav />
      <QuarterlyReportModal />
      <DeviceReviewModal />
    </div>
  );
}
