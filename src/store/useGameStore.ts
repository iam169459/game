import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';
import { CAMPAIGNS } from '../data/marketing';
import { COMPONENTS, SLOTS_BY_CATEGORY } from '../data/components';
import { ALL_ACHIEVEMENTS } from '../data/achievements';
import { STORE_REGIONS } from '../data/stores';
import {
  calcDesignStats,
  generateDeviceReview,
  getCampaignBoost,
  getDefaultComponents,
  getTech,
  getTechEffects,
  processProduction,
  rollTrend,
  simulateSales,
  suggestPrice,
} from '../lib/gameLogic';
import {
  botAdvanceMonth,
  calcMarketShares,
  createBotCompanies,
} from '../lib/botAI';
import { sanitizePersistedState } from '../lib/saveMigration';
import type {
  Achievement,
  BotCompany,
  ComponentSlot,
  Competitor,
  CraftedPart,
  DayFinance,
  Department,
  DeviceCategory,
  DeviceStats,
  DraftDesign,
  Employee,
  Friend,
  Loan,
  MarketEvent,
  MarketTrend,
  MonthlySales,
  NewsItem,
  ProductDesign,
  ProductionLine,
  QuarterlyReport,
  ReleasedDevice,
  RetailStore,
  ScreenId,
  StoreRegion,
} from '../types';

const SAVE_VERSION = 2;
const STARTING_CASH = 20_000_000;

const emptyFinance = (): DayFinance => ({
  revenue: 0,
  productionCost: 0,
  marketingCost: 0,
  upkeep: 0,
  researchCost: 0,
  profit: 0,
});

const initialAchievements = (): Achievement[] =>
  ALL_ACHIEVEMENTS.map((a) => ({ ...a, unlockedMonth: null }));

interface GameStore {
  screen: ScreenId;
  notification: string | null;

  companyName: string;
  cash: number;
  fans: number;
  reputation: number;
  day: number;
  month: number;
  gameStarted: boolean;

  unlockedTech: string[];
  researching: { techId: string; daysLeft: number } | null;
  designs: ProductDesign[];
  inventory: Record<string, number>;
  factories: ProductionLine[];
  marketTrends: MarketTrend[];
  activeCampaignIds: string[];
  totalUnitsSold: number;
  lastDayFinance: DayFinance;
  profitHistory: number[];

  draft: DraftDesign;
  releasedDevices: ReleasedDevice[];
  salesHistory: MonthlySales[];
  marketEvents: MarketEvent[];
  competitors: Competitor[];
  craftedParts: CraftedPart[];

  botCompanies: BotCompany[];
  employees: Employee[];
  departments: Department[];

  companyValuation: number;
  quarterlyReports: QuarterlyReport[];
  marketShare: number;
  devicePricing: Record<string, { basePriceMultiplier: number; supplyLevel: number; demandLevel: number; lastPurchaseDay: number; priceHistory: number[] }>;
  totalRepairCosts: number;
  totalMaintenanceSpent: number;

  friends: Friend[];
  autoAdvance: boolean;
  autoAdvanceSpeed: number;
  playerUuid: string | null;
  cloudSyncStatus: 'synced' | 'syncing' | 'error' | 'local';
  lastSyncedAt: string | null;

  // New systems
  retailStores: RetailStore[];
  achievements: Achievement[];
  loans: Loan[];
  newsHistory: NewsItem[];
  activeQuarterlyReport: QuarterlyReport | null;
  activeDeviceReview: { name: string; category: DeviceCategory; score: number; feedbacks: string[] } | null;
  stockPrices: Record<string, { price: number; history: number[]; changePercent: number }>;
  playerPortfolio: Record<string, { shares: number; avgCost: number }>;
  monthAccumulator: {
    revenue: number;
    productionCost: number;
    marketingCost: number;
    upkeep: number;
    unitsSold: number;
    deviceSales: Record<string, number>;
  };

  // Actions
  setScreen: (s: ScreenId) => void;
  clearNotification: () => void;
  closeQuarterlyReport: () => void;
  closeDeviceReview: () => void;
  startGame: (name: string) => void;
  continueGame: () => void;
  resetGame: () => void;

  setDraftCategory: (c: DeviceCategory) => void;
  setDraftName: (n: string) => void;
  setDraftComponent: (slot: ComponentSlot, id: string) => void;
  setDraftSellPrice: (p: number) => void;
  resetDraft: () => void;
  saveDesign: () => boolean;
  deleteDesign: (id: string) => void;

  releaseDevice: () => boolean;
  discontinueDevice: (id: string) => void;
  advanceMonth: () => void;

  combineParts: (slot: ComponentSlot, part1Id: string, part2Id: string) => boolean;
  deleteCraftedPart: (id: string) => void;

  startResearch: (techId: string) => boolean;
  toggleCampaign: (id: string) => void;
  assignProduct: (factoryId: string, productId: string | null) => void;
  upgradeFactory: (factoryId: string) => boolean;
  buyFactory: () => boolean;
  advanceDay: () => void;

  hireEmployee: (department: Employee['department']) => boolean;
  fireEmployee: (id: string) => void;
  setDepartmentBudget: (deptId: Department['id'], budget: number) => void;
  assignEmployeeToLine: (employeeId: string, lineId: string | null) => void;

  repairDevice: (deviceId: string) => boolean;
  getDeviceDurability: (deviceId: string) => number;

  toggleAutoAdvance: () => void;
  setAutoAdvanceSpeed: (speed: number) => void;

  // Retail stores
  purchaseStore: (region: StoreRegion, tier: 1 | 2 | 3) => boolean;
  upgradeStore: (storeId: string) => boolean;
  sellStore: (storeId: string) => void;

  // Loans
  takeLoan: (amount: number) => boolean;
  repayLoan: (loanId: string) => boolean;

  // Stocks
  buyStock: (botId: string, shares: number) => boolean;
  sellStock: (botId: string, shares: number) => boolean;

  syncCloudSave: () => Promise<boolean>;
  loadCloudSave: (serverState: any) => void;
}

function initialFactories(): ProductionLine[] {
  return [
    { id: 'f1', name: 'Garage Bench', level: 1, capacity: 8, assignedProductId: null, assignedEmployeeId: null, progress: 0 },
  ];
}

function initialTrends(): MarketTrend[] {
  return [
    { id: 'starter', label: 'Garage Launch Buzz', category: 'all', demandMultiplier: 1.1, daysLeft: 10, icon: '🚀' },
  ];
}

function initialCompetitors(): Competitor[] {
  return [
    { id: 'c1', name: 'TechNova Inc',  color: '#3b82f6', monthlySales: 45, reputation: 65, trend: 'up' },
    { id: 'c2', name: 'PixelCraft',    color: '#8b5cf6', monthlySales: 32, reputation: 58, trend: 'stable' },
    { id: 'c3', name: 'Zenith Labs',   color: '#10b981', monthlySales: 28, reputation: 52, trend: 'down' },
  ];
}

function initialDepartments(): Department[] {
  return [
    { id: 'rd',            name: 'R&D',           headcount: 1, bonus: 0, budget: 500 },
    { id: 'marketing',     name: 'Marketing',     headcount: 1, bonus: 0, budget: 300 },
    { id: 'manufacturing', name: 'Manufacturing', headcount: 1, bonus: 0, budget: 400 },
    { id: 'executive',     name: 'Executive',     headcount: 1, bonus: 0, budget: 200 },
  ];
}

function initialEmployees(): Employee[] {
  const names = ['Alex Chen', 'Jordan Kim', 'Sam Rivera'];
  const depts: Employee['department'][] = ['rd', 'marketing', 'manufacturing'];
  const traits: Employee['trait'][] = ['efficient', 'diligent', 'trainee'];
  return names.map((name, i) => ({
    id: `emp-${i + 1}`,
    name,
    department: depts[i],
    skill: 50 + Math.floor(Math.random() * 20),
    salary: 8000 + Math.floor(Math.random() * 4000),
    morale: 70 + Math.floor(Math.random() * 20),
    hiredMonth: 1,
    trait: traits[i],
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    assignedLineId: null,
  }));
}

function createDraft(category: DeviceCategory, unlockedTech: string[]): DraftDesign {
  const components = getDefaultComponents(category, unlockedTech);
  const { stats, unitCost } = calcDesignStats(category, components);
  return {
    name: 'Garage Pro 1',
    category,
    components,
    sellPrice: suggestPrice(stats, unitCost, category),
    bodyColor: '#475569',
    frameStyle: 'Matte Glass',
    logoIcon: 'Circle',
    cameraLayout: 'Single Lens',
    boxColor: '#0f172a',
    boxTextColor: '#f8fafc',
    boxStyle: 'Minimalist',
    notchStyle: 'Punch Hole',
    screenCurvature: 'Flat',
    buttonColor: '#475569',
    buttonStyle: 'Classic',
    bezelSize: 'Thin',
    strapType: 'Sport',
    strapColor: '#1c1c1e',
    backlightColor: '#06b6d4',
    smartwatchShape: 'Square',
    logoGlow: 'None',
    cameraShape: 'Integrated',
    buttonPlacement: 'Right Side',
  };
}

