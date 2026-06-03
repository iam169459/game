import type { BotCompany, ComponentSlot, DeviceCategory, DeviceStats, ReleasedDevice } from '../types';
import { COMPONENTS, SLOTS_BY_CATEGORY } from '../data/components';

export type BotStrategy = BotCompany['strategy'];

const BOT_STRATEGIES: Record<BotStrategy, BotCompany['personality']> = {
  budget: { aggression: 0.6, pricing: 0.2, innovation: 0.3, marketing: 0.4 },
  midrange: { aggression: 0.5, pricing: 0.5, innovation: 0.5, marketing: 0.5 },
  flagship: { aggression: 0.3, pricing: 0.8, innovation: 0.7, marketing: 0.6 },
  innovator: { aggression: 0.4, pricing: 0.6, innovation: 0.9, marketing: 0.5 },
  underdog: { aggression: 0.7, pricing: 0.3, innovation: 0.4, marketing: 0.3 },
};

export function createBotCompanies(): BotCompany[] {
  const bots: Omit<BotCompany, 'personality'>[] = [
    {
      id: 'bot-1', name: 'TechNova Inc', color: '#3b82f6', logo: '⚡',
      strategy: 'flagship', cash: 120000, reputation: 68, fans: 150,
      unlockedTech: ['chip-5nm', 'display-oled'], releasedDevices: [],
      monthlyRevenue: 0, monthlyProfit: 0, marketShare: 25,
      trend: 'up', lastReleaseMonth: 0, employees: 45,
      departmentBonus: { rd: 5, marketing: 3, manufacturing: 2 },
    },
    {
      id: 'bot-2', name: 'PixelCraft', color: '#8b5cf6', logo: '🎮',
      strategy: 'innovator', cash: 95000, reputation: 62, fans: 120,
      unlockedTech: ['chip-5nm', 'camera-48mp'], releasedDevices: [],
      monthlyRevenue: 0, monthlyProfit: 0, marketShare: 20,
      trend: 'stable', lastReleaseMonth: 0, employees: 32,
      departmentBonus: { rd: 8, marketing: 2, manufacturing: 1 },
    },
    {
      id: 'bot-3', name: 'Zenith Labs', color: '#10b981', logo: '🔬',
      strategy: 'midrange', cash: 80000, reputation: 55, fans: 90,
      unlockedTech: ['chip-7nm'], releasedDevices: [],
      monthlyRevenue: 0, monthlyProfit: 0, marketShare: 18,
      trend: 'down', lastReleaseMonth: 0, employees: 28,
      departmentBonus: { rd: 3, marketing: 4, manufacturing: 3 },
    },
    {
      id: 'bot-4', name: 'BudgetBox', color: '#f59e0b', logo: '💰',
      strategy: 'budget', cash: 60000, reputation: 45, fans: 200,
      unlockedTech: [], releasedDevices: [],
      monthlyRevenue: 0, monthlyProfit: 0, marketShare: 22,
      trend: 'up', lastReleaseMonth: 0, employees: 55,
      departmentBonus: { rd: 1, marketing: 5, manufacturing: 6 },
    },
    {
      id: 'bot-5', name: 'NexGen', color: '#ef4444', logo: '🚀',
      strategy: 'underdog', cash: 45000, reputation: 38, fans: 60,
      unlockedTech: [], releasedDevices: [],
      monthlyRevenue: 0, monthlyProfit: 0, marketShare: 15,
      trend: 'stable', lastReleaseMonth: 0, employees: 18,
      departmentBonus: { rd: 2, marketing: 2, manufacturing: 2 },
    },
  ];

  return bots.map((b) => ({
    ...b,
    personality: BOT_STRATEGIES[b.strategy],
  }));
}

