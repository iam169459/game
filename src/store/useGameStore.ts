import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CAMPAIGNS } from '../data/marketing';
import { COMPONENTS, SLOTS_BY_CATEGORY } from '../data/components';
import {
  calcDesignStats,
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
  MarketEvent,
  MarketTrend,
  MonthlySales,
  ProductDesign,
  ProductionLine,
  QuarterlyReport,
  ReleasedDevice,
  ScreenId,
} from '../types';

const SAVE_VERSION = 1;
const STARTING_CASH = 50_000;

const emptyFinance = (): DayFinance => ({
  revenue: 0,
  productionCost: 0,
  marketingCost: 0,
  upkeep: 0,
  researchCost: 0,
  profit: 0,
});

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

  // New: Bot companies
  botCompanies: BotCompany[];

  // New: Employee management
  employees: Employee[];
  departments: Department[];

  // New: Market & Finance
  companyValuation: number;
  quarterlyReports: QuarterlyReport[];
  marketShare: number;
  devicePricing: Record<string, { basePriceMultiplier: number; supplyLevel: number; demandLevel: number; lastPurchaseDay: number; priceHistory: number[] }>;
  totalRepairCosts: number;
  totalMaintenanceSpent: number;

  // Social
  friends: Friend[];

  // Auto-advance timeline
  autoAdvance: boolean;
  autoAdvanceSpeed: number;

  setScreen: (s: ScreenId) => void;
  clearNotification: () => void;
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
  advanceMonth: () => void;

  combineParts: (slot: ComponentSlot, part1Id: string, part2Id: string) => boolean;
  deleteCraftedPart: (id: string) => void;

  startResearch: (techId: string) => boolean;
  toggleCampaign: (id: string) => void;
  assignProduct: (factoryId: string, productId: string | null) => void;
  upgradeFactory: (factoryId: string) => boolean;
  buyFactory: () => boolean;
  advanceDay: () => void;

  // New: Employee actions
  hireEmployee: (department: Employee['department']) => boolean;
  fireEmployee: (id: string) => void;
  setDepartmentBudget: (deptId: Department['id'], budget: number) => void;
  assignEmployeeToLine: (employeeId: string, lineId: string | null) => void;

  // New: Device maintenance actions
  repairDevice: (deviceId: string) => boolean;
  getDeviceDurability: (deviceId: string) => number;

  // Auto-advance timeline
  toggleAutoAdvance: () => void;
  setAutoAdvanceSpeed: (speed: number) => void;
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
    { id: 'c1', name: 'TechNova Inc', color: '#3b82f6', monthlySales: 45, reputation: 65, trend: 'up' },
    { id: 'c2', name: 'PixelCraft', color: '#8b5cf6', monthlySales: 32, reputation: 58, trend: 'stable' },
    { id: 'c3', name: 'Zenith Labs', color: '#10b981', monthlySales: 28, reputation: 52, trend: 'down' },
  ];
}

