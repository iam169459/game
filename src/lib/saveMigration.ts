import type { GameSave, ScreenId } from '../types';

const GAME_SCREENS: ScreenId[] = ['menu', 'devices', 'blueprints', 'employees', 'social', 'settings'];

const STARTING_CASH = 50_000;

export function createDefaultSave(): Partial<GameSave> {
  return {
    version: 1,
    companyName: 'Garage Labs',
    cash: STARTING_CASH,
    fans: 12,
    reputation: 10,
    day: 1,
    month: 1,
    gameStarted: false,
    unlockedTech: [],
    researching: null,
    designs: [],
    inventory: {},
    factories: [
      {
        id: 'f1',
        name: 'Garage Bench',
        level: 1,
        capacity: 8,
        assignedProductId: null,
        assignedEmployeeId: null,
        progress: 0,
      },
    ],
    marketTrends: [
      {
        id: 'starter',
        label: 'Garage Launch Buzz',
        category: 'all',
        demandMultiplier: 1.1,
        daysLeft: 10,
        icon: '🚀',
      },
    ],
    activeCampaignIds: [],
    totalUnitsSold: 0,
    profitHistory: [] as number[],
    lastDayFinance: {
      revenue: 0,
      productionCost: 0,
      marketingCost: 0,
      upkeep: 0,
      researchCost: 0,
      profit: 0,
    },
    draft: {
      name: 'Garage Pro 1',
      category: 'smartphone',
      components: {},
      sellPrice: 299,
    },
  };
}

/** Normalize partial/corrupt localStorage payloads so screens never crash. */
export function sanitizePersistedState(persisted: unknown): Partial<GameSave> {
  const defaults = createDefaultSave();
  if (!persisted || typeof persisted !== 'object') return defaults;

  const raw = persisted as Record<string, unknown>;
  const state = persisted as Partial<GameSave>;

  return {
    ...defaults,
    ...state,
    companyName: typeof state.companyName === 'string' ? state.companyName : defaults.companyName!,
    cash: typeof state.cash === 'number' && Number.isFinite(state.cash) ? state.cash : defaults.cash!,
    fans: typeof state.fans === 'number' && Number.isFinite(state.fans) ? state.fans : defaults.fans!,
    reputation:
      typeof state.reputation === 'number' && Number.isFinite(state.reputation)
        ? state.reputation
        : defaults.reputation!,
    day: typeof state.day === 'number' && state.day >= 1 ? state.day : 1,
    month: typeof state.month === 'number' && state.month >= 1 ? state.month : 1,
    gameStarted: Boolean(state.gameStarted),
    screen: GAME_SCREENS.includes(state.screen as ScreenId) ? (state.screen as ScreenId) : undefined,
    unlockedTech: Array.isArray(state.unlockedTech) ? state.unlockedTech : [],
    researching:
      state.researching &&
      typeof state.researching === 'object' &&
      typeof (state.researching as { techId?: string }).techId === 'string'
        ? state.researching
        : null,
    designs: Array.isArray(state.designs) ? state.designs : [],
    inventory: state.inventory && typeof state.inventory === 'object' ? state.inventory : {},
    factories: Array.isArray(state.factories) && state.factories.length > 0 ? state.factories : defaults.factories!,
    marketTrends:
      Array.isArray(state.marketTrends) && state.marketTrends.length > 0
        ? state.marketTrends
        : defaults.marketTrends!,
    activeCampaignIds: Array.isArray(state.activeCampaignIds) ? state.activeCampaignIds : [],
    totalUnitsSold:
      typeof state.totalUnitsSold === 'number' && Number.isFinite(state.totalUnitsSold)
        ? state.totalUnitsSold
        : 0,
    profitHistory: Array.isArray(state.profitHistory)
      ? state.profitHistory.filter((n): n is number => typeof n === 'number' && Number.isFinite(n)).slice(-30)
      : [],
    lastDayFinance: {
      ...defaults.lastDayFinance!,
      ...(state.lastDayFinance && typeof state.lastDayFinance === 'object' ? state.lastDayFinance : {}),
    },
    draft: {
      ...defaults.draft!,
      ...(state.draft && typeof state.draft === 'object' ? state.draft : {}),
      components:
        state.draft &&
        typeof state.draft === 'object' &&
        state.draft.components &&
        typeof state.draft.components === 'object'
          ? state.draft.components
          : {},
    },
    // Ignore unknown keys from older saves (e.g. Phaser / v1 React)
    version: typeof raw.version === 'number' ? raw.version : 1,
  };
}
