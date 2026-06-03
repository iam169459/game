import type { ComponentDef, ComponentSlot, DeviceCategory } from '../types/index';

export const COMPONENTS: ComponentDef[] = [
  // Screens
  { id: 'lcd-basic', name: 'LCD 720p', slot: 'screen', tier: 1, cost: 12, categories: ['smartphone', 'smartwatch'], stats: { display: 35, appeal: 20 } },
  { id: 'oled-mid', name: 'OLED 1080p', slot: 'screen', tier: 2, cost: 28, categories: ['smartphone', 'laptop', 'smartwatch'], stats: { display: 58, appeal: 45 }, unlockTech: 'display-oled' },
  { id: 'oled-pro', name: 'OLED 2K Pro', slot: 'screen', tier: 3, cost: 55, categories: ['smartphone', 'laptop'], stats: { display: 78, appeal: 62 }, unlockTech: 'display-2k' },
  { id: 'mini-led', name: 'Mini-LED 4K', slot: 'screen', tier: 4, cost: 95, categories: ['laptop', 'smartphone'], stats: { display: 92, appeal: 75 }, unlockTech: 'display-4k' },
  { id: 'amoled-watch', name: 'AMOLED Round', slot: 'screen', tier: 2, cost: 18, categories: ['smartwatch'], stats: { display: 52, appeal: 48 }, unlockTech: 'display-oled' },

  // CPUs
  { id: 'cpu-entry', name: 'Quad-Core A4', slot: 'cpu', tier: 1, cost: 15, categories: ['smartphone', 'smartwatch'], stats: { performance: 30, battery: -5 } },
  { id: 'cpu-mid', name: 'Octa-Core B7', slot: 'cpu', tier: 2, cost: 35, categories: ['smartphone', 'laptop', 'smartwatch'], stats: { performance: 55, battery: -8 }, unlockTech: 'chip-7nm' },
  { id: 'cpu-pro', name: 'Neural X12', slot: 'cpu', tier: 3, cost: 68, categories: ['smartphone', 'laptop'], stats: { performance: 78, appeal: 15, battery: -12 }, unlockTech: 'chip-5nm' },
  { id: 'cpu-ultra', name: 'Fusion M3 Max', slot: 'cpu', tier: 4, cost: 120, categories: ['laptop', 'smartphone'], stats: { performance: 95, appeal: 25, battery: -18 }, unlockTech: 'chip-3nm' },
  { id: 'cpu-watch', name: 'Efficiency S1', slot: 'cpu', tier: 2, cost: 22, categories: ['smartwatch'], stats: { performance: 42, battery: 8 }, unlockTech: 'chip-7nm' },

  // Cameras
  { id: 'cam-basic', name: '8MP Sensor', slot: 'camera', tier: 1, cost: 8, categories: ['smartphone'], stats: { camera: 28, appeal: 18 } },
  { id: 'cam-dual', name: 'Dual 48MP', slot: 'camera', tier: 2, cost: 32, categories: ['smartphone', 'laptop'], stats: { camera: 58, appeal: 42 }, unlockTech: 'camera-dual' },
  { id: 'cam-triple', name: 'Triple Pro Array', slot: 'camera', tier: 3, cost: 58, categories: ['smartphone'], stats: { camera: 82, appeal: 65 }, unlockTech: 'camera-pro' },
  { id: 'cam-none-laptop', name: 'HD Webcam', slot: 'camera', tier: 1, cost: 6, categories: ['laptop'], stats: { camera: 35, appeal: 20 } },
  { id: 'cam-watch', name: 'Micro Sensor', slot: 'camera', tier: 1, cost: 5, categories: ['smartwatch'], stats: { camera: 22, appeal: 15 } },

  // Batteries
  { id: 'bat-small', name: 'Li-Ion 2000mAh', slot: 'battery', tier: 1, cost: 10, categories: ['smartphone', 'smartwatch'], stats: { battery: 35, build: 10 } },
  { id: 'bat-mid', name: 'Li-Po 4500mAh', slot: 'battery', tier: 2, cost: 22, categories: ['smartphone', 'laptop'], stats: { battery: 58, build: 15 }, unlockTech: 'battery-fast' },
  { id: 'bat-large', name: 'Graphene 8000mAh', slot: 'battery', tier: 3, cost: 45, categories: ['laptop', 'smartphone'], stats: { battery: 82, appeal: 12 }, unlockTech: 'battery-graphene' },
  { id: 'bat-watch', name: 'Coin Cell Pack', slot: 'battery', tier: 1, cost: 8, categories: ['smartwatch'], stats: { battery: 48, build: 8 } },

  // RAM
  { id: 'ram-2gb', name: '2GB DDR4', slot: 'ram', tier: 1, cost: 6, categories: ['smartphone', 'smartwatch'], stats: { performance: 10, appeal: 10 } },
  { id: 'ram-4gb', name: '4GB LPDDR5', slot: 'ram', tier: 2, cost: 14, categories: ['smartphone', 'laptop', 'smartwatch'], stats: { performance: 28, appeal: 22 }, unlockTech: 'ram-4gb' },
  { id: 'ram-8gb', name: '8GB LPDDR5X', slot: 'ram', tier: 3, cost: 28, categories: ['smartphone', 'laptop'], stats: { performance: 45, appeal: 35 }, unlockTech: 'ram-8gb' },
  { id: 'ram-16gb', name: '16GB DDR5', slot: 'ram', tier: 4, cost: 52, categories: ['laptop'], stats: { performance: 65, appeal: 45 }, unlockTech: 'ram-16gb' },

  // Storage
  { id: 'stor-64', name: '64GB eMMC', slot: 'storage', tier: 1, cost: 8, categories: ['smartphone', 'smartwatch'], stats: { performance: 15, appeal: 18 } },
  { id: 'stor-256', name: '256GB NVMe', slot: 'storage', tier: 2, cost: 22, categories: ['smartphone', 'laptop', 'smartwatch'], stats: { performance: 35, appeal: 35 }, unlockTech: 'storage-nvme' },
  { id: 'stor-1tb', name: '1TB SSD Pro', slot: 'storage', tier: 3, cost: 48, categories: ['laptop', 'smartphone'], stats: { performance: 55, appeal: 48 }, unlockTech: 'storage-1tb' },

  // Chassis
  { id: 'chassis-plastic', name: 'Polycarbonate', slot: 'chassis', tier: 1, cost: 6, categories: ['smartphone', 'laptop', 'smartwatch'], stats: { build: 30, appeal: 22 } },
  { id: 'chassis-alum', name: 'Aluminum Unibody', slot: 'chassis', tier: 2, cost: 18, categories: ['smartphone', 'laptop', 'smartwatch'], stats: { build: 55, appeal: 45 }, unlockTech: 'chassis-premium' },
  { id: 'chassis-titan', name: 'Titanium Frame', slot: 'chassis', tier: 3, cost: 42, categories: ['smartphone', 'laptop'], stats: { build: 85, appeal: 70 }, unlockTech: 'chassis-titan' },
];

export const STARTER_COMPONENTS = [
  'lcd-basic',
  'cpu-entry',
  'ram-2gb',
  'cam-basic',
  'cam-none-laptop',
  'cam-watch',
  'bat-small',
  'bat-watch',
  'stor-64',
  'chassis-plastic',
];

export const SLOTS_BY_CATEGORY: Record<DeviceCategory, ComponentSlot[]> = {
  smartphone: ['screen', 'cpu', 'ram', 'camera', 'battery', 'storage', 'chassis'],
  laptop: ['screen', 'cpu', 'ram', 'camera', 'battery', 'storage', 'chassis'],
  smartwatch: ['screen', 'cpu', 'ram', 'camera', 'battery', 'storage', 'chassis'],
};

export const CATEGORY_META = {
  smartphone: { label: 'Smartphone', icon: '📱', baseDemand: 1.2, priceSensitivity: 0.85 },
  laptop: { label: 'Laptop', icon: '💻', baseDemand: 0.9, priceSensitivity: 0.75 },
  smartwatch: { label: 'Smartwatch', icon: '⌚', baseDemand: 1.0, priceSensitivity: 0.9 },
};