function pickComponents(category: DeviceCategory, strategy: BotStrategy, unlockedTech: string[]): Partial<Record<ComponentSlot, string>> {
  const slots = SLOTS_BY_CATEGORY[category];
  const components: Partial<Record<ComponentSlot, string>> = {};

  for (const slot of slots) {
    const available = COMPONENTS.filter(
      (c) => c.slot === slot && c.categories.includes(category) && (!c.unlockTech || unlockedTech.includes(c.unlockTech))
    );
    if (available.length === 0) continue;

    // Sort by cost based on strategy
    const sorted = [...available].sort((a, b) => {
      if (strategy === 'budget') return a.cost - b.cost;
      if (strategy === 'flagship') return b.cost - a.cost;
      if (strategy === 'innovator') return b.tier - a.tier;
      // midrange: pick middle
      const mid = available.length / 2;
      return Math.abs(available.indexOf(a) - mid) - Math.abs(available.indexOf(b) - mid);
    });

    // Pick from top 2-3 options with some randomness
    const pick = sorted[Math.floor(Math.random() * Math.min(2, sorted.length))];
    components[slot] = pick.id;
  }

  return components;
}

function calcDeviceStats(_category: DeviceCategory, components: Partial<Record<ComponentSlot, string>>): DeviceStats {
  const stats: DeviceStats = { performance: 0, display: 0, camera: 0, battery: 0, build: 0, appeal: 0 };
  let count = 0;

  for (const [_slot, compId] of Object.entries(components)) {
    const comp = COMPONENTS.find((c) => c.id === compId);
    if (!comp) continue;
    for (const [key, val] of Object.entries(comp.stats)) {
      if (key in stats) {
        stats[key as keyof DeviceStats] += val;
        count++;
      }
    }
  }

  if (count > 0) {
    for (const key of Object.keys(stats) as (keyof DeviceStats)[]) {
      stats[key] = Math.min(100, Math.round(stats[key]));
    }
  }

  return stats;
}

function calcUnitCost(components: Partial<Record<ComponentSlot, string>>): number {
  let total = 0;
  for (const compId of Object.values(components)) {
    const comp = COMPONENTS.find((c) => c.id === compId);
    if (comp) total += comp.cost;
  }
  return total;
}

function calcSellingPrice(stats: DeviceStats, unitCost: number, _strategy: BotStrategy, pricing: number): number {
  const overallScore = Object.values(stats).reduce((a, b) => a + b, 0) / 6;
  const basePrice = unitCost * (1.5 + pricing * 1.5); // 1.5x to 3x markup
  const scoreBonus = overallScore * 5;
  return Math.round((basePrice + scoreBonus) / 5) * 5; // Round to nearest 5
}

