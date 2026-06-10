import { COMPONENTS, CATEGORY_META, STARTER_COMPONENTS, SLOTS_BY_CATEGORY } from '../data/components';
import { CAMPAIGNS, TREND_POOL } from '../data/marketing';
import { TECH_TREE } from '../data/techTree';
import type {
  ComponentSlot,
  CraftedPart,
  DeviceCategory,
  DeviceStats,
  MarketTrend,
  ProductDesign,
  ProductionLine,
  ReleasedDevice,
} from '../types';

const BASE: DeviceStats = {
  performance: 20,
  display: 20,
  camera: 15,
  battery: 25,
  build: 25,
  appeal: 20,
};

const CATEGORY_BONUS: Record<DeviceCategory, Partial<DeviceStats>> = {
  smartphone:  { camera: 5, appeal: 5 },
  laptop:      { performance: 5, build: 5 },
  smartwatch:  { battery: 8, appeal: 5 },
  tablet:      { display: 5, performance: 3 },
  earbuds:     { battery: 5, appeal: 8 },
  smarttv:     { display: 10, appeal: 6 },
};

export function getComponent(id: string) {
  return COMPONENTS.find((c) => c.id === id);
}

export function getTech(id: string) {
  return TECH_TREE.find((t) => t.id === id);
}

export function getAvailableComponents(
  slot: ComponentSlot,
  category: DeviceCategory,
  unlockedTech: string[],
  craftedParts: CraftedPart[] = [],
) {
  const base = COMPONENTS.filter((c) => {
    if (c.slot !== slot || !c.categories.includes(category)) return false;
    if (STARTER_COMPONENTS.includes(c.id)) return true;
    if (!c.unlockTech) return true;
    return unlockedTech.includes(c.unlockTech);
  });
  const crafted = craftedParts.filter((c) => c.slot === slot && c.categories.includes(category));
  return [...base, ...crafted];
}

export function getDefaultComponents(category: DeviceCategory, unlockedTech: string[]) {
  const comps: Partial<Record<ComponentSlot, string>> = {};
  for (const slot of SLOTS_BY_CATEGORY[category]) {
    const opts = getAvailableComponents(slot, category, unlockedTech);
    if (opts[0]) comps[slot] = opts[0].id;
  }
  return comps;
}

export function calcDesignStats(category: DeviceCategory, components: Partial<Record<ComponentSlot, string>>) {
  const stats = { ...BASE };
  let unitCost = 8;
  const bonus = CATEGORY_BONUS[category] ?? {};

  for (const [k, v] of Object.entries(bonus)) {
    if (v !== undefined) stats[k as keyof DeviceStats] += v;
  }

  for (const id of Object.values(components)) {
    if (!id) continue;
    const c = getComponent(id);
    if (!c) continue;
    unitCost += c.cost;
    for (const [k, v] of Object.entries(c.stats)) {
      if (v !== undefined) stats[k as keyof DeviceStats] += v;
    }
  }

  for (const k of Object.keys(stats) as (keyof DeviceStats)[]) {
    stats[k] = Math.min(100, Math.max(5, Math.round(stats[k])));
  }
  return { stats, unitCost: Math.round(unitCost * 100) / 100 };
}

export function suggestPrice(stats: DeviceStats, unitCost: number, category: DeviceCategory) {
  const avg = Object.values(stats).reduce((a, b) => a + b, 0) / 6;
  const meta = CATEGORY_META[category];
  return Math.round(unitCost * (1.4 + avg / 120) * meta.priceSensitivity * 10) / 10;
}

export function generateDeviceReview(
  category: DeviceCategory,
  stats: DeviceStats,
  unitCost: number,
  sellPrice: number,
  components: Partial<Record<ComponentSlot, string>>,
  unlockedTechCount: number
) {
  // 1. Base score derived from average stats (which ranges from 5 to 100)
  const avgStats = Object.values(stats).reduce((a, b) => a + b, 0) / 6;

  // 2. Price/value factor: markup ratio
  const markup = sellPrice / Math.max(1, unitCost);
  let priceScore = 100;
  if (markup > 3.0) {
    priceScore = Math.max(20, 100 - (markup - 3.0) * 45); // heavily penalize high pricing
  } else if (markup > 1.8) {
    priceScore = 100 - (markup - 1.8) * 18;
  } else if (markup < 1.3) {
    priceScore = 110; // value bonus
  }

  // 3. Outdated components penalty:
  let tierSum = 0;
  let compCount = 0;
  for (const id of Object.values(components)) {
    if (!id) continue;
    const c = getComponent(id);
    if (c) {
      tierSum += c.tier;
      compCount++;
    }
  }
  const avgTier = compCount > 0 ? tierSum / compCount : 1;
  const expectedTier = Math.min(5, 1 + Math.floor(unlockedTechCount / 8));
  let tierPenalty = 0;
  if (avgTier < expectedTier - 1.2) {
    tierPenalty = (expectedTier - avgTier) * 15; // penalty for outdated tech
  }

  // Final score calculated as weighted average, bounded between 10 and 100
  let finalScore = Math.round(avgStats * 0.6 + priceScore * 0.4 - tierPenalty + Math.random() * 8 - 4);
  finalScore = Math.min(100, Math.max(10, finalScore));

  // Specific feedback comments based on ratings
  const feedbackList: string[] = [];

  // Performance feedback
  if (stats.performance > 70) {
    feedbackList.push("Performance is blisteringly fast; it handles everything with absolute ease.");
  } else if (stats.performance < 35) {
    feedbackList.push("Performance is sluggish; navigating menus feels slow and frustrating.");
  } else {
    feedbackList.push("Performance is adequate for daily tasks, though it can hitch occasionally under load.");
  }

  // Battery life feedback
  if (stats.battery > 70) {
    feedbackList.push("The battery life is exceptional, easily stretching into a second day of heavy use.");
  } else if (stats.battery < 35) {
    feedbackList.push("Battery life is quite disappointing; expect to be charging it multiple times a day.");
  } else {
    feedbackList.push("Battery life will comfortably get you through a standard day on a single charge.");
  }

  // Camera feedback (for smartphone/tablet)
  if (['smartphone', 'tablet'].includes(category)) {
    if (stats.camera > 70) {
      feedbackList.push("The camera captures stunningly detailed photos with superb colors.");
    } else if (stats.camera < 35) {
      feedbackList.push("The photos are grainy, washed out, and lack details in dim lighting.");
    } else {
      feedbackList.push("The camera is decent enough for quick snaps but lacks premium sharpness.");
    }
  }

  // Value feedback
  if (priceScore > 100) {
    feedbackList.push("It offers incredible value for the money, punching way above its price tag.");
  } else if (priceScore < 60) {
    feedbackList.push("It is prohibitively expensive for what it offers; competitors offer far more value.");
  }

  // Fisher-Yates Shuffle algorithm to uniformly shuffle feedback options
  const shuffledFeedbacks = [...feedbackList];
  for (let i = shuffledFeedbacks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffledFeedbacks[i];
    shuffledFeedbacks[i] = shuffledFeedbacks[j];
    shuffledFeedbacks[j] = temp;
  }
  const selectedFeedbacks = shuffledFeedbacks.slice(0, 3);
  while (selectedFeedbacks.length < 3) {
    selectedFeedbacks.push(`A solid attempt at a ${category} with a balance of features.`);
  }

  return {
    score: finalScore,
    feedbacks: selectedFeedbacks
  };
}