function checkAchievements(
  current: Achievement[],
  state: {
    cash: number;
    fans: number;
    totalUnitsSold: number;
    releasedDevices: ReleasedDevice[];
    unlockedTech: string[];
    employees: Employee[];
    factories: ProductionLine[];
    retailStores: RetailStore[];
    salesHistory: MonthlySales[];
    marketShare: number;
    companyValuation: number;
    month: number;
  },
): { updated: Achievement[]; newlyUnlocked: Achievement[] } {
  const totalRevenue = state.salesHistory.reduce((s, m) => s + m.revenue, 0);
  const profitableMonths = state.salesHistory.filter((m) => m.profit > 0).length;
  const hwTechs = ['chip-7nm', 'chip-5nm', 'chip-3nm', 'chip-2nm', 'display-oled', 'display-2k', 'display-4k', 'display-8k',
    'camera-dual', 'camera-pro', 'camera-periscope', 'battery-fast', 'battery-graphene', 'battery-solid',
    'chassis-premium', 'chassis-titan', 'chassis-carbon', 'ram-4gb', 'ram-8gb', 'ram-16gb', 'ram-hbm',
    'storage-nvme', 'storage-1tb', 'storage-4tb', 'audio-hifi', 'audio-anc', 'audio-planar', 'audio-spatial',
    'conn-wifi6', 'conn-wifi7', 'conn-5g', 'conn-6g', 'conn-bt5'];
  const releasedCategories = new Set(state.releasedDevices.map((d) => d.category));
  const allCategories: DeviceCategory[] = ['smartphone', 'laptop', 'smartwatch', 'tablet', 'earbuds', 'smarttv'];
  const hasAllCategories = allCategories.every((c) => releasedCategories.has(c));
  const maxScore = Math.max(0, ...state.releasedDevices.map((d) =>
    Object.values(d.stats).reduce((a, b) => a + b, 0) / 6
  ));

  const conditions: Record<string, boolean> = {
    'first-sale':      state.totalUnitsSold >= 1000,
    'sales-100':       state.totalUnitsSold >= 100000,
    'sales-1k':        state.totalUnitsSold >= 1000000,
    'sales-10k':       state.totalUnitsSold >= 10000000,
    'sales-100k':      state.totalUnitsSold >= 100000000,
    'revenue-100k':    totalRevenue >= 100000000,
    'revenue-1m':      totalRevenue >= 1000000000,
    'revenue-10m':     totalRevenue >= 10000000000,
    'first-device':    state.releasedDevices.length >= 1,
    'devices-3':       state.releasedDevices.length >= 3,
    'devices-10':      state.releasedDevices.length >= 10,
    'all-categories':  hasAllCategories,
    'flagship':        maxScore >= 80,
    'perfect-device':  maxScore >= 95,
    'cash-50k':        state.cash >= 50000000,
    'cash-500k':       state.cash >= 500000000,
    'cash-5m':         state.cash >= 5000000000,
    'valuation-1m':    state.companyValuation >= 1000000000,
    'profitable':      profitableMonths >= 1,
    'first-tech':      state.unlockedTech.length >= 1,
    'tech-5':          state.unlockedTech.length >= 5,
    'tech-15':         state.unlockedTech.length >= 15,
    'tech-all-hw':     hwTechs.every((t) => state.unlockedTech.includes(t)),
    'first-store':     state.retailStores.length >= 1,
    'stores-5':        state.retailStores.length >= 5,
    'stores-10':       state.retailStores.length >= 10,
    'first-employee':  state.employees.length >= 4, // starts with 3
    'employees-10':    state.employees.length >= 10,
    'employees-30':    state.employees.length >= 30,
    'market-leader':   state.marketShare >= 25,
    'factories-5':     state.factories.length >= 5,
    'survived-1yr':    state.month >= 12,
    'survived-3yr':    state.month >= 36,
  };

  const newlyUnlocked: Achievement[] = [];
  const updated = current.map((ach) => {
    if (ach.unlockedMonth !== null) return ach;
    if (conditions[ach.id]) {
      const unlocked = { ...ach, unlockedMonth: state.month };
      newlyUnlocked.push(unlocked);
      return unlocked;
    }
    return ach;
  });

  return { updated, newlyUnlocked };
}