function initialDepartments(): Department[] {
  return [
    { id: 'rd', name: 'R&D', headcount: 1, bonus: 0, budget: 500 },
    { id: 'marketing', name: 'Marketing', headcount: 1, bonus: 0, budget: 300 },
    { id: 'manufacturing', name: 'Manufacturing', headcount: 1, bonus: 0, budget: 400 },
    { id: 'executive', name: 'Executive', headcount: 1, bonus: 0, budget: 200 },
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
    salary: 800 + Math.floor(Math.random() * 400),
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
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      screen: 'menu',
      notification: null,
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
      factories: initialFactories(),
      marketTrends: initialTrends(),
      activeCampaignIds: [],
      totalUnitsSold: 0,
      lastDayFinance: emptyFinance(),
      profitHistory: [],
      draft: createDraft('smartphone', []),
      releasedDevices: [],
      salesHistory: [],
      marketEvents: [],
      competitors: initialCompetitors(),
      craftedParts: [],
      botCompanies: createBotCompanies(),
      employees: initialEmployees(),
      departments: initialDepartments(),
      companyValuation: STARTING_CASH,
      quarterlyReports: [],
      marketShare: 0,
      devicePricing: {},
      totalRepairCosts: 0,
      totalMaintenanceSpent: 0,
      friends: [],
      autoAdvance: false,
      autoAdvanceSpeed: 1,

      setScreen: (screen) => set({ screen }),
      clearNotification: () => set({ notification: null }),

      continueGame: () =>
        set({
          gameStarted: true,
          screen: 'devices',
        }),

      resetGame: () => {
        useGameStore.persist.clearStorage();
        set({
          screen: 'menu',
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
          factories: initialFactories(),
          marketTrends: initialTrends(),
          activeCampaignIds: [],
          totalUnitsSold: 0,
          lastDayFinance: emptyFinance(),
          profitHistory: [],
          draft: createDraft('smartphone', []),
          releasedDevices: [],
          salesHistory: [],
          marketEvents: [],
          competitors: initialCompetitors(),
          craftedParts: [],
          botCompanies: createBotCompanies(),
          employees: initialEmployees(),
          departments: initialDepartments(),
          companyValuation: STARTING_CASH,
          quarterlyReports: [],
          marketShare: 0,
          devicePricing: {},
          totalRepairCosts: 0,
          totalMaintenanceSpent: 0,
          friends: [],
          autoAdvance: false,
          autoAdvanceSpeed: 1,
          notification: null,
        });
      },

      startGame: (name) => {
        const companyName = name.trim() || 'Garage Labs';
        set({
          gameStarted: true,
          companyName,
          screen: 'devices',
          cash: STARTING_CASH,
          fans: 12,
          reputation: 10,
          day: 1,
          month: 1,
          designs: [],
          inventory: {},
          factories: initialFactories(),
          marketTrends: initialTrends(),
          profitHistory: [],
          draft: createDraft('smartphone', []),
          releasedDevices: [],
          salesHistory: [],
          marketEvents: [],
          competitors: initialCompetitors(),
          craftedParts: [],
          botCompanies: createBotCompanies(),
          employees: initialEmployees(),
          departments: initialDepartments(),
          companyValuation: STARTING_CASH,
          quarterlyReports: [],
          marketShare: 0,
          notification: 'Welcome to your garage! Design a device, then release it to market.',
        });
      },

      setDraftCategory: (category) => {
        const { unlockedTech } = get();
        const components = getDefaultComponents(category, unlockedTech);
        const { stats, unitCost } = calcDesignStats(category, components);
        set({
          draft: {
            name: get().draft.name,
            category,
            components,
            sellPrice: suggestPrice(stats, unitCost, category),
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
        const { draft, day, designs, releasedDevices, unlockedTech } = get();
        for (const slot of SLOTS_BY_CATEGORY[draft.category]) {
          if (!draft.components[slot]) {
            set({ notification: 'Select all components before releasing.' });
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
        };
        const avgStats = Object.values(stats).reduce((a, b) => a + b, 0) / 6;
        const durability = 80 + Math.floor(avgStats / 10);
        const maintenanceCost = Math.round(unitCost * 0.1);
        const released: ReleasedDevice = {
          ...design,
          releasedMonth: get().month,
          totalSold: 0,
          totalRevenue: 0,
          totalProfit: 0,
          monthlySales: [],
          durability,
          maxDurability: durability,
          maintenanceCost,
        };
        const newDraft = createDraft(draft.category, unlockedTech);
        set({
          designs: [...designs, design],
          releasedDevices: [...releasedDevices, released],
          draft: newDraft,
          notification: `"${design.name}" released! Durability: ${durability}. Design a new device.`,
        });
        return true;
      },

      advanceMonth: () => {
        const s = get();
        const monthRevenue: Record<string, number> = {};
        let totalRevenue = 0;
        let totalUnits = 0;

        const updatedDevices = s.releasedDevices.map((device) => {
          const design = s.designs.find((d) => d.id === device.id);
          if (!design) return device;

          const overallScore = Object.values(device.stats).reduce((a, b) => a + b, 0) / 6;
          const durabilityModifier = device.durability / device.maxDurability;
          const trendMultiplier = s.marketTrends.reduce((m, t) => {
            if (t.category === 'all' || t.category === device.category) {
              return m * t.demandMultiplier;
            }
            return m;
          }, 1);

          const appealBonus = s.activeCampaignIds.reduce((sum, id) => {
            const campaign = CAMPAIGNS.find((c) => c.id === id);
            return sum + (campaign?.appealBoost ?? 0);
          }, 0);

          // Employee bonuses
          const empMktBonus = s.departments.find((d) => d.id === 'marketing')?.bonus ?? 0;

          const priceModifier = device.sellPrice > overallScore * 15
            ? 0.7
            : device.sellPrice > overallScore * 10
              ? 0.9
              : 1.1;

          const baseSales = Math.floor(
            (overallScore * 0.8 + appealBonus * 0.3 + empMktBonus * 0.2) * trendMultiplier * priceModifier * durabilityModifier
          );
          const monthlyUnits = Math.max(0, baseSales + Math.floor(Math.random() * 10 - 5));
          const revenue = monthlyUnits * device.sellPrice;
          const profit = revenue - monthlyUnits * device.unitCost;

          monthRevenue[device.id] = revenue;
          totalRevenue += revenue;
          totalUnits += monthlyUnits;

          // Durability degradation (1-3% per month)
          const durabilityLoss = Math.max(1, Math.floor(device.maxDurability * (0.01 + Math.random() * 0.02)));
          const newDurability = Math.max(0, device.durability - durabilityLoss);

          return {
            ...device,
            totalSold: device.totalSold + monthlyUnits,
            totalRevenue: device.totalRevenue + revenue,
            totalProfit: device.totalProfit + profit,
            monthlySales: [...device.monthlySales, monthlyUnits].slice(-12),
            durability: newDurability,
          };
        });

        const monthProfit = totalRevenue - updatedDevices.reduce((sum, d) => {
          const monthlySalesCount = d.monthlySales[d.monthlySales.length - 1] ?? 0;
          const design = s.designs.find((dsg) => dsg.id === d.id);
          return sum + monthlySalesCount * (design?.unitCost ?? 0);
        }, 0);

        // Employee salaries
        const employeeCost = s.employees.reduce((sum, emp) => sum + emp.salary, 0);

        // Bot AI: advance all bot companies
        const trendData = s.marketTrends.map((t) => ({ category: t.category, demandMultiplier: t.demandMultiplier }));
        const updatedBots = botAdvanceMonth(s.botCompanies, s.reputation, s.fans, s.month, trendData);

        // Calculate market share
        const lastMonthRevenue = s.salesHistory.length > 0 ? s.salesHistory[s.salesHistory.length - 1].revenue : 0;
        const shares = calcMarketShares(updatedBots, lastMonthRevenue, s.reputation, s.fans);
        const playerShare = shares.find((sh) => sh.id === 'player')?.share ?? 0;

        // Generate quarterly report
        let quarterlyReports = [...s.quarterlyReports];
        if (s.month % 3 === 0) {
          const quarterReport: QuarterlyReport = {
            quarter: Math.ceil(s.month / 3),
            year: Math.floor((s.month - 1) / 12) + 1,
            month: s.month,
            playerRevenue: totalRevenue,
            playerProfit: monthProfit - employeeCost,
            playerCash: s.cash + monthProfit - employeeCost,
            totalMarketRevenue: shares.reduce((sum, sh) => sum + (sh.id === 'player' ? totalRevenue : updatedBots.find((b) => b.id === sh.id)?.monthlyRevenue ?? 0), 0),
            marketShare: playerShare,
            competitorSummaries: updatedBots.map((b) => ({
              name: b.name,
              revenue: b.monthlyRevenue,
              profit: b.monthlyProfit,
              reputation: b.reputation,
              trend: b.trend,
            })),
            highlights: [],
          };
          // Add highlights
          if (playerShare > 25) quarterReport.highlights.push('Market Leader!');
          if (monthProfit - employeeCost > 10000) quarterReport.highlights.push('Strong profitability');
          if (updatedBots.some((b) => b.reputation > s.reputation)) quarterReport.highlights.push('Competitors surpassing you');
          quarterlyReports = [...quarterlyReports, quarterReport].slice(-4);
        }

        // Company valuation
        const valuation = s.cash + monthProfit - employeeCost +
          s.releasedDevices.reduce((sum, d) => sum + d.totalProfit, 0) * 2 +
          s.factories.reduce((sum, f) => sum + f.level * 5000, 0) +
          s.unlockedTech.length * 3000;

        // Random events (enhanced)
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
            { label: 'Product Recall', description: 'A competitor recall shakes consumer trust', icon: '⚠️', effect: { category: 'all', demandMultiplier: 1.15 }, duration: 2 },
            { label: 'Chip Shortage', description: 'Processor costs increase temporarily', icon: '🔧', effect: { costReduction: -0.15 }, duration: 1 },
            { label: 'New Market', description: 'Emerging market opens for wearables', icon: '🌍', effect: { category: 'smartwatch', demandMultiplier: 1.5 }, duration: 3 },
            { label: 'Price War', description: 'Competitors slash prices, market pressure increases', icon: '💸', effect: { category: 'all', demandMultiplier: 0.85 }, duration: 2 },
          ];
          const event = events[Math.floor(Math.random() * events.length)];
          newEvent = { ...event, id: `evt-${Date.now()}`, daysLeft: event.duration };
        }

        const updatedEvents = s.marketEvents
          .map((e) => ({ ...e, daysLeft: e.daysLeft - 1 }))
          .filter((e) => e.daysLeft > 0);

        // Update old competitors based on bots
        const updatedCompetitors = updatedBots.map((b) => ({
          id: b.id,
          name: b.name,
          color: b.color,
          monthlySales: Math.floor(b.monthlyRevenue / 100),
          reputation: b.reputation,
          trend: b.trend,
        }));

        const salesRecord: MonthlySales = {
          month: s.month,
          revenue: totalRevenue,
          unitsSold: totalUnits,
          profit: monthProfit - employeeCost,
          deviceSales: monthRevenue,
        };

        // Employee morale update & XP/leveling
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
            morale: Math.min(100, Math.max(20, emp.morale + (monthProfit > 0 ? 2 : -3) + Math.floor(Math.random() * 4 - 2))),
            xp: newXp,
            level: newLevel,
            xpToNextLevel: newXpToNext,
            skill: Math.min(100, emp.skill + skillGain),
            salary: emp.salary + salaryIncrease,
          };
        });

        set({
          releasedDevices: updatedDevices,
          salesHistory: [...s.salesHistory, salesRecord].slice(-12),
          cash: s.cash + monthProfit - employeeCost,
          fans: s.fans + Math.floor(totalUnits * 0.3),
          reputation: Math.min(100, s.reputation + totalUnits * 0.05),
          totalUnitsSold: s.totalUnitsSold + totalUnits,
          marketEvents: newEvent ? [...updatedEvents, newEvent] : updatedEvents,
          competitors: updatedCompetitors,
          botCompanies: updatedBots,
          marketShare: playerShare,
          companyValuation: valuation,
          quarterlyReports,
          employees: updatedEmployees,
          notification: `Month ${s.month} complete! Revenue: $${totalRevenue.toLocaleString()} | Employees: $${employeeCost.toLocaleString()}`,
        });
      },

      combineParts: (slot, part1Id, part2Id) => {
        const s = get();
        
        const part1 = COMPONENTS.find((c) => c.id === part1Id) || s.craftedParts.find((c) => c.id === part1Id);
        const part2 = COMPONENTS.find((c) => c.id === part2Id) || s.craftedParts.find((c) => c.id === part2Id);
        
        if (!part1 || !part2) {
          set({ notification: 'Invalid parts selected.' });
          return false;
        }
        if (part1.slot !== slot || part2.slot !== slot) {
          set({ notification: 'Parts must be the same type.' });
          return false;
        }
        if (part1Id === part2Id) {
          set({ notification: 'Select two different parts.' });
          return false;
        }

        const combineCost = Math.floor((part1.cost + part2.cost) * 0.5);
        if (s.cash < combineCost) {
          set({ notification: `Not enough cash. Need $${combineCost}.` });
          return false;
        }

        const maxTier = Math.max(part1.tier, part2.tier);
        const bonusMultiplier = 1.2 + (maxTier * 0.1);
        
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

        set({
          cash: s.cash - combineCost,
          craftedParts: [...s.craftedParts, newPart],
          notification: `Crafted "${newPart.name}" (Tier ${craftedTier})!`,
        });
        return true;
      },

      deleteCraftedPart: (id) =>
        set({
          craftedParts: get().craftedParts.filter((p) => p.id !== id),
        }),

      startResearch: (techId) => {
        const s = get();
        if (s.researching) {
          set({ notification: 'Already researching.' });
          return false;
        }
        const tech = getTech(techId);
        if (!tech || s.unlockedTech.includes(techId)) return false;
        if (tech.prerequisites.some((p) => !s.unlockedTech.includes(p))) {
          set({ notification: 'Prerequisites not met.' });
          return false;
        }
        if (s.cash < tech.cost) {
          set({ notification: 'Not enough cash.' });
          return false;
        }
        set({
          cash: s.cash - tech.cost,
          researching: { techId, daysLeft: tech.researchDays },
          notification: `Researching ${tech.name}…`,
        });
        return true;
      },

      toggleCampaign: (id) => {
        const active = get().activeCampaignIds;
        set({
          activeCampaignIds: active.includes(id) ? active.filter((x) => x !== id) : [...active, id],
        });
      },

      assignProduct: (factoryId, productId) =>
        set({
          factories: get().factories.map((f) =>
            f.id === factoryId ? { ...f, assignedProductId: productId, progress: 0 } : f,
          ),
        }),

      upgradeFactory: (factoryId) => {
        const s = get();
        const f = s.factories.find((x) => x.id === factoryId);
        if (!f) return false;
        const cost = 18000 * f.level;
        if (s.cash < cost) {
          set({ notification: 'Not enough cash.' });
          return false;
        }
        set({
          cash: s.cash - cost,
          factories: s.factories.map((x) =>
            x.id === factoryId ? { ...x, level: x.level + 1, capacity: x.capacity + 5 } : x,
          ),
        });
        return true;
      },

      buyFactory: () => {
        const s = get();
        const cost = 32000 + s.factories.length * 15000;
        if (s.cash < cost) {
          set({ notification: 'Not enough cash.' });
          return false;
        }
        const n = s.factories.length + 1;
        set({
          cash: s.cash - cost,
          factories: [
            ...s.factories,
            {
              id: `f-${Date.now()}`,
              name: `Line ${n}`,
              level: 1,
              capacity: 8,
              assignedProductId: null,
              assignedEmployeeId: null,
              progress: 0,
            },
          ],
        });
        return true;
      },

      hireEmployee: (department) => {
        const s = get();
        const hireCost = 2000 + s.employees.length * 200;
        if (s.cash < hireCost) {
          set({ notification: `Not enough cash. Need $${hireCost}.` });
          return false;
        }
        if (s.employees.length >= 50) {
          set({ notification: 'Maximum employees reached (50).' });
          return false;
        }

        const firstNames = ['Maya', 'Liam', 'Zara', 'Kai', 'Nova', 'Ethan', 'Aria', 'Finn', 'Luna', 'Owen', 'Ivy', 'Jude', 'Riley', 'Quinn', 'Ava', 'Max', 'Iris', 'Leo', 'Sage', 'Dante'];
        const lastNames = ['Park', 'Singh', 'Costa', 'Nakamura', 'Okafor', 'Berg', 'Reyes', 'Chang', 'Mueller', 'Tanaka', 'Ali', 'Sato', 'Kim', 'Li', 'Wang', 'Patel', 'Joshi', 'Lee', 'Chen', 'Wu'];
        const traits: Employee['trait'][] = ['efficient', 'expensive', 'unstable', 'diligent', 'resilient', 'lazy', 'veteran', 'trainee'];

        const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        const skill = 30 + Math.floor(Math.random() * 40);
        const trait = traits[Math.floor(Math.random() * traits.length)];
        const baseSalary = 600 + skill * 8 + Math.floor(Math.random() * 200);
        const salaryModifier = trait === 'expensive' ? 1.2 : trait === 'trainee' ? 0.85 : 1;
        const salary = Math.round(baseSalary * salaryModifier);

        const emp: Employee = {
          id: `emp-${Date.now()}`,
          name,
          department,
          skill,
          salary,
          morale: 60 + Math.floor(Math.random() * 30),
          hiredMonth: s.month,
          trait,
          level: 1,
          xp: 0,
          xpToNextLevel: 100,
          assignedLineId: null,
        };

        const updatedDepartments = s.departments.map((d) =>
          d.id === department ? { ...d, headcount: d.headcount + 1, bonus: d.bonus + Math.floor(skill / 20) } : d
        );

        set({
          cash: s.cash - hireCost,
          employees: [...s.employees, emp],
          departments: updatedDepartments,
          notification: `Hired ${name} (${trait}) in ${department.toUpperCase()}!`,
        });
        return true;
      },

      fireEmployee: (id) => {
        const s = get();
        const emp = s.employees.find((e) => e.id === id);
        if (!emp) return;

        const updatedDepartments = s.departments.map((d) =>
          d.id === emp.department ? { ...d, headcount: Math.max(0, d.headcount - 1), bonus: Math.max(0, d.bonus - Math.floor(emp.skill / 20)) } : d
        );

        set({
          employees: s.employees.filter((e) => e.id !== id),
          departments: updatedDepartments,
          notification: `${emp.name} has been let go.`,
        });
      },

      setDepartmentBudget: (deptId, budget) => {
        set({
          departments: get().departments.map((d) =>
            d.id === deptId ? { ...d, budget: Math.max(0, budget) } : d
          ),
        });
      },

      assignEmployeeToLine: (employeeId, lineId) => {
        const s = get();
        const emp = s.employees.find((e) => e.id === employeeId);
        if (!emp) return;

        // Unassign from current line if any
        let factories = s.factories.map((f) =>
          f.assignedEmployeeId === employeeId ? { ...f, assignedEmployeeId: null } : f
        );

        // Assign to new line if provided
        if (lineId) {
          factories = factories.map((f) =>
            f.id === lineId ? { ...f, assignedEmployeeId: employeeId } : f
          );
          set({
            factories,
            notification: `${emp.name} assigned to production line.`,
          });
        } else {
          set({
            factories,
            notification: `${emp.name} unassigned from production line.`,
          });
        }
      },

      repairDevice: (deviceId) => {
        const s = get();
        const device = s.releasedDevices.find((d) => d.id === deviceId);
        if (!device) {
          set({ notification: 'Device not found.' });
          return false;
        }
        if (device.durability >= device.maxDurability) {
          set({ notification: 'Device already at full durability.' });
          return false;
        }
        const missingDurability = device.maxDurability - device.durability;
        const repairCost = Math.round(missingDurability * device.maintenanceCost * 0.5);
        if (s.cash < repairCost) {
          set({ notification: `Not enough cash. Repair costs $${repairCost}.` });
          return false;
        }
        set({
          cash: s.cash - repairCost,
          releasedDevices: s.releasedDevices.map((d) =>
            d.id === deviceId ? { ...d, durability: d.maxDurability } : d
          ),
          totalRepairCosts: s.totalRepairCosts + repairCost,
          notification: `"${device.name}" repaired for $${repairCost}. Durability restored to ${device.maxDurability}.`,
        });
        return true;
      },

      getDeviceDurability: (deviceId) => {
        const device = get().releasedDevices.find((d) => d.id === deviceId);
        return device?.durability ?? 0;
      },

      toggleAutoAdvance: () => {
        set((s) => ({ autoAdvance: !s.autoAdvance }));
      },

      setAutoAdvanceSpeed: (speed) => {
        set({ autoAdvanceSpeed: Math.max(1, Math.min(5, speed)) });
      },

      advanceDay: () => {
        const s = get();
        const finance = emptyFinance();
        const { factorySpeed, marketingBonus } = getTechEffects(s.unlockedTech);
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
            inventory[line.assignedProductId] = (inventory[line.assignedProductId] ?? 0) + 1;
            finance.productionCost += design.unitCost;
          }
          return line;
        });

        const { unitsSold, revenue } = simulateSales(
          s.designs,
          inventory,
          s.marketTrends,
          s.fans,
          s.reputation,
          campaignBoost,
        );
        finance.revenue = revenue;

        let units = 0;
        for (const [pid, qty] of Object.entries(unitsSold)) {
          inventory[pid] = Math.max(0, (inventory[pid] ?? 0) - qty);
          units += qty;
        }

        finance.marketingCost = s.activeCampaignIds.reduce(
          (sum, id) => sum + (CAMPAIGNS.find((c) => c.id === id)?.dailyCost ?? 0),
          0,
        );
        finance.upkeep = s.factories.reduce((sum, f) => sum + 120 + f.level * 60, 0);
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
              set({ notification: `Unlocked: ${tech.name}!` });
            }
            researching = null;
          }
        }

        const day = s.day + 1;
        const isNewMonth = day > 30;
        const newDay = isNewMonth ? 1 : day;
        const newMonth = isNewMonth ? (s.month >= 12 ? 1 : s.month + 1) : s.month;

        set({
          day: newDay,
          month: newMonth,
          cash,
          fans,
          reputation,
          inventory,
          factories,
          marketTrends: trends,
          unlockedTech,
          researching,
          lastDayFinance: finance,
          profitHistory: [...s.profitHistory.slice(-29), finance.profit],
          totalUnitsSold: s.totalUnitsSold + units,
        });
        if (isNewMonth) get().advanceMonth();
      },
    }),
    {
      name: 'devices-tycoon-v2',
      version: SAVE_VERSION,
      merge: (persisted, current) => {
        if (!persisted) return current;
        const clean = sanitizePersistedState(persisted);
        let draft = { ...current.draft, ...clean.draft };
        if (!draft.components || Object.keys(draft.components).length === 0) {
          draft = createDraft(draft.category ?? 'smartphone', clean.unlockedTech ?? []);
        }
        const screen: ScreenId = clean.gameStarted
          ? clean.screen && clean.screen !== 'menu'
            ? clean.screen
            : 'devices'
          : 'menu';
        return {
          ...current,
          ...clean,
          draft,
          screen,
          profitHistory: clean.profitHistory ?? current.profitHistory ?? [],
          releasedDevices: clean.releasedDevices ?? current.releasedDevices ?? [],
          salesHistory: clean.salesHistory ?? current.salesHistory ?? [],
          marketEvents: clean.marketEvents ?? current.marketEvents ?? [],
          competitors: clean.competitors ?? current.competitors ?? initialCompetitors(),
          craftedParts: clean.craftedParts ?? current.craftedParts ?? [],
          botCompanies: clean.botCompanies ?? current.botCompanies ?? createBotCompanies(),
          employees: clean.employees ?? current.employees ?? initialEmployees(),
          departments: clean.departments ?? current.departments ?? initialDepartments(),
          companyValuation: clean.companyValuation ?? current.companyValuation ?? STARTING_CASH,
          quarterlyReports: clean.quarterlyReports ?? current.quarterlyReports ?? [],
          marketShare: clean.marketShare ?? current.marketShare ?? 0,
          devicePricing: clean.devicePricing ?? current.devicePricing ?? {},
          totalRepairCosts: clean.totalRepairCosts ?? current.totalRepairCosts ?? 0,
          totalMaintenanceSpent: clean.totalMaintenanceSpent ?? current.totalMaintenanceSpent ?? 0,
        };
      },
      partialize: (s) => ({
        version: SAVE_VERSION,
        companyName: s.companyName,
        cash: s.cash,
        fans: s.fans,
        reputation: s.reputation,
        day: s.day,
        month: s.month,
        screen: s.screen,
        gameStarted: s.gameStarted,
        unlockedTech: s.unlockedTech,
        researching: s.researching,
        designs: s.designs,
        inventory: s.inventory,
        factories: s.factories,
        marketTrends: s.marketTrends,
        activeCampaignIds: s.activeCampaignIds,
        totalUnitsSold: s.totalUnitsSold,
        lastDayFinance: s.lastDayFinance,
        profitHistory: s.profitHistory,
        draft: s.draft,
        releasedDevices: s.releasedDevices,
        salesHistory: s.salesHistory,
        marketEvents: s.marketEvents,
        competitors: s.competitors,
        craftedParts: s.craftedParts,
        botCompanies: s.botCompanies,
        employees: s.employees,
        departments: s.departments,
        companyValuation: s.companyValuation,
        quarterlyReports: s.quarterlyReports,
        marketShare: s.marketShare,
        devicePricing: s.devicePricing,
        totalRepairCosts: s.totalRepairCosts,
        totalMaintenanceSpent: s.totalMaintenanceSpent,
        friends: s.friends,
      }),
    },
  ),
);