export function getTechEffects(unlockedTech: string[]) {
  let factorySpeed = 0;
  let marketingBonus = 0;
  let labUnlocked = false;
  let qualityBonus = 0;
  let salesBonus = 0;
  let costReduction = 0;

  for (const id of unlockedTech) {
    const t = getTech(id);
    factorySpeed  += t?.effects?.factorySpeed   ?? 0;
    marketingBonus += t?.effects?.marketingBonus ?? 0;
    qualityBonus  += t?.effects?.qualityBonus    ?? 0;
    salesBonus    += t?.effects?.salesBonus      ?? 0;
    costReduction += t?.effects?.costReduction   ?? 0;
    if (t?.effects?.labUnlocked) labUnlocked = true;
  }
  return { factorySpeed, marketingBonus, labUnlocked, qualityBonus, salesBonus, costReduction };
}

export function getTrendMultiplier(trends: MarketTrend[], category: DeviceCategory) {
  return trends.reduce(
    (m, t) => (t.category === 'all' || t.category === category ? m * t.demandMultiplier : m),
    1,
  );
}

export function simulateSales(
  designs: ProductDesign[],
  releasedDevices: ReleasedDevice[],
  inventory: Record<string, number>,
  trends: MarketTrend[],
  fans: number,
  reputation: number,
  campaignBoost: number,
  salesBonus = 0,
) {
  const unitsSold: Record<string, number> = {};
  let revenue = 0;

  for (const d of designs) {
    const released = releasedDevices.find((r) => r.id === d.id);
    if (!released) continue; // Must be released to sell
    const stock = inventory[d.id] ?? 0;
    if (stock <= 0) continue;

    const hype = released.hype ?? 50;
    const trend = getTrendMultiplier(trends, d.category);
    const meta = CATEGORY_META[d.category];
    const appeal = d.stats.appeal + campaignBoost + reputation * 0.2 + fans * 0.05 + hype * 0.3;
    const reviewMult = 0.3 + (d.reviewScore ?? 75) / 100;
    const max = Math.floor((8 + appeal * 0.25) * meta.baseDemand * trend * (1 + salesBonus) * reviewMult * 750);
    const units = Math.min(stock, Math.max(0, Math.floor(max * (0.85 + Math.random() * 0.3))));
    unitsSold[d.id] = units;
    revenue += units * d.sellPrice;
  }
  return { unitsSold, revenue };
}

export function processProduction(factories: ProductionLine[], factorySpeedBonus: number) {
  return factories.map((f) => {
    const line = { ...f };
    if (!line.assignedProductId) return line;
    const speed = line.capacity * (1 + factorySpeedBonus) * (1 + (line.level - 1) * 0.15);
    line.progress += speed;
    return line;
  });
}

export function rollTrend(day: number): MarketTrend | null {
  if (Math.random() > 0.2) return null;
  const t = TREND_POOL[Math.floor(Math.random() * TREND_POOL.length)];
  return { ...t, id: `t-${day}-${Math.random().toString(36).slice(2, 6)}`, daysLeft: 5 + Math.floor(Math.random() * 5) };
}

export function getCampaignBoost(activeIds: string[], marketingBonus: number) {
  return (
    activeIds.reduce((s, id) => s + (CAMPAIGNS.find((c) => c.id === id)?.appealBoost ?? 0), 0) *
    (1 + marketingBonus)
  );
}

export function batteryToHours(batteryStat: number): number {
  return Math.round(8 + (batteryStat / 100) * 64);
}

export function cameraToMP(cameraStat: number): number {
  return Math.round(8 + (cameraStat / 100) * 192);
}
