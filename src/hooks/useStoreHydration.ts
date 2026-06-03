import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';

/** Wait for Zustand persist to finish loading localStorage before rendering the game. */
export function useStoreHydration(): boolean {
  const [hydrated, setHydrated] = useState(() => useGameStore.persist.hasHydrated());

  useEffect(() => {
    if (useGameStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    const unsub = useGameStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    return unsub;
  }, []);

  return hydrated;
}