const INITIAL_STATE = {
  screen: 'menu' as ScreenId,
  notification: null,
  companyName: 'Garage Labs',
  cash: STARTING_CASH,
  fans: 12,
  reputation: 10,
  day: 1,
  month: 1,
  gameStarted: false,
  unlockedTech: [] as string[],
  researching: null,
  designs: [] as ProductDesign[],
  inventory: {} as Record<string, number>,
  factories: initialFactories(),
  marketTrends: initialTrends(),
  activeCampaignIds: [] as string[],
  totalUnitsSold: 0,
  lastDayFinance: emptyFinance(),
  profitHistory: [] as number[],
  draft: createDraft('smartphone', []),
  releasedDevices: [] as ReleasedDevice[],
  salesHistory: [] as MonthlySales[],
  marketEvents: [] as MarketEvent[],
  competitors: initialCompetitors(),
  craftedParts: [] as CraftedPart[],
  botCompanies: createBotCompanies(),
  employees: initialEmployees(),
  departments: initialDepartments(),
  companyValuation: STARTING_CASH,
  quarterlyReports: [] as QuarterlyReport[],
  marketShare: 0,
  devicePricing: {} as Record<string, { basePriceMultiplier: number; supplyLevel: number; demandLevel: number; lastPurchaseDay: number; priceHistory: number[] }>,
  totalRepairCosts: 0,
  totalMaintenanceSpent: 0,
  friends: [] as Friend[],
  autoAdvance: false,
  autoAdvanceSpeed: 1,
  playerUuid: null as string | null,
  cloudSyncStatus: 'local' as 'synced' | 'syncing' | 'error' | 'local',
  lastSyncedAt: null as string | null,
  retailStores: [] as RetailStore[],
  achievements: initialAchievements(),
  loans: [] as Loan[],
  newsHistory: [] as NewsItem[],
  activeQuarterlyReport: null,
  activeDeviceReview: null,
  stockPrices: {
    'bot-1': { price: 150, history: [150], changePercent: 0 },
    'bot-2': { price: 110, history: [110], changePercent: 0 },
    'bot-3': { price: 95, history: [95], changePercent: 0 },
    'bot-4': { price: 70, history: [70], changePercent: 0 },
    'bot-5': { price: 50, history: [50], changePercent: 0 },
  },
  playerPortfolio: {
    'bot-1': { shares: 0, avgCost: 0 },
    'bot-2': { shares: 0, avgCost: 0 },
    'bot-3': { shares: 0, avgCost: 0 },
    'bot-4': { shares: 0, avgCost: 0 },
    'bot-5': { shares: 0, avgCost: 0 },
  },
  monthAccumulator: {
    revenue: 0,
    productionCost: 0,
    marketingCost: 0,
    upkeep: 0,
    unitsSold: 0,
    deviceSales: {},
  },
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setScreen: (screen) => set({ screen }),
      clearNotification: () => set({ notification: null }),
      closeQuarterlyReport: () => set({ activeQuarterlyReport: null }),
      closeDeviceReview: () => set({ activeDeviceReview: null }),

      continueGame: () => set({ gameStarted: true, screen: 'devices' }),

      resetGame: () => {
        useGameStore.persist.clearStorage();
        set({
          ...INITIAL_STATE,
          factories: initialFactories(),
          marketTrends: initialTrends(),
          draft: createDraft('smartphone', []),
          competitors: initialCompetitors(),
          botCompanies: createBotCompanies(),
          employees: initialEmployees(),
          departments: initialDepartments(),
          achievements: initialAchievements(),
        });
      },

      startGame: async (name) => {
        const companyName = name.trim() || 'Garage Labs';
        set({
          ...INITIAL_STATE,
          gameStarted: true,
          companyName,
          screen: 'devices',
          cloudSyncStatus: 'syncing',
          factories: initialFactories(),
          marketTrends: initialTrends(),
          draft: createDraft('smartphone', []),
          competitors: initialCompetitors(),
          botCompanies: createBotCompanies(),
          employees: initialEmployees(),
          departments: initialDepartments(),
          achievements: initialAchievements(),
          notification: 'Welcome to your garage! Design a device, then release it to market. 🚀',
        });

        try {
          const res = await api.registerPlayer(companyName);
          if (res.success && res.uuid) {
            set({
              playerUuid: res.uuid,
              cloudSyncStatus: 'synced',
              lastSyncedAt: new Date().toLocaleTimeString(),
            });
            await api.saveGame(res.uuid, get());
          } else {
            set({
              cloudSyncStatus: 'local',
              notification: `Connected locally. Server: ${res.message}`,
            });
          }
        } catch {
          set({ cloudSyncStatus: 'local' });
        }
      },

      syncCloudSave: async () => {
        const s = get();
        if (!s.playerUuid) return false;
        set({ cloudSyncStatus: 'syncing' });
        try {
          const success = await api.saveGame(s.playerUuid, s);
          if (success) {
            set({
              cloudSyncStatus: 'synced',
              lastSyncedAt: new Date().toLocaleTimeString(),
            });
            return true;
          } else {
            set({ cloudSyncStatus: 'error' });
            return false;
          }
        } catch {
          set({ cloudSyncStatus: 'error' });
          return false;
        }
      },

      loadCloudSave: (serverState) => {
        if (!serverState) return;
        const currentScreen = get().screen;
        set({
          ...serverState,
          screen: currentScreen,
          cloudSyncStatus: 'synced',
          lastSyncedAt: new Date().toLocaleTimeString(),
        });
      },

      setDraftCategory: (category) => {
        const { unlockedTech } = get();
        const components = getDefaultComponents(category, unlockedTech);
        const { stats, unitCost } = calcDesignStats(category, components);
        const currentDraft = get().draft;
        set({
          draft: {
            name: currentDraft.name,
            category,
            components,
            sellPrice: suggestPrice(stats, unitCost, category),
            bodyColor: currentDraft.bodyColor ?? '#475569',
            frameStyle: currentDraft.frameStyle ?? 'Matte Glass',
            logoIcon: currentDraft.logoIcon ?? 'Circle',
            cameraLayout: currentDraft.cameraLayout ?? 'Single Lens',
            boxColor: currentDraft.boxColor ?? '#0f172a',
            boxTextColor: currentDraft.boxTextColor ?? '#f8fafc',
            boxStyle: currentDraft.boxStyle ?? 'Minimalist',
            notchStyle: currentDraft.notchStyle ?? 'Punch Hole',
            screenCurvature: currentDraft.screenCurvature ?? 'Flat',
            buttonColor: currentDraft.buttonColor ?? '#475569',
            buttonStyle: currentDraft.buttonStyle ?? 'Classic',
            bezelSize: currentDraft.bezelSize ?? 'Thin',
            strapType: currentDraft.strapType ?? 'Sport',
            strapColor: currentDraft.strapColor ?? '#1c1c1e',
            backlightColor: currentDraft.backlightColor ?? '#06b6d4',
            smartwatchShape: currentDraft.smartwatchShape ?? 'Square',
            logoGlow: currentDraft.logoGlow ?? 'None',
            cameraShape: currentDraft.cameraShape ?? 'Integrated',
            buttonPlacement: currentDraft.buttonPlacement ?? 'Right Side',
          },
        });
      },

      setDraftName: (name) => set({ draft: { ...get().draft, name } }),
      setDraftComponent: (slot, id) => {
        const draft = { ...get().draft, components: { ...get().draft.components, [slot]: id } };
        const { stats, unitCost } = calcDesignStats(draft.category, draft.components);
        set({ draft: { ...draft, sellPrice: suggestPrice(stats, unitCost, draft.category) } });
      },
      setDraftSellPrice: (sellPrice) => set({ draft: { ...get().draft, sellPrice } }),

      resetDraft: () => {
        const { draft, unlockedTech } = get();
        set({ draft: createDraft(draft.category, unlockedTech) });
      },

      saveDesign: () => {
        const { draft, day, designs } = get();
        for (const slot of SLOTS_BY_CATEGORY[draft.category]) {
          if (!draft.components[slot]) {
            set({ notification: 'Select all components before saving.' });
            return false;
          }
        }
        const { stats, unitCost } = calcDesignStats(draft.category, draft.components);
        const design: ProductDesign = {
          id: `d-${Date.now()}`,
          name: draft.name.trim() || 'Unnamed',
          category: draft.category,
          components: { ...draft.components },
          stats,
          unitCost,
          sellPrice: draft.sellPrice,
          createdDay: day,
          bodyColor: draft.bodyColor,
          frameStyle: draft.frameStyle,
          logoIcon: draft.logoIcon,
          cameraLayout: draft.cameraLayout,
          boxColor: draft.boxColor,
          boxTextColor: draft.boxTextColor,
          boxStyle: draft.boxStyle,
          notchStyle: draft.notchStyle,
          screenCurvature: draft.screenCurvature,
          buttonColor: draft.buttonColor,
          buttonStyle: draft.buttonStyle,
          bezelSize: draft.bezelSize,
          strapType: draft.strapType,
          strapColor: draft.strapColor,
          backlightColor: draft.backlightColor,
          smartwatchShape: draft.smartwatchShape,
          logoGlow: draft.logoGlow,
          cameraShape: draft.cameraShape,
          buttonPlacement: draft.buttonPlacement,
        };
        set({
          designs: [...designs, design],
          notification: `"${design.name}" saved! Assign it in Factory.`,
        });
        return true;
      },

      deleteDesign: (id) =>
        set({
          designs: get().designs.filter((d) => d.id !== id),
          factories: get().factories.map((f) =>
            f.assignedProductId === id ? { ...f, assignedProductId: null } : f,
          ),
        }),

      releaseDevice: () => {
        const { draft, day, designs, releasedDevices, unlockedTech, achievements, month, activeCampaignIds } = get();
        for (const slot of SLOTS_BY_CATEGORY[draft.category]) {
          if (!draft.components[slot]) {
            set({ notification: 'Select all components before releasing.' });
            return false;
          }
        }
        const { stats, unitCost } = calcDesignStats(draft.category, draft.components);
        
        // Generate critic review
        const review = generateDeviceReview(
          draft.category,
          stats,
          unitCost,
          draft.sellPrice,
          draft.components,
          unlockedTech.length
        );

        const design: ProductDesign = {
          id: `d-${Date.now()}`,
          name: draft.name.trim() || 'Unnamed',
          category: draft.category,
          components: { ...draft.components },
          stats,
          unitCost,
          sellPrice: draft.sellPrice,
          createdDay: day,
          reviewScore: review.score,
          reviewFeedback: review.feedbacks,
          bodyColor: draft.bodyColor,
          frameStyle: draft.frameStyle,
          logoIcon: draft.logoIcon,
          cameraLayout: draft.cameraLayout,
          boxColor: draft.boxColor,
          boxTextColor: draft.boxTextColor,
          boxStyle: draft.boxStyle,
          notchStyle: draft.notchStyle,
          screenCurvature: draft.screenCurvature,
          buttonColor: draft.buttonColor,
          buttonStyle: draft.buttonStyle,
          bezelSize: draft.bezelSize,
          strapType: draft.strapType,
          strapColor: draft.strapColor,
          backlightColor: draft.backlightColor,
          smartwatchShape: draft.smartwatchShape,
          logoGlow: draft.logoGlow,
          cameraShape: draft.cameraShape,
          buttonPlacement: draft.buttonPlacement,
        };
        const avgStats = Object.values(stats).reduce((a, b) => a + b, 0) / 6;
        const { marketingBonus } = getTechEffects(unlockedTech);
        const durability = 80 + Math.floor(avgStats / 10);
        const maintenanceCost = Math.round(unitCost * 0.1);
        const released: ReleasedDevice = {
          ...design,
          releasedMonth: month,
          totalSold: 0,
          totalRevenue: 0,
          totalProfit: 0,
          monthlySales: [],
          durability,
          maxDurability: durability,
          maintenanceCost,
          hype: Math.min(100, Math.round(55 + getCampaignBoost(activeCampaignIds, marketingBonus) * 0.8 + Math.random() * 15)),
          isDiscontinued: false,
        };
        const newDraft = createDraft(draft.category, unlockedTech);
        const newReleasedDevices = [...releasedDevices, released];

        // Check achievements after release
        const s = get();
        const { updated: updatedAch, newlyUnlocked } = checkAchievements(achievements, {
          ...s,
          releasedDevices: newReleasedDevices,
        });

        const rewardCash = newlyUnlocked.reduce((sum, a) => sum + a.reward, 0);
        const achMsg = newlyUnlocked.length > 0 ? ` 🏆 Achievement: ${newlyUnlocked[0].name}!` : '';

        set({
          designs: [...designs, design],
          releasedDevices: newReleasedDevices,
          draft: newDraft,
          achievements: updatedAch,
          cash: s.cash + rewardCash,
          notification: `"${design.name}" released! Critic Score: ${review.score}/100.${achMsg}`,
          activeDeviceReview: {
            name: design.name,
            category: design.category,
            score: review.score,
            feedbacks: review.feedbacks,
          },
          autoAdvance: false, // Pause auto-advance so player can read review
        });
        return true;
      },

      discontinueDevice: (id) => {
        const s = get();
        const factories = s.factories.map((f) =>
          f.assignedProductId === id ? { ...f, assignedProductId: null, progress: 0 } : f
        );
        const releasedDevices = s.releasedDevices.map((d) =>
          d.id === id ? { ...d, isDiscontinued: true, hype: 0 } : d
        );
        set({
          factories,
          releasedDevices,
          notification: `Device discontinued. Production halted.`,
        });
      },

      advanceMonth: () => {
        const s = get();
        const { costReduction } = getTechEffects(s.unlockedTech);

        const updatedDevices = s.releasedDevices.map((device) => {
          const monthlyUnits = s.monthAccumulator.deviceSales[device.id] ?? 0;
          const design = s.designs.find((d) => d.id === device.id);
          const adjustedCost = (design?.unitCost ?? device.unitCost) * (1 - costReduction);
          const revenue = monthlyUnits * device.sellPrice;
          const profit = revenue - monthlyUnits * adjustedCost;

          const durabilityLoss = Math.max(1, Math.floor(device.maxDurability * (0.01 + Math.random() * 0.02)));
          const decayAmt = 5 + Math.floor(Math.random() * 6);
          const newHype = Math.max(0, (device.hype ?? 50) - decayAmt);

          return {
            ...device,
            totalSold: device.totalSold + monthlyUnits,
            totalRevenue: device.totalRevenue + revenue,
            totalProfit: device.totalProfit + profit,
            monthlySales: [...device.monthlySales, monthlyUnits].slice(-12),
            durability: Math.max(0, device.durability - durabilityLoss),
            hype: device.isDiscontinued ? 0 : newHype,
          };
        });

        const employeeCost = s.employees.reduce((sum, emp) => sum + emp.salary, 0);
        const storeMaintenance = s.retailStores.reduce((sum, st) => sum + st.monthlyMaintenance, 0);
        const monthlyDeviceSupportUpkeep = s.releasedDevices.filter(d => !d.isDiscontinued).length * 150000;

        let yearlyBuildingTax = 0;
        if (s.month === 12) {
          yearlyBuildingTax = s.factories.length * 10000000 + s.retailStores.length * 5000000;
        }

        // Loan payments
        const loanPayments = s.loans.reduce((sum, l) => sum + l.monthlyPayment, 0);
        const updatedLoans = s.loans
          .map((l) => ({ ...l, remaining: Math.max(0, l.remaining - l.monthlyPayment) }))
          .filter((l) => l.remaining > 0);

        // Bot AI
        const trendData = s.marketTrends.map((t) => ({ category: t.category, demandMultiplier: t.demandMultiplier }));
        const updatedBots = botAdvanceMonth(s.botCompanies, s.reputation, s.fans, s.month, trendData);

        const lastMonthRevenue = s.salesHistory.length > 0 ? s.salesHistory[s.salesHistory.length - 1].revenue : 0;
        const shares = calcMarketShares(updatedBots, lastMonthRevenue, s.reputation, s.fans);
        const playerShare = shares.find((sh) => sh.id === 'player')?.share ?? 0;

        const actualMonthProfit = s.monthAccumulator.revenue 
          - s.monthAccumulator.productionCost 
          - s.monthAccumulator.marketingCost 
          - s.monthAccumulator.upkeep 
          - employeeCost 
          - storeMaintenance 
          - loanPayments 
          - monthlyDeviceSupportUpkeep 
          - yearlyBuildingTax;

        let quarterlyReports = [...s.quarterlyReports];
        let nextActiveQuarterReport: QuarterlyReport | null = null;
        if (s.month % 3 === 0) {
          const quarterReport: QuarterlyReport = {
            quarter: Math.ceil(s.month / 3),
            year: Math.floor((s.month - 1) / 12) + 1,
            month: s.month,
            playerRevenue: s.monthAccumulator.revenue,
            playerProfit: actualMonthProfit,
            playerCash: s.cash - employeeCost - storeMaintenance - loanPayments - monthlyDeviceSupportUpkeep - yearlyBuildingTax,
            totalMarketRevenue: shares.reduce((sum, sh) => sum + (sh.id === 'player' ? s.monthAccumulator.revenue : updatedBots.find((b) => b.id === sh.id)?.monthlyRevenue ?? 0), 0),
            marketShare: playerShare,
            competitorSummaries: updatedBots.map((b) => ({
              name: b.name, revenue: b.monthlyRevenue, profit: b.monthlyProfit, reputation: b.reputation, trend: b.trend,
            })),
            highlights: [],
          };
          if (playerShare > 25) quarterReport.highlights.push('Market Leader!');
          if (actualMonthProfit > 10000000) quarterReport.highlights.push('Strong profitability');
          if (updatedBots.some((b) => b.reputation > s.reputation)) quarterReport.highlights.push('Competitors surpassing you');
          quarterlyReports = [...quarterlyReports, quarterReport].slice(-4);
          nextActiveQuarterReport = quarterReport;
        }

        const newCash = s.cash - employeeCost - storeMaintenance - loanPayments - monthlyDeviceSupportUpkeep - yearlyBuildingTax;

        // Stock prices fluctuation
        const updatedStockPrices = { ...s.stockPrices };
        const stockNewsItems: NewsItem[] = [];
        for (const bot of updatedBots) {
          const currentPriceObj = s.stockPrices?.[bot.id] || { price: 100, history: [100], changePercent: 0 };
          const botReleasedDeviceThisMonth = bot.lastReleaseMonth === s.month;
          let totalChangePercent = bot.monthlyProfit / 100000000 + (Math.random() * 0.08 - 0.04);
          if (botReleasedDeviceThisMonth) {
            totalChangePercent += 0.05 + Math.random() * 0.10;
          }
          totalChangePercent = Math.max(-0.25, Math.min(0.25, totalChangePercent));
          
          const newPrice = Math.max(1, Math.round(currentPriceObj.price * (1 + totalChangePercent)));
          const finalChangePercent = currentPriceObj.price > 0 ? (newPrice - currentPriceObj.price) / currentPriceObj.price : 0;
          const changePercentVal = parseFloat((finalChangePercent * 100).toFixed(2));
          const newHistory = [...currentPriceObj.history, newPrice].slice(-12);
          
          updatedStockPrices[bot.id] = {
            price: newPrice,
            history: newHistory,
            changePercent: changePercentVal,
          };

          const ticker = bot.id === 'bot-1' ? 'NOVA' : bot.id === 'bot-2' ? 'PIXL' : bot.id === 'bot-3' ? 'ZNTH' : bot.id === 'bot-4' ? 'BBOX' : 'NEXG';
          if (changePercentVal > 8) {
            stockNewsItems.push({
              id: `stock-${Date.now()}-${bot.id}`,
              text: `${ticker} stock surged by ${changePercentVal}% following strong performance${botReleasedDeviceThisMonth ? ' and a new product launch' : ''}!`,
              icon: '📈',
              month: s.month,
            });
          } else if (changePercentVal < -8) {
            stockNewsItems.push({
              id: `stock-${Date.now()}-${bot.id}`,
              text: `${ticker} stock dropped by ${Math.abs(changePercentVal)}% amid market pressure.`,
              icon: '📉',
              month: s.month,
            });
          }
        }

        const portfolioValue = Object.entries(s.playerPortfolio || {}).reduce((sum, [botId, holding]) => {
          const currentPrice = updatedStockPrices[botId]?.price ?? 0;
          return sum + holding.shares * currentPrice;
        }, 0);

        const valuation = newCash
          + updatedDevices.reduce((sum, d) => sum + d.totalProfit, 0) * 2
          + s.factories.reduce((sum, f) => sum + f.level * 5000000, 0)
          + s.retailStores.reduce((sum, st) => sum + st.purchaseCost * 0.5, 0)
          + s.unlockedTech.length * 3000000
          + portfolioValue;

        // Market events
        const eventRoll = Math.random();
        let newEvent: MarketEvent | null = null;
        if (eventRoll > 0.65 && s.marketEvents.length < 3) {
          const events: Omit<MarketEvent, 'id' | 'daysLeft'>[] = [
            { label: 'Holiday Season', description: 'Consumer spending increases across all categories', icon: '🎄', effect: { category: 'all', demandMultiplier: 1.3 }, duration: 2 },
            { label: 'Supply Chain Crisis', description: 'Component costs spike, production slows', icon: '📦', effect: { costReduction: -0.25 }, duration: 2 },
            { label: 'Tech Exhibition', description: 'New tech releases boost smartphone demand', icon: '🔬', effect: { category: 'smartphone', demandMultiplier: 1.4 }, duration: 2 },
            { label: 'Fitness Trend', description: 'Wearable devices see increased demand', icon: '🏃', effect: { category: 'smartwatch', demandMultiplier: 1.35 }, duration: 2 },
            { label: 'Remote Work Boom', description: 'Laptop demand surges', icon: '🏠', effect: { category: 'laptop', demandMultiplier: 1.4 }, duration: 2 },
            { label: 'Viral Marketing', description: 'Social media buzz boosts all device sales', icon: '📱', effect: { category: 'all', demandMultiplier: 1.2, appealBoost: 10 }, duration: 1 },
            { label: 'Product Recall Scare', description: 'A competitor recall shakes consumer trust', icon: '⚠️', effect: { category: 'all', demandMultiplier: 1.15 }, duration: 2 },
            { label: 'Chip Shortage', description: 'Processor costs increase temporarily', icon: '🔧', effect: { costReduction: -0.15 }, duration: 1 },
            { label: 'Music Festival Season', description: 'Earbuds demand surges', icon: '🎵', effect: { category: 'earbuds', demandMultiplier: 1.5 }, duration: 2 },
            { label: 'Binge-Watching Craze', description: 'Smart TV purchases surge globally', icon: '📺', effect: { category: 'smarttv', demandMultiplier: 1.45 }, duration: 2 },
            { label: 'Tablet Boom', description: 'Tablets spike in demand due to remote learning', icon: '🖥️', effect: { category: 'tablet', demandMultiplier: 1.4 }, duration: 2 },
          ];
          const event = events[Math.floor(Math.random() * events.length)];
          newEvent = { ...event, id: `evt-${Date.now()}`, daysLeft: event.duration };
        }

        const updatedEvents = s.marketEvents
          .map((e) => ({ ...e, daysLeft: e.daysLeft - 1 }))
          .filter((e) => e.daysLeft > 0);

        const updatedCompetitors = updatedBots.map((b) => ({
          id: b.id, name: b.name, color: b.color,
          monthlySales: Math.floor(b.monthlyRevenue / 100),
          reputation: b.reputation, trend: b.trend,
        }));

        const salesRecord: MonthlySales = {
          month: s.month,
          revenue: s.monthAccumulator.revenue,
          unitsSold: s.monthAccumulator.unitsSold,
          profit: actualMonthProfit,
          deviceSales: s.monthAccumulator.deviceSales,
        };

        // Employee XP update
        const updatedEmployees = s.employees.map((emp) => {
          let xpGain = 5 + Math.floor(Math.random() * 5);
          if (emp.trait === 'diligent') xpGain = Math.round(xpGain * 1.15);
          if (emp.trait === 'trainee') xpGain = Math.round(xpGain * 1.2);
          let newXp = emp.xp + xpGain;
          let newLevel = emp.level;
          let newXpToNext = emp.xpToNextLevel;
          while (newXp >= newXpToNext) {
            newXp -= newXpToNext;
            newLevel++;
            newXpToNext = Math.round(newXpToNext * 1.15);
          }
          const skillGain = newLevel > emp.level ? 2 : 0;
          const salaryIncrease = newLevel > emp.level ? Math.round(emp.salary * 0.03) : 0;
          return {
            ...emp,
            morale: Math.min(100, Math.max(20, emp.morale + (actualMonthProfit > 0 ? 2 : -3) + Math.floor(Math.random() * 4 - 2))),
            xp: newXp, level: newLevel, xpToNextLevel: newXpToNext,
            skill: Math.min(100, emp.skill + skillGain),
            salary: emp.salary + salaryIncrease,
          };
        });

        const newFans = s.fans + Math.floor(s.monthAccumulator.unitsSold * 0.3);
        const newReputation = Math.min(100, s.reputation + s.monthAccumulator.unitsSold * 0.05);

        // Check achievements
        const updatedSalesHistory = [...s.salesHistory, salesRecord].slice(-12);
        const { updated: updatedAch, newlyUnlocked } = checkAchievements(s.achievements, {
          cash: newCash,
          fans: newFans,
          totalUnitsSold: s.totalUnitsSold + s.monthAccumulator.unitsSold,
          releasedDevices: updatedDevices,
          unlockedTech: s.unlockedTech,
          employees: s.employees,
          factories: s.factories,
          retailStores: s.retailStores,
          salesHistory: updatedSalesHistory,
          marketShare: playerShare,
          companyValuation: valuation,
          month: s.month,
        });
        const rewardCash = newlyUnlocked.reduce((sum, a) => sum + a.reward, 0);
        const achNotif = newlyUnlocked.length > 0
          ? ` 🏆 Achievement unlocked: ${newlyUnlocked[0].name}!`
          : '';

        // News history
        const newsItems: NewsItem[] = [];
        if (newlyUnlocked.length > 0) {
          newsItems.push({ id: `news-${Date.now()}`, text: `Achievement: ${newlyUnlocked[0].name}`, icon: '🏆', month: s.month });
        }
        if (newEvent) {
          newsItems.push({ id: `news-${Date.now() + 1}`, text: newEvent.label, icon: newEvent.icon, month: s.month });
        }
        if (yearlyBuildingTax > 0) {
          newsItems.push({ id: `news-${Date.now() + 2}`, text: `Paid Yearly Building Upkeep: -$${yearlyBuildingTax.toLocaleString()}`, icon: '🏢', month: s.month });
          setTimeout(() => set({ notification: `🏢 Paid Yearly Building Upkeep: -$${yearlyBuildingTax.toLocaleString()}` }), 200);
        }

        set({
          releasedDevices: updatedDevices,
          salesHistory: updatedSalesHistory,
          cash: newCash + rewardCash,
          fans: newFans,
          reputation: newReputation,
          totalUnitsSold: s.totalUnitsSold + s.monthAccumulator.unitsSold,
          marketEvents: newEvent ? [...updatedEvents, newEvent] : updatedEvents,
          competitors: updatedCompetitors,
          botCompanies: updatedBots,
          marketShare: playerShare,
          companyValuation: valuation,
          quarterlyReports,
          employees: updatedEmployees,
          loans: updatedLoans,
          achievements: updatedAch,
          newsHistory: [...s.newsHistory, ...newsItems, ...stockNewsItems].slice(-30),
          stockPrices: updatedStockPrices,
          notification: `Month ${s.month} complete! Revenue: $${s.monthAccumulator.revenue.toLocaleString()}${achNotif}`,
          monthAccumulator: {
            revenue: 0,
            productionCost: 0,
            marketingCost: 0,
            upkeep: 0,
            unitsSold: 0,
            deviceSales: {},
          },
          ...(nextActiveQuarterReport ? {
            activeQuarterlyReport: nextActiveQuarterReport,
            autoAdvance: false,
          } : {}),
        });
      },

      combineParts: (slot, part1Id, part2Id) => {
        const s = get();
        const part1 = COMPONENTS.find((c) => c.id === part1Id) || s.craftedParts.find((c) => c.id === part1Id);
        const part2 = COMPONENTS.find((c) => c.id === part2Id) || s.craftedParts.find((c) => c.id === part2Id);
        if (!part1 || !part2) { set({ notification: 'Invalid parts selected.' }); return false; }
        if (part1.slot !== slot || part2.slot !== slot) { set({ notification: 'Parts must be the same type.' }); return false; }
        if (part1Id === part2Id) { set({ notification: 'Select two different parts.' }); return false; }
        const combineCost = Math.floor((part1.cost + part2.cost) * 0.5) * 1000;
        if (s.cash < combineCost) { set({ notification: `Not enough cash. Need $${combineCost.toLocaleString()}.` }); return false; }
        const maxTier = Math.max(part1.tier, part2.tier);
        const bonusMultiplier = 1.2 + maxTier * 0.1;
        const mergedStats: Partial<Record<string, number>> = {};
        const allStatKeys = new Set([...Object.keys(part1.stats), ...Object.keys(part2.stats)]);
        for (const key of allStatKeys) {
          const v1 = part1.stats[key as keyof typeof part1.stats] ?? 0;
          const v2 = part2.stats[key as keyof typeof part2.stats] ?? 0;
          mergedStats[key] = Math.round(Math.max(v1, v2) * bonusMultiplier + Math.min(v1, v2) * 0.5);
        }
        const avgTier = (part1.tier + part2.tier) / 2;
        const craftedTier = Math.min(5, Math.ceil(avgTier + 0.5));
        const namePrefix = craftedTier >= 5 ? 'Ultra' : craftedTier >= 4 ? 'Pro Max' : craftedTier >= 3 ? 'Enhanced' : 'Refined';
        const slotName = slot.charAt(0).toUpperCase() + slot.slice(1);
        const newPart: CraftedPart = {
          id: `crafted-${Date.now()}`,
          name: `${namePrefix} ${slotName}`,
          slot,
          tier: craftedTier,
          cost: Math.round((part1.cost + part2.cost) * 0.7),
          stats: mergedStats as Partial<DeviceStats>,
          categories: [...new Set([...part1.categories, ...part2.categories])],
          craftedFrom: [part1Id, part2Id],
          craftedMonth: s.month,
        };
        set({ cash: s.cash - combineCost, craftedParts: [...s.craftedParts, newPart], notification: `Crafted "${newPart.name}" (Tier ${craftedTier})!` });
        return true;
      },

      deleteCraftedPart: (id) => set({ craftedParts: get().craftedParts.filter((p) => p.id !== id) }),

      startResearch: (techId) => {
        const s = get();
        if (s.researching) { set({ notification: 'Already researching.' }); return false; }
        const tech = getTech(techId);
        if (!tech || s.unlockedTech.includes(techId)) return false;
        if (tech.prerequisites.some((p) => !s.unlockedTech.includes(p))) {
          set({ notification: 'Prerequisites not met.' }); return false;
        }
        if (s.cash < tech.cost) { set({ notification: 'Not enough cash.' }); return false; }
        const { labUnlocked } = getTechEffects(s.unlockedTech);
        const daysReduction = labUnlocked ? 0.8 : 1.0;
        set({
          cash: s.cash - tech.cost,
          researching: { techId, daysLeft: Math.ceil(tech.researchDays * daysReduction) },
          notification: `Researching ${tech.name}…`,
        });
        return true;
      },

      toggleCampaign: (id) => {
        const active = get().activeCampaignIds;
        set({ activeCampaignIds: active.includes(id) ? active.filter((x) => x !== id) : [...active, id] });
      },

      assignProduct: (factoryId, productId) =>
        set({ factories: get().factories.map((f) => f.id === factoryId ? { ...f, assignedProductId: productId, progress: 0 } : f) }),

      upgradeFactory: (factoryId) => {
        const s = get();
        const f = s.factories.find((x) => x.id === factoryId);
        if (!f) return false;
        const cost = 18000000 * f.level;
        if (s.cash < cost) { set({ notification: 'Not enough cash.' }); return false; }
        set({ cash: s.cash - cost, factories: s.factories.map((x) => x.id === factoryId ? { ...x, level: x.level + 1, capacity: x.capacity + 5 } : x) });
        return true;
      },

      buyFactory: () => {
        const s = get();
        const cost = 32000000 + s.factories.length * 15000000;
        if (s.cash < cost) { set({ notification: 'Not enough cash.' }); return false; }
        const n = s.factories.length + 1;
        set({
          cash: s.cash - cost,
          factories: [...s.factories, { id: `f-${Date.now()}`, name: `Line ${n}`, level: 1, capacity: 8, assignedProductId: null, assignedEmployeeId: null, progress: 0 }],
        });
        return true;
      },

      hireEmployee: (department) => {
        const s = get();
        const hireCost = 2000000 + s.employees.length * 200000;
        if (s.cash < hireCost) { set({ notification: `Not enough cash. Need $${hireCost.toLocaleString()}.` }); return false; }
        if (s.employees.length >= 50) { set({ notification: 'Maximum employees reached (50).' }); return false; }
        const firstNames = ['Maya', 'Liam', 'Zara', 'Kai', 'Nova', 'Ethan', 'Aria', 'Finn', 'Luna', 'Owen', 'Ivy', 'Jude', 'Riley', 'Quinn', 'Ava', 'Max', 'Iris', 'Leo', 'Sage', 'Dante'];
        const lastNames = ['Park', 'Singh', 'Costa', 'Nakamura', 'Okafor', 'Berg', 'Reyes', 'Chang', 'Mueller', 'Tanaka', 'Ali', 'Sato', 'Kim', 'Li', 'Wang', 'Patel', 'Joshi', 'Lee', 'Chen', 'Wu'];
        const traits: Employee['trait'][] = ['efficient', 'expensive', 'unstable', 'diligent', 'resilient', 'lazy', 'veteran', 'trainee'];
        const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        const skill = 30 + Math.floor(Math.random() * 40);
        const trait = traits[Math.floor(Math.random() * traits.length)];
        const baseSalary = 6000 + skill * 60 + Math.floor(Math.random() * 2000);
        const salaryModifier = trait === 'expensive' ? 1.2 : trait === 'trainee' ? 0.85 : 1;
        const salary = Math.round(baseSalary * salaryModifier);
        const emp: Employee = {
          id: `emp-${Date.now()}`, name, department, skill, salary,
          morale: 60 + Math.floor(Math.random() * 30),
          hiredMonth: s.month, trait, level: 1, xp: 0, xpToNextLevel: 100, assignedLineId: null,
        };
        const updatedDepartments = s.departments.map((d) =>
          d.id === department ? { ...d, headcount: d.headcount + 1, bonus: d.bonus + Math.floor(skill / 20) } : d
        );
        set({ cash: s.cash - hireCost, employees: [...s.employees, emp], departments: updatedDepartments, notification: `Hired ${name} (${trait}) in ${department.toUpperCase()}!` });
        return true;
      },

      fireEmployee: (id) => {
        const s = get();
        const emp = s.employees.find((e) => e.id === id);
        if (!emp) return;
        const updatedDepartments = s.departments.map((d) =>
          d.id === emp.department ? { ...d, headcount: Math.max(0, d.headcount - 1), bonus: Math.max(0, d.bonus - Math.floor(emp.skill / 20)) } : d
        );
        set({ employees: s.employees.filter((e) => e.id !== id), departments: updatedDepartments, notification: `${emp.name} has been let go.` });
      },

      setDepartmentBudget: (deptId, budget) =>
        set({ departments: get().departments.map((d) => d.id === deptId ? { ...d, budget: Math.max(0, budget) } : d) }),

      assignEmployeeToLine: (employeeId, lineId) => {
        const s = get();
        const emp = s.employees.find((e) => e.id === employeeId);
        if (!emp) return;
        let factories = s.factories.map((f) => f.assignedEmployeeId === employeeId ? { ...f, assignedEmployeeId: null } : f);
        if (lineId) {
          factories = factories.map((f) => f.id === lineId ? { ...f, assignedEmployeeId: employeeId } : f);
          set({ factories, notification: `${emp.name} assigned to production line.` });
        } else {
          set({ factories, notification: `${emp.name} unassigned from production line.` });
        }
      },

      repairDevice: (deviceId) => {
        const s = get();
        const device = s.releasedDevices.find((d) => d.id === deviceId);
        if (!device) { set({ notification: 'Device not found.' }); return false; }
        if (device.durability >= device.maxDurability) { set({ notification: 'Device already at full durability.' }); return false; }
        const missingDurability = device.maxDurability - device.durability;
        const repairCost = Math.round(missingDurability * device.maintenanceCost * 0.5);
        if (s.cash < repairCost) { set({ notification: `Not enough cash. Repair costs $${repairCost}.` }); return false; }
        set({
          cash: s.cash - repairCost,
          releasedDevices: s.releasedDevices.map((d) => d.id === deviceId ? { ...d, durability: d.maxDurability } : d),
          totalRepairCosts: s.totalRepairCosts + repairCost,
          notification: `"${device.name}" repaired for $${repairCost}.`,
        });
        return true;
      },

      getDeviceDurability: (deviceId) => {
        const device = get().releasedDevices.find((d) => d.id === deviceId);
        return device?.durability ?? 0;
      },

      toggleAutoAdvance: () => set((s) => ({ autoAdvance: !s.autoAdvance })),
      setAutoAdvanceSpeed: (speed) => set({ autoAdvanceSpeed: Math.max(1, Math.min(5, speed)) }),

      // ── Retail Stores ────────────────────────────────────────────────────────
      purchaseStore: (region, tier) => {
        const s = get();
        const template = STORE_REGIONS.find((r) => r.region === region);
        if (!template) return false;
        const costKey = `tier${tier}Cost` as keyof typeof template;
        const cost = template[costKey] as number;
        if (s.cash < cost) { set({ notification: `Not enough cash. Store costs $${cost.toLocaleString()}.` }); return false; }
        if (s.retailStores.filter((st) => st.region === region).length >= 3) {
          set({ notification: 'Maximum stores per region reached.' }); return false;
        }
        const store: RetailStore = {
          id: `store-${Date.now()}`,
          name: `${template.name} ${tier === 1 ? 'Kiosk' : tier === 2 ? 'Store' : 'Mega Mall'}`,
          region,
          tier,
          purchaseCost: cost,
          monthlyMaintenance: template.maintenanceBase * tier,
          salesMultiplier: template.salesMultiplier * (1 + (tier - 1) * 0.3),
          demandBonus: template.demandBonus * tier,
          purchasedMonth: s.month,
          isUpgrading: false,
          upgradeCompletesMonth: null,
        };

        // Check achievement
        const newStores = [...s.retailStores, store];
        const { updated: updatedAch, newlyUnlocked } = checkAchievements(s.achievements, { ...s, cash: s.cash - cost, retailStores: newStores });
        const rewardCash = newlyUnlocked.reduce((sum, a) => sum + a.reward, 0);
        const achMsg = newlyUnlocked.length > 0 ? ` 🏆 ${newlyUnlocked[0].name}!` : '';

        set({
          cash: s.cash - cost + rewardCash,
          retailStores: newStores,
          achievements: updatedAch,
          notification: `${store.name} opened in ${template.name}!${achMsg}`,
        });
        return true;
      },

      upgradeStore: (storeId) => {
        const s = get();
        const store = s.retailStores.find((st) => st.id === storeId);
        if (!store || store.tier >= 3) { set({ notification: 'Cannot upgrade further.' }); return false; }
        const template = STORE_REGIONS.find((r) => r.region === store.region);
        if (!template) return false;
        const newTier = (store.tier + 1) as 2 | 3;
        const costKey = `tier${newTier}Cost` as keyof typeof template;
        const upgradeCost = (template[costKey] as number) - store.purchaseCost;
        if (s.cash < upgradeCost) { set({ notification: `Not enough cash. Upgrade costs $${upgradeCost.toLocaleString()}.` }); return false; }
        set({
          cash: s.cash - upgradeCost,
          retailStores: s.retailStores.map((st) => st.id === storeId ? {
            ...st, tier: newTier,
            purchaseCost: template[costKey] as number,
            monthlyMaintenance: template.maintenanceBase * newTier,
            salesMultiplier: template.salesMultiplier * (1 + (newTier - 1) * 0.3),
            demandBonus: template.demandBonus * newTier,
          } : st),
          notification: `Store upgraded to ${newTier === 2 ? 'Flagship' : 'Mega Mall'}!`,
        });
        return true;
      },

      sellStore: (storeId) => {
        const s = get();
        const store = s.retailStores.find((st) => st.id === storeId);
        if (!store) return;
        const saleValue = Math.round(store.purchaseCost * 0.6);
        set({
          cash: s.cash + saleValue,
          retailStores: s.retailStores.filter((st) => st.id !== storeId),
          notification: `Store sold for $${saleValue.toLocaleString()}.`,
        });
      },

      // ── Loans ────────────────────────────────────────────────────────────────
      takeLoan: (amount) => {
        const s = get();
        const maxLoan = 200000000;
        const currentDebt = s.loans.reduce((sum, l) => sum + l.remaining, 0);
        if (currentDebt + amount > maxLoan) {
          set({ notification: `Loan limit exceeded. Max debt: $${maxLoan.toLocaleString()}.` }); return false;
        }
        const interestRate = 0.05;
        const months = 12;
        const monthlyPayment = Math.round((amount * (1 + interestRate)) / months);
        const loan: Loan = {
          id: `loan-${Date.now()}`,
          principal: amount,
          remaining: amount,
          monthlyPayment,
          interestRate,
          takenMonth: s.month,
          dueMonth: s.month + months,
        };
        set({ cash: s.cash + amount, loans: [...s.loans, loan], notification: `Loan of $${amount.toLocaleString()} received. $${monthlyPayment}/month.` });
        return true;
      },

      repayLoan: (loanId) => {
        const s = get();
        const loan = s.loans.find((l) => l.id === loanId);
        if (!loan) return false;
        if (s.cash < loan.remaining) { set({ notification: 'Not enough cash to repay loan.' }); return false; }
        set({ cash: s.cash - loan.remaining, loans: s.loans.filter((l) => l.id !== loanId), notification: `Loan fully repaid! $${loan.remaining.toLocaleString()} paid off.` });
        return true;
      },

      buyStock: (botId, shares) => {
        const s = get();
        if (shares <= 0) return false;
        const currentPriceObj = s.stockPrices?.[botId];
        if (!currentPriceObj) {
          set({ notification: 'Stock not found.' });
          return false;
        }
        const cost = shares * currentPriceObj.price;
        if (s.cash < cost) {
          set({ notification: 'Not enough cash to buy this many shares.' });
          return false;
        }
        const portfolio = { ...s.playerPortfolio };
        const currentHolding = portfolio[botId] || { shares: 0, avgCost: 0 };
        const newShares = currentHolding.shares + shares;
        const newAvgCost = (currentHolding.shares * currentHolding.avgCost + cost) / newShares;
        portfolio[botId] = { shares: newShares, avgCost: newAvgCost };

        const portfolioValue = Object.entries(portfolio).reduce((sum, [bId, holding]) => {
          const price = s.stockPrices?.[bId]?.price ?? 0;
          return sum + holding.shares * price;
        }, 0);
        const valuation = (s.cash - cost)
          + s.releasedDevices.reduce((sum, d) => sum + d.totalProfit, 0) * 2
          + s.factories.reduce((sum, f) => sum + f.level * 5000000, 0)
          + s.retailStores.reduce((sum, st) => sum + st.purchaseCost * 0.5, 0)
          + s.unlockedTech.length * 3000000
          + portfolioValue;

        const ticker = botId === 'bot-1' ? 'NOVA' : botId === 'bot-2' ? 'PIXL' : botId === 'bot-3' ? 'ZNTH' : botId === 'bot-4' ? 'BBOX' : 'NEXG';

        set({
          cash: s.cash - cost,
          playerPortfolio: portfolio,
          companyValuation: valuation,
          notification: `Bought ${shares.toLocaleString()} shares of ${ticker} for $${cost.toLocaleString()}!`,
        });
        return true;
      },

      sellStock: (botId, shares) => {
        const s = get();
        if (shares <= 0) return false;
        const portfolio = { ...s.playerPortfolio };
        const currentHolding = portfolio[botId] || { shares: 0, avgCost: 0 };
        if (currentHolding.shares < shares) {
          set({ notification: 'Not enough shares to sell.' });
          return false;
        }
        const currentPriceObj = s.stockPrices?.[botId];
        if (!currentPriceObj) {
          set({ notification: 'Stock not found.' });
          return false;
        }
        const revenue = shares * currentPriceObj.price;
        const newShares = currentHolding.shares - shares;
        const newAvgCost = newShares === 0 ? 0 : currentHolding.avgCost;
        portfolio[botId] = { shares: newShares, avgCost: newAvgCost };

        const portfolioValue = Object.entries(portfolio).reduce((sum, [bId, holding]) => {
          const price = s.stockPrices?.[bId]?.price ?? 0;
          return sum + holding.shares * price;
        }, 0);
        const valuation = (s.cash + revenue)
          + s.releasedDevices.reduce((sum, d) => sum + d.totalProfit, 0) * 2
          + s.factories.reduce((sum, f) => sum + f.level * 5000000, 0)
          + s.retailStores.reduce((sum, st) => sum + st.purchaseCost * 0.5, 0)
          + s.unlockedTech.length * 3000000
          + portfolioValue;

        const ticker = botId === 'bot-1' ? 'NOVA' : botId === 'bot-2' ? 'PIXL' : botId === 'bot-3' ? 'ZNTH' : botId === 'bot-4' ? 'BBOX' : 'NEXG';

        set({
          cash: s.cash + revenue,
          playerPortfolio: portfolio,
          companyValuation: valuation,
          notification: `Sold ${shares.toLocaleString()} shares of ${ticker} for $${revenue.toLocaleString()}!`,
        });
        return true;
      },

      advanceDay: () => {
        const s = get();
        const finance = emptyFinance();
        const { factorySpeed, marketingBonus, salesBonus, costReduction } = getTechEffects(s.unlockedTech);
        const campaignBoost = getCampaignBoost(s.activeCampaignIds, marketingBonus);

        let inventory = { ...s.inventory };
        let factories = processProduction(s.factories, factorySpeed);
        factories = factories.map((f) => {
          const line = { ...f };
          if (!line.assignedProductId) return line;
          const design = s.designs.find((d) => d.id === line.assignedProductId);
          if (!design) return line;
          while (line.progress >= 100) {
            line.progress -= 100;
            inventory[line.assignedProductId] = (inventory[line.assignedProductId] ?? 0) + 1000;
            finance.productionCost += design.unitCost * 1000 * (1 - costReduction);
          }
          return line;
        });

        const { unitsSold, revenue } = simulateSales(
          s.designs, s.releasedDevices, inventory, s.marketTrends, s.fans, s.reputation, campaignBoost, salesBonus,
        );
        finance.revenue = revenue;

        let units = 0;
        for (const [pid, qty] of Object.entries(unitsSold)) {
          inventory[pid] = Math.max(0, (inventory[pid] ?? 0) - qty);
          units += qty;
        }

        finance.marketingCost = s.activeCampaignIds.reduce(
          (sum, id) => sum + (CAMPAIGNS.find((c) => c.id === id)?.dailyCost ?? 0), 0,
        );
        finance.upkeep = s.factories.reduce((sum, f) => sum + 120000 + f.level * 60000, 0);
        finance.profit = finance.revenue - finance.productionCost - finance.marketingCost - finance.upkeep;

        let cash = s.cash + finance.profit;
        let fans = s.fans + Math.floor(units * 0.4);
        let reputation = Math.min(100, s.reputation + units * 0.08);
        let unlockedTech = [...s.unlockedTech];
        let researching = s.researching ? { ...s.researching } : null;
        let trends = s.marketTrends.map((t) => ({ ...t, daysLeft: t.daysLeft - 1 })).filter((t) => t.daysLeft > 0);
        const nt = rollTrend(s.day);
        if (nt) trends = [...trends, nt];

        if (researching) {
          researching.daysLeft -= 1;
          if (researching.daysLeft <= 0) {
            const tech = getTech(researching.techId);
            if (tech) {
              unlockedTech.push(tech.id);
              set({ notification: `Unlocked: ${tech.name}! 🔬` });
            }
            researching = null;
          }
        }

        const day = s.day + 1;
        const isNewMonth = day > 30;
        const newDay = isNewMonth ? 1 : day;
        const newMonth = isNewMonth ? (s.month >= 12 ? 1 : s.month + 1) : s.month;

        // Check achievements during day advance
        const { updated: updatedAch, newlyUnlocked } = checkAchievements(s.achievements, {
          cash, fans, totalUnitsSold: s.totalUnitsSold + units,
          releasedDevices: s.releasedDevices, unlockedTech,
          employees: s.employees, factories, retailStores: s.retailStores,
          salesHistory: s.salesHistory, marketShare: s.marketShare,
          companyValuation: s.companyValuation, month: s.month,
        });
        const rewardCash = newlyUnlocked.reduce((sum, a) => sum + a.reward, 0);
        if (rewardCash > 0) cash += rewardCash;
        if (newlyUnlocked.length > 0) {
          setTimeout(() => set({ notification: `🏆 Achievement: ${newlyUnlocked[0].name}! +$${newlyUnlocked[0].reward.toLocaleString()}` }), 100);
        }

        set({
          day: newDay, month: newMonth, cash, fans, reputation,
          inventory, factories, marketTrends: trends,
          unlockedTech, researching,
          lastDayFinance: finance,
          profitHistory: [...s.profitHistory.slice(-29), finance.profit],
          totalUnitsSold: s.totalUnitsSold + units,
          achievements: updatedAch,
          monthAccumulator: {
            revenue: s.monthAccumulator.revenue + finance.revenue,
            productionCost: s.monthAccumulator.productionCost + finance.productionCost,
            marketingCost: s.monthAccumulator.marketingCost + finance.marketingCost,
            upkeep: s.monthAccumulator.upkeep + finance.upkeep,
            unitsSold: s.monthAccumulator.unitsSold + units,
            deviceSales: (() => {
              const deviceSales = { ...s.monthAccumulator.deviceSales };
              for (const [pid, qty] of Object.entries(unitsSold)) {
                deviceSales[pid] = (deviceSales[pid] ?? 0) + qty;
              }
              return deviceSales;
            })(),
          },
        });
        if (isNewMonth) {
          get().advanceMonth();
          const { playerUuid } = get();
          if (playerUuid) {
            set({ cloudSyncStatus: 'syncing' });
            api.saveGame(playerUuid, get()).then((success) => {
              if (success) {
                set({ cloudSyncStatus: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
              } else {
                set({ cloudSyncStatus: 'error' });
              }
            }).catch(() => {
              set({ cloudSyncStatus: 'error' });
            });
          }
        }
      },
    }),
    {
      name: 'devices-tycoon-v3',
      version: SAVE_VERSION,
      merge: (persisted, current) => {
        if (!persisted) return current;
        const clean = sanitizePersistedState(persisted);
        let draft = { ...current.draft, ...clean.draft };
        if (!draft.components || Object.keys(draft.components).length === 0) {
          draft = createDraft(draft.category ?? 'smartphone', clean.unlockedTech ?? []);
        }
        const screen: ScreenId = clean.gameStarted
          ? clean.screen && clean.screen !== 'menu' ? clean.screen : 'devices'
          : 'menu';
        return {
          ...current, ...clean, draft, screen,
          profitHistory:     clean.profitHistory     ?? current.profitHistory     ?? [],
          releasedDevices:   clean.releasedDevices   ?? current.releasedDevices   ?? [],
          salesHistory:      clean.salesHistory       ?? current.salesHistory       ?? [],
          marketEvents:      clean.marketEvents       ?? current.marketEvents       ?? [],
          competitors:       clean.competitors        ?? current.competitors        ?? initialCompetitors(),
          craftedParts:      clean.craftedParts       ?? current.craftedParts       ?? [],
          botCompanies:      clean.botCompanies       ?? current.botCompanies       ?? createBotCompanies(),
          employees:         clean.employees          ?? current.employees          ?? initialEmployees(),
          departments:       clean.departments        ?? current.departments        ?? initialDepartments(),
          companyValuation:  clean.companyValuation   ?? current.companyValuation   ?? STARTING_CASH,
          quarterlyReports:  clean.quarterlyReports   ?? current.quarterlyReports   ?? [],
          marketShare:       clean.marketShare        ?? current.marketShare        ?? 0,
          devicePricing:     clean.devicePricing      ?? current.devicePricing      ?? {},
          totalRepairCosts:  clean.totalRepairCosts   ?? current.totalRepairCosts   ?? 0,
          totalMaintenanceSpent: clean.totalMaintenanceSpent ?? current.totalMaintenanceSpent ?? 0,
          retailStores:      clean.retailStores       ?? current.retailStores       ?? [],
          achievements:      clean.achievements       ?? current.achievements       ?? initialAchievements(),
          loans:             clean.loans              ?? current.loans              ?? [],
          newsHistory:       clean.newsHistory        ?? current.newsHistory        ?? [],
          stockPrices:       clean.stockPrices        ?? current.stockPrices        ?? INITIAL_STATE.stockPrices,
          playerPortfolio:   clean.playerPortfolio    ?? current.playerPortfolio    ?? INITIAL_STATE.playerPortfolio,
          monthAccumulator:  clean.monthAccumulator   ?? current.monthAccumulator   ?? INITIAL_STATE.monthAccumulator,
          playerUuid:        clean.playerUuid         ?? current.playerUuid         ?? null,
          lastSyncedAt:      clean.lastSyncedAt       ?? current.lastSyncedAt       ?? null,
        };
      },
      partialize: (s) => ({
        version: SAVE_VERSION,
        companyName: s.companyName, cash: s.cash, fans: s.fans,
        reputation: s.reputation, day: s.day, month: s.month,
        screen: s.screen, gameStarted: s.gameStarted,
        unlockedTech: s.unlockedTech, researching: s.researching,
        designs: s.designs, inventory: s.inventory, factories: s.factories,
        marketTrends: s.marketTrends, activeCampaignIds: s.activeCampaignIds,
        totalUnitsSold: s.totalUnitsSold, lastDayFinance: s.lastDayFinance,
        profitHistory: s.profitHistory, draft: s.draft,
        releasedDevices: s.releasedDevices, salesHistory: s.salesHistory,
        marketEvents: s.marketEvents, competitors: s.competitors,
        craftedParts: s.craftedParts, botCompanies: s.botCompanies,
        employees: s.employees, departments: s.departments,
        companyValuation: s.companyValuation, quarterlyReports: s.quarterlyReports,
        marketShare: s.marketShare, devicePricing: s.devicePricing,
        totalRepairCosts: s.totalRepairCosts, totalMaintenanceSpent: s.totalMaintenanceSpent,
        friends: s.friends, retailStores: s.retailStores,
        achievements: s.achievements, loans: s.loans, newsHistory: s.newsHistory,
        stockPrices: s.stockPrices, playerPortfolio: s.playerPortfolio,
        monthAccumulator: s.monthAccumulator,
        playerUuid: s.playerUuid,
        lastSyncedAt: s.lastSyncedAt,
      }),
    },
  ),
);
