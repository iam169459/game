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
} from '../types';

const BASE: DeviceStats = {
  performance: 20,
  display: 20,
  camera: 15,
  battery: 25,
  build: 25,
  appeal: 20,
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
  const bonus =
    category === 'laptop'
      ? { performance: 5, build: 5 }
      : category === 'smartwatch'
        ? { battery: 8, appeal: 5 }
        : { camera: 5, appeal: 5 };

  for (const [k, v] of Object.entries(bonus)) stats[k as keyof DeviceStats] += v;

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

export function getTechEffects(unlockedTech: string[]) {
  let factorySpeed = 0;
  let marketingBonus = 0;
  let labUnlocked = false;
  for (const id of unlockedTech) {
    const t = getTech(id);
    factorySpeed += t?.effects?.factorySpeed ?? 0;
    marketingBonus += t?.effects?.marketingBonus ?? 0;
    if (t?.effects?.labUnlocked) labUnlocked = true;
  }
  return { factorySpeed, marketingBonus, labUnlocked };
}

export function getTrendMultiplier(trends: MarketTrend[], category: DeviceCategory) {
  return trends.reduce((m, t) => (t.category === 'all' || t.category === category ? m * t.demandMultiplier : m), 1);
}

export function simulateSales(
  designs: ProductDesign[],
  inventory: Record<string, number>,
  trends: MarketTrend[],
  fans: number,
  reputation: number,
  campaignBoost: number,
) {
  const unitsSold: Record<string, number> = {};
  let revenue = 0;

  for (const d of designs) {
    const stock = inventory[d.id] ?? 0;
    if (stock <= 0) continue;
    const trend = getTrendMultiplier(trends, d.category);
    const meta = CATEGORY_META[d.category];
    const appeal = d.stats.appeal + campaignBoost + reputation * 0.2 + fans * 0.05;
    const max = Math.floor((12 + appeal * 0.35) * meta.baseDemand * trend);
    const units = Math.min(stock, Math.max(0, Math.floor(max * (0.85 + Math.random() * 0.3))));
    unitsSold[d.id] = units;
    revenue += units * d.sellPrice;
  }
  return { unitsSold, revenue };
}

export function processProduction(
  factories: ProductionLine[],
  factorySpeedBonus: number,
) {
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
  return activeIds.reduce((s, id) => s + (CAMPAIGNS.find((c) => c.id === id)?.appealBoost ?? 0), 0) * (1 + marketingBonus);
}

export function batteryToHours(batteryStat: number): number {
  return Math.round(8 + (batteryStat / 100) * 64);
}

export function cameraToMP(cameraStat: number): number {
  return Math.round(8 + (cameraStat / 100) * 192);
}