export function botAdvanceMonth(
  bots: BotCompany[],
  _playerReputation: number,
  _playerFans: number,
  month: number,
  marketTrends: { category: string; demandMultiplier: number }[],
): BotCompany[] {
  return bots.map((bot) => {
    const updated = { ...bot };

    // 1. Bot AI: Should we release a new device?
    const monthsSinceRelease = month - bot.lastReleaseMonth;
    const shouldRelease =
      monthsSinceRelease >= (bot.personality.aggression >= 0.6 ? 2 : 3) &&
      bot.cash > 20000 &&
      Math.random() < bot.personality.aggression;

    if (shouldRelease) {
      const categories: DeviceCategory[] = ['smartphone', 'laptop', 'smartwatch'];
      const category = categories[Math.floor(Math.random() * categories.length)];

      const components = pickComponents(category, bot.strategy, bot.unlockedTech);
      const stats = calcDeviceStats(category, components);
      const unitCost = calcUnitCost(components);
      const sellPrice = calcSellingPrice(stats, unitCost, bot.strategy, bot.personality.pricing);

      const deviceNames: Record<BotStrategy, Record<DeviceCategory, string[]>> = {
        budget: {
          smartphone: ['EcoPhone', 'ValueOne', 'LiteMax', 'Pocket Pro'],
          laptop: ['BookLite', 'StudyPro', 'EconoBook', 'CloudBook'],
          smartwatch: ['FitBand', 'HealthPulse', 'StepPro', 'ActiveWatch'],
        },
        midrange: {
          smartphone: ['均衡Pro', 'CoreX', 'Balance One', 'MidTier'],
          laptop: ['FlexBook', 'EveryDay Pro', 'CoreBook', 'SwiftPro'],
          smartwatch: ['PulseWave', 'ActiveTrack', 'HealthSync', 'VitalWatch'],
        },
        flagship: {
          smartphone: ['UltraPhone', 'PrimeMax', 'Elite Pro', 'Titan X'],
          laptop: ['TitanBook', 'UltraPro', 'ApexBook', 'MaxStudio'],
          smartwatch: ['LuxeWatch', 'ApexBand', 'RoyalPulse', 'PrimeTime'],
        },
        innovator: {
          smartphone: ['NeuraPhone', 'QuantumX', 'HoloTouch', 'FutureOne'],
          laptop: ['QuantumBook', 'HoloDesk', 'NeuralPad', 'FuturBook'],
          smartwatch: ['NeuralBand', 'HoloWatch', 'QuantumPulse', 'MindTrack'],
        },
        underdog: {
          smartphone: ['RisePhone', 'UnderPro', 'Challenger', 'WildCard'],
          laptop: ['RiseBook', 'FightPro', 'WildBook', 'StormBook'],
          smartwatch: ['RiseBand', 'WildPulse', 'StormWatch', 'FightTrack'],
        },
      };

      const names = deviceNames[bot.strategy][category];
      const name = names[Math.floor(Math.random() * names.length)];

      const overallScore = Object.values(stats).reduce((a, b) => a + b, 0) / 6;
      const trendMult = marketTrends.reduce((m, t) => {
        if (t.category === 'all' || t.category === category) return m * t.demandMultiplier;
        return m;
      }, 1);

      // Simulate bot device sales (rough approximation)
      const botSales = Math.floor(
        (overallScore * 0.6 + bot.fans * 0.02 + bot.reputation * 0.1) * trendMult *
        (1 + bot.personality.marketing * 0.3) * (0.8 + Math.random() * 0.4)
      );

      const revenue = botSales * sellPrice;
      const cost = botSales * unitCost;
      const marketingCost = revenue * bot.personality.marketing * 0.1;

      updated.cash += revenue - cost - marketingCost;
      updated.monthlyRevenue = revenue;
      updated.monthlyProfit = revenue - cost - marketingCost;
      updated.fans += Math.floor(botSales * 0.2);
      updated.lastReleaseMonth = month;

      // Create released device
      const avgStats = Object.values(stats).reduce((a, b) => a + b, 0) / 6;
      const durability = 80 + Math.floor(avgStats / 10);
      const maintenanceCost = Math.round(unitCost * 0.1);
      const releasedDevice: ReleasedDevice = {
        id: `bot-${bot.id}-${Date.now()}`,
        name,
        category,
        components,
        stats,
        unitCost,
        sellPrice,
        releasedMonth: month,
        totalSold: botSales,
        totalRevenue: revenue,
        totalProfit: revenue - cost,
        monthlySales: [botSales],
        durability,
        maxDurability: durability,
        maintenanceCost,
      };

      updated.releasedDevices = [...bot.releasedDevices.slice(-5), releasedDevice];

      // Reputation change
      if (overallScore > 60) {
        updated.reputation = Math.min(100, updated.reputation + 2);
      } else if (overallScore < 35) {
        updated.reputation = Math.max(20, updated.reputation - 1);
      }
    } else {
      // No release month - still get some passive revenue from existing devices
      let passiveRevenue = 0;
      let passiveCost = 0;
      for (const device of updated.releasedDevices) {
        const age = month - device.releasedMonth;
        const decay = Math.max(0.1, 1 - age * 0.15); // Sales decay over time
        const monthlySales = Math.floor((device.monthlySales[device.monthlySales.length - 1] ?? 0) * decay * (0.8 + Math.random() * 0.4));
        passiveRevenue += monthlySales * device.sellPrice;
        passiveCost += monthlySales * device.unitCost;
      }
      updated.cash += passiveRevenue - passiveCost;
      updated.monthlyRevenue = passiveRevenue;
      updated.monthlyProfit = passiveRevenue - passiveCost;
    }

    // 2. Bot AI: Research new tech
    if (bot.personality.innovation > 0.5 && updated.cash > 15000 && Math.random() < bot.personality.innovation * 0.3) {
      const techOptions = ['chip-5nm', 'chip-3nm', 'display-oled', 'display-4k', 'camera-48mp', 'camera-108mp', 'battery-graphene', 'storage-1tb', 'chassis-titan', 'ram-8gb', 'ram-16gb'];
      const unowned = techOptions.filter((t) => !updated.unlockedTech.includes(t));
      if (unowned.length > 0) {
        const tech = unowned[Math.floor(Math.random() * unowned.length)];
        updated.unlockedTech = [...updated.unlockedTech, tech];
        updated.cash -= 8000;
      }
    }

    // 3. Passive changes
    updated.reputation = Math.min(100, Math.max(20, updated.reputation + (Math.random() * 4 - 2)));
    updated.fans = Math.max(10, updated.fans + Math.floor(Math.random() * 10 - 3));

    // 4. Hire employees occasionally
    if (updated.cash > 50000 && updated.employees < 100 && Math.random() < 0.3) {
      updated.employees += 1;
      // Distribute to weakest department
      const depts = updated.departmentBonus;
      if (depts.rd <= depts.marketing && depts.rd <= depts.manufacturing) {
        updated.departmentBonus = { ...depts, rd: depts.rd + 1 };
      } else if (depts.marketing <= depts.manufacturing) {
        updated.departmentBonus = { ...depts, marketing: depts.marketing + 1 };
      } else {
        updated.departmentBonus = { ...depts, manufacturing: depts.manufacturing + 1 };
      }
    }

    return updated;
  });
}

