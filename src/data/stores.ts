import type { StoreRegion } from '../types';

export interface StoreTemplate {
  region: StoreRegion;
  name: string;
  flag: string;
  tier1Cost: number;
  tier2Cost: number;
  tier3Cost: number;
  maintenanceBase: number;
  salesMultiplier: number;
  demandBonus: number;
  description: string;
}

export const STORE_REGIONS: StoreTemplate[] = [
  {
    region: 'north_america',
    name: 'North America',
    flag: '🇺🇸',
    tier1Cost: 80000000,
    tier2Cost: 200000000,
    tier3Cost: 500000000,
    maintenanceBase: 500000,
    salesMultiplier: 1.4,
    demandBonus: 15,
    description: 'Largest consumer electronics market. High purchasing power.',
  },
  {
    region: 'europe',
    name: 'Europe',
    flag: '🇪🇺',
    tier1Cost: 70000000,
    tier2Cost: 175000000,
    tier3Cost: 440000000,
    maintenanceBase: 450000,
    salesMultiplier: 1.3,
    demandBonus: 12,
    description: 'Tech-savvy consumers with strong brand loyalty.',
  },
  {
    region: 'asia',
    name: 'Asia Pacific',
    flag: '🌏',
    tier1Cost: 50000000,
    tier2Cost: 130000000,
    tier3Cost: 350000000,
    maintenanceBase: 350000,
    salesMultiplier: 1.6,
    demandBonus: 20,
    description: 'Fastest growing market. Extremely competitive but high volume.',
  },
  {
    region: 'south_america',
    name: 'South America',
    flag: '🌎',
    tier1Cost: 35000000,
    tier2Cost: 90000000,
    tier3Cost: 240000000,
    maintenanceBase: 250000,
    salesMultiplier: 1.1,
    demandBonus: 8,
    description: 'Emerging market with growing middle class.',
  },
  {
    region: 'middle_east',
    name: 'Middle East',
    flag: '🏙️',
    tier1Cost: 60000000,
    tier2Cost: 155000000,
    tier3Cost: 400000000,
    maintenanceBase: 400000,
    salesMultiplier: 1.25,
    demandBonus: 18,
    description: 'High luxury demand. Affluent consumers seeking premium products.',
  },
  {
    region: 'africa',
    name: 'Africa',
    flag: '🌍',
    tier1Cost: 25000000,
    tier2Cost: 65000000,
    tier3Cost: 180000000,
    maintenanceBase: 180000,
    salesMultiplier: 0.9,
    demandBonus: 5,
    description: 'Rapidly developing market. Low cost, high growth potential.',
  },
];

export const STORE_TIER_NAMES = {
  1: 'Kiosk',
  2: 'Flagship Store',
  3: 'Mega Mall',
};

export const STORE_TIER_ICONS = {
  1: '🏪',
  2: '🏬',
  3: '🏙️',
};