export function calcMarketShares(
  bots: BotCompany[],
  playerMonthlyRevenue: number,
  playerReputation: number,
): { id: string; name: string; share: number; color: string; logo: string }[] {
  const entries = [
    ...bots.map((b) => ({
      id: b.id,
      name: b.name,
      score: b.monthlyRevenue * 0.6 + b.reputation * 0.3 + b.fans * 0.1,
      color: b.color,
      logo: b.logo,
    })),
    {
      id: 'player',
      name: 'You',
      score: playerMonthlyRevenue * 0.6 + playerReputation * 0.3,
      color: '#00d4ff',
      logo: '📱',
    },
  ];

  const totalScore = entries.reduce((sum, e) => sum + e.score, 0) || 1;

  return entries
    .map((e) => ({
      ...e,
      share: Math.round((e.score / totalScore) * 100),
    }))
    .sort((a, b) => b.share - a.share);
}

export function generateQuarterlyReport(
  bots: BotCompany[],
  playerCash: number,
  playerRevenue: number,
  playerProfit: number,
  _playerReputation: number,
  month: number,
) {
  const quarter = Math.ceil(month / 3);
  const totalMarketRevenue = bots.reduce((sum, b) => sum + b.monthlyRevenue, 0) + playerRevenue;

  return {
    quarter,
    month,
    playerRevenue,
    playerProfit,
    playerCash,
    totalMarketRevenue,
    marketShare: totalMarketRevenue > 0 ? Math.round((playerRevenue / totalMarketRevenue) * 100) : 0,
    competitors: bots.map((b) => ({
      name: b.name,
      revenue: b.monthlyRevenue,
      profit: b.monthlyProfit,
      reputation: b.reputation,
      trend: b.trend,
    })),
  };
}
