import type { ComponentDef, ComponentSlot, DeviceCategory } from '../types/index';

export const COMPONENTS: ComponentDef[] = [
  // ── SCREENS ────────────────────────────────────────────────────────────────
  { id: 'lcd-basic',     name: 'LCD 720p',          slot: 'screen', tier: 1, cost: 12,  categories: ['smartphone', 'smartwatch'], stats: { display: 35, appeal: 20 } },
  { id: 'oled-mid',      name: 'OLED 1080p',        slot: 'screen', tier: 2, cost: 28,  categories: ['smartphone', 'laptop', 'smartwatch'], stats: { display: 58, appeal: 45 }, unlockTech: 'display-oled' },
  { id: 'oled-pro',      name: 'OLED 2K Pro',       slot: 'screen', tier: 3, cost: 55,  categories: ['smartphone', 'laptop', 'tablet'], stats: { display: 78, appeal: 62 }, unlockTech: 'display-2k' },
  { id: 'mini-led',      name: 'Mini-LED 4K',       slot: 'screen', tier: 4, cost: 95,  categories: ['laptop', 'smartphone', 'tablet', 'smarttv'], stats: { display: 92, appeal: 75 }, unlockTech: 'display-4k' },
  { id: 'micro-led',     name: 'Micro-LED 8K',      slot: 'screen', tier: 5, cost: 160, categories: ['smarttv', 'laptop'], stats: { display: 99, appeal: 90 }, unlockTech: 'display-8k' },
  { id: 'amoled-watch',  name: 'AMOLED Round',      slot: 'screen', tier: 2, cost: 18,  categories: ['smartwatch'], stats: { display: 52, appeal: 48 }, unlockTech: 'display-oled' },
  { id: 'lcd-tablet',    name: 'IPS LCD 10"',       slot: 'screen', tier: 1, cost: 20,  categories: ['tablet'], stats: { display: 42, appeal: 28 } },
  { id: 'oled-tablet',   name: 'OLED 12" Retina',   slot: 'screen', tier: 3, cost: 70,  categories: ['tablet'], stats: { display: 82, appeal: 68 }, unlockTech: 'display-2k' },
  { id: 'lcd-tv',        name: 'VA Panel 55"',      slot: 'screen', tier: 1, cost: 55,  categories: ['smarttv'], stats: { display: 38, appeal: 30 } },
  { id: 'qled-tv',       name: 'QLED 65"',          slot: 'screen', tier: 3, cost: 120, categories: ['smarttv'], stats: { display: 80, appeal: 70 }, unlockTech: 'display-4k' },

  // ── CPUs ─────────────────────────────────────────────────────────────────
  { id: 'cpu-entry',     name: 'Quad-Core A4',      slot: 'cpu', tier: 1, cost: 15,  categories: ['smartphone', 'smartwatch', 'tablet'], stats: { performance: 30, battery: -5 } },
  { id: 'cpu-mid',       name: 'Octa-Core B7',      slot: 'cpu', tier: 2, cost: 35,  categories: ['smartphone', 'laptop', 'smartwatch', 'tablet'], stats: { performance: 55, battery: -8 }, unlockTech: 'chip-7nm' },
  { id: 'cpu-pro',       name: 'Neural X12',        slot: 'cpu', tier: 3, cost: 68,  categories: ['smartphone', 'laptop', 'tablet'], stats: { performance: 78, appeal: 15, battery: -12 }, unlockTech: 'chip-5nm' },
  { id: 'cpu-ultra',     name: 'Fusion M3 Max',     slot: 'cpu', tier: 4, cost: 120, categories: ['laptop', 'smartphone', 'tablet'], stats: { performance: 95, appeal: 25, battery: -18 }, unlockTech: 'chip-3nm' },
  { id: 'cpu-apex',      name: 'Quantum X1',        slot: 'cpu', tier: 5, cost: 200, categories: ['laptop', 'smartphone'], stats: { performance: 100, appeal: 35, battery: -22 }, unlockTech: 'chip-2nm' },
  { id: 'cpu-watch',     name: 'Efficiency S1',     slot: 'cpu', tier: 2, cost: 22,  categories: ['smartwatch'], stats: { performance: 42, battery: 8 }, unlockTech: 'chip-7nm' },
  { id: 'cpu-tv',        name: 'Smart Hub Proc',    slot: 'cpu', tier: 2, cost: 30,  categories: ['smarttv'], stats: { performance: 50, appeal: 12 } },
  { id: 'cpu-tv-pro',    name: 'Gaming CPU 4K',     slot: 'cpu', tier: 3, cost: 65,  categories: ['smarttv'], stats: { performance: 72, appeal: 22 }, unlockTech: 'chip-5nm' },

  // ── CAMERAS ──────────────────────────────────────────────────────────────
  { id: 'cam-basic',     name: '8MP Sensor',        slot: 'camera', tier: 1, cost: 8,  categories: ['smartphone', 'tablet'], stats: { camera: 28, appeal: 18 } },
  { id: 'cam-dual',      name: 'Dual 48MP',         slot: 'camera', tier: 2, cost: 32, categories: ['smartphone', 'laptop', 'tablet'], stats: { camera: 58, appeal: 42 }, unlockTech: 'camera-dual' },
  { id: 'cam-triple',    name: 'Triple Pro Array',  slot: 'camera', tier: 3, cost: 58, categories: ['smartphone'], stats: { camera: 82, appeal: 65 }, unlockTech: 'camera-pro' },
  { id: 'cam-periscope', name: 'Periscope 200MP',   slot: 'camera', tier: 4, cost: 95, categories: ['smartphone'], stats: { camera: 95, appeal: 78 }, unlockTech: 'camera-periscope' },
  { id: 'cam-webcam',    name: 'HD Webcam',         slot: 'camera', tier: 1, cost: 6,  categories: ['laptop', 'smarttv'], stats: { camera: 35, appeal: 20 } },
  { id: 'cam-webcam-4k', name: '4K Webcam AI',      slot: 'camera', tier: 3, cost: 28, categories: ['laptop'], stats: { camera: 65, appeal: 38 }, unlockTech: 'camera-dual' },
  { id: 'cam-watch',     name: 'Micro Sensor',      slot: 'camera', tier: 1, cost: 5,  categories: ['smartwatch'], stats: { camera: 22, appeal: 15 } },
  { id: 'cam-none-tv',   name: 'Privacy Shield',    slot: 'camera', tier: 2, cost: 12, categories: ['smarttv'], stats: { camera: 30, appeal: 25 }, unlockTech: 'camera-dual' },

  // ── BATTERIES ────────────────────────────────────────────────────────────
  { id: 'bat-small',     name: 'Li-Ion 2000mAh',   slot: 'battery', tier: 1, cost: 10, categories: ['smartphone', 'smartwatch'], stats: { battery: 35, build: 10 } },
  { id: 'bat-mid',       name: 'Li-Po 4500mAh',    slot: 'battery', tier: 2, cost: 22, categories: ['smartphone', 'laptop', 'tablet'], stats: { battery: 58, build: 15 }, unlockTech: 'battery-fast' },
  { id: 'bat-large',     name: 'Graphene 8000mAh', slot: 'battery', tier: 3, cost: 45, categories: ['laptop', 'smartphone', 'tablet'], stats: { battery: 82, appeal: 12 }, unlockTech: 'battery-graphene' },
  { id: 'bat-ultra',     name: 'Solid-State 120Wh',slot: 'battery', tier: 5, cost: 90, categories: ['laptop', 'tablet'], stats: { battery: 98, appeal: 20 }, unlockTech: 'battery-solid' },
  { id: 'bat-watch',     name: 'Coin Cell Pack',   slot: 'battery', tier: 1, cost: 8,  categories: ['smartwatch'], stats: { battery: 48, build: 8 } },
  { id: 'bat-watch-pro', name: 'Micro Solid Cell', slot: 'battery', tier: 3, cost: 30, categories: ['smartwatch'], stats: { battery: 78, build: 18 }, unlockTech: 'battery-fast' },
  { id: 'bat-earbuds',   name: 'Case 600mAh',      slot: 'battery', tier: 1, cost: 6,  categories: ['earbuds'], stats: { battery: 55, appeal: 10 } },
  { id: 'bat-earbuds-pro', name: 'ANC Case 1000mAh', slot: 'battery', tier: 3, cost: 18, categories: ['earbuds'], stats: { battery: 80, appeal: 22 }, unlockTech: 'battery-fast' },
  { id: 'bat-tv',        name: 'Power Supply 65W', slot: 'battery', tier: 1, cost: 15, categories: ['smarttv'], stats: { battery: 60, build: 12 } },

  // ── RAM ──────────────────────────────────────────────────────────────────
  { id: 'ram-2gb',       name: '2GB DDR4',          slot: 'ram', tier: 1, cost: 6,  categories: ['smartphone', 'smartwatch', 'tablet'], stats: { performance: 10, appeal: 10 } },
  { id: 'ram-4gb',       name: '4GB LPDDR5',        slot: 'ram', tier: 2, cost: 14, categories: ['smartphone', 'laptop', 'smartwatch', 'tablet'], stats: { performance: 28, appeal: 22 }, unlockTech: 'ram-4gb' },
  { id: 'ram-8gb',       name: '8GB LPDDR5X',       slot: 'ram', tier: 3, cost: 28, categories: ['smartphone', 'laptop', 'tablet'], stats: { performance: 45, appeal: 35 }, unlockTech: 'ram-8gb' },
  { id: 'ram-16gb',      name: '16GB DDR5',         slot: 'ram', tier: 4, cost: 52, categories: ['laptop', 'tablet'], stats: { performance: 65, appeal: 45 }, unlockTech: 'ram-16gb' },
  { id: 'ram-32gb',      name: '32GB HBM3',         slot: 'ram', tier: 5, cost: 95, categories: ['laptop'], stats: { performance: 88, appeal: 58 }, unlockTech: 'ram-hbm' },
  { id: 'ram-tv',        name: '2GB GDDR6',         slot: 'ram', tier: 2, cost: 12, categories: ['smarttv'], stats: { performance: 32, appeal: 15 } },
  { id: 'ram-earbuds',   name: 'DSP 512MB',         slot: 'ram', tier: 2, cost: 8,  categories: ['earbuds'], stats: { performance: 38, appeal: 18 } },

  // ── STORAGE ──────────────────────────────────────────────────────────────
  { id: 'stor-64',       name: '64GB eMMC',         slot: 'storage', tier: 1, cost: 8,  categories: ['smartphone', 'smartwatch', 'tablet'], stats: { performance: 15, appeal: 18 } },
  { id: 'stor-256',      name: '256GB NVMe',        slot: 'storage', tier: 2, cost: 22, categories: ['smartphone', 'laptop', 'smartwatch', 'tablet'], stats: { performance: 35, appeal: 35 }, unlockTech: 'storage-nvme' },
  { id: 'stor-1tb',      name: '1TB SSD Pro',       slot: 'storage', tier: 3, cost: 48, categories: ['laptop', 'smartphone', 'tablet'], stats: { performance: 55, appeal: 48 }, unlockTech: 'storage-1tb' },
  { id: 'stor-4tb',      name: '4TB SSD Extreme',   slot: 'storage', tier: 5, cost: 100, categories: ['laptop'], stats: { performance: 80, appeal: 65 }, unlockTech: 'storage-4tb' },
  { id: 'stor-tv',       name: '32GB Flash',        slot: 'storage', tier: 1, cost: 10, categories: ['smarttv'], stats: { performance: 20, appeal: 12 } },
  { id: 'stor-tv-pro',   name: '128GB + Cloud',     slot: 'storage', tier: 3, cost: 25, categories: ['smarttv'], stats: { performance: 42, appeal: 28 }, unlockTech: 'storage-nvme' },

  // ── CHASSIS ──────────────────────────────────────────────────────────────
  { id: 'chassis-plastic',name: 'Polycarbonate',   slot: 'chassis', tier: 1, cost: 6,  categories: ['smartphone', 'laptop', 'smartwatch', 'tablet', 'smarttv', 'earbuds'], stats: { build: 30, appeal: 22 } },
  { id: 'chassis-alum',   name: 'Aluminum Unibody', slot: 'chassis', tier: 2, cost: 18, categories: ['smartphone', 'laptop', 'smartwatch', 'tablet'], stats: { build: 55, appeal: 45 }, unlockTech: 'chassis-premium' },
  { id: 'chassis-titan',  name: 'Titanium Frame',   slot: 'chassis', tier: 3, cost: 42, categories: ['smartphone', 'laptop', 'tablet'], stats: { build: 80, appeal: 65 }, unlockTech: 'chassis-titan' },
  { id: 'chassis-carbon', name: 'Carbon Fiber',     slot: 'chassis', tier: 4, cost: 72, categories: ['laptop', 'smartphone'], stats: { build: 92, appeal: 80 }, unlockTech: 'chassis-carbon' },
  { id: 'chassis-ceramic',name: 'Ceramic White',    slot: 'chassis', tier: 4, cost: 65, categories: ['smartphone'], stats: { build: 88, appeal: 85 }, unlockTech: 'chassis-titan' },
  { id: 'chassis-tv',     name: 'Slim Metal Stand', slot: 'chassis', tier: 2, cost: 35, categories: ['smarttv'], stats: { build: 60, appeal: 52 }, unlockTech: 'chassis-premium' },
  { id: 'chassis-earbuds',name: 'Ergonomic Stem',   slot: 'chassis', tier: 2, cost: 14, categories: ['earbuds'], stats: { build: 52, appeal: 58 }, unlockTech: 'chassis-premium' },
  { id: 'chassis-earbuds-pro', name: 'Wing-Tip Pro', slot: 'chassis', tier: 3, cost: 26, categories: ['earbuds'], stats: { build: 72, appeal: 78 }, unlockTech: 'chassis-titan' },

  // ── AUDIO (earbuds specific) ──────────────────────────────────────────────
  { id: 'audio-basic',    name: '8mm Driver',       slot: 'audio', tier: 1, cost: 8,  categories: ['earbuds'], stats: { performance: 25, appeal: 28 } },
  { id: 'audio-hi-fi',    name: 'Hi-Fi 10mm',       slot: 'audio', tier: 2, cost: 22, categories: ['earbuds'], stats: { performance: 52, appeal: 55 }, unlockTech: 'audio-hifi' },
  { id: 'audio-planar',   name: 'Planar Magnetic',  slot: 'audio', tier: 3, cost: 45, categories: ['earbuds'], stats: { performance: 78, appeal: 80 }, unlockTech: 'audio-planar' },
  { id: 'audio-spatial',  name: 'Spatial Audio',    slot: 'audio', tier: 4, cost: 80, categories: ['earbuds', 'smarttv'], stats: { performance: 92, appeal: 88 }, unlockTech: 'audio-spatial' },
  { id: 'audio-tv-basic', name: '2.0 Stereo',       slot: 'audio', tier: 1, cost: 15, categories: ['smarttv'], stats: { performance: 30, appeal: 25 } },
  { id: 'audio-tv-surround', name: '5.1 Surround',  slot: 'audio', tier: 2, cost: 40, categories: ['smarttv'], stats: { performance: 60, appeal: 55 }, unlockTech: 'audio-hifi' },
  { id: 'audio-anc',      name: 'Active Noise Cancel', slot: 'audio', tier: 3, cost: 35, categories: ['earbuds'], stats: { performance: 65, appeal: 72 }, unlockTech: 'audio-anc' },

  // ── CONNECTIVITY ─────────────────────────────────────────────────────────
  { id: 'conn-4g',        name: '4G LTE',           slot: 'connectivity', tier: 1, cost: 10, categories: ['smartphone', 'tablet', 'smartwatch'], stats: { performance: 20, appeal: 22 } },
  { id: 'conn-5g',        name: '5G mmWave',        slot: 'connectivity', tier: 3, cost: 35, categories: ['smartphone', 'tablet', 'smartwatch'], stats: { performance: 55, appeal: 50 }, unlockTech: 'conn-5g' },
  { id: 'conn-6g',        name: '6G Prototype',     slot: 'connectivity', tier: 5, cost: 80, categories: ['smartphone', 'tablet'], stats: { performance: 85, appeal: 70 }, unlockTech: 'conn-6g' },
  { id: 'conn-wifi6',     name: 'Wi-Fi 6E',         slot: 'connectivity', tier: 2, cost: 12, categories: ['laptop', 'smarttv', 'tablet'], stats: { performance: 38, appeal: 30 }, unlockTech: 'conn-wifi6' },
  { id: 'conn-wifi7',     name: 'Wi-Fi 7',          slot: 'connectivity', tier: 4, cost: 28, categories: ['laptop', 'smarttv', 'tablet'], stats: { performance: 68, appeal: 52 }, unlockTech: 'conn-wifi7' },
  { id: 'conn-bt-basic',  name: 'Bluetooth 5.0',    slot: 'connectivity', tier: 1, cost: 5,  categories: ['earbuds'], stats: { performance: 28, appeal: 20 } },
  { id: 'conn-bt-le',     name: 'Bluetooth 5.3 LE', slot: 'connectivity', tier: 3, cost: 15, categories: ['earbuds', 'smartwatch'], stats: { performance: 55, appeal: 42 }, unlockTech: 'conn-bt5' },
];

export const STARTER_COMPONENTS = [
  'lcd-basic', 'cpu-entry', 'ram-2gb', 'cam-basic', 'cam-webcam', 'cam-watch',
  'bat-small', 'bat-watch', 'bat-earbuds', 'bat-tv', 'stor-64',
  'chassis-plastic', 'audio-basic', 'conn-4g', 'conn-bt-basic',
  'cam-none-tv', 'lcd-tablet', 'lcd-tv', 'cpu-tv', 'ram-tv', 'ram-earbuds',
  'stor-tv', 'audio-tv-basic',
];

export const SLOTS_BY_CATEGORY: Record<DeviceCategory, ComponentSlot[]> = {
  smartphone:  ['screen', 'cpu', 'ram', 'camera', 'battery', 'storage', 'chassis', 'connectivity'],
  laptop:      ['screen', 'cpu', 'ram', 'camera', 'battery', 'storage', 'chassis', 'connectivity'],
  smartwatch:  ['screen', 'cpu', 'ram', 'battery', 'chassis', 'connectivity'],
  tablet:      ['screen', 'cpu', 'ram', 'camera', 'battery', 'storage', 'chassis', 'connectivity'],
  earbuds:     ['audio', 'ram', 'battery', 'chassis', 'connectivity'],
  smarttv:     ['screen', 'cpu', 'ram', 'camera', 'battery', 'storage', 'chassis', 'audio'],
};

export const CATEGORY_META: Record<DeviceCategory, { label: string; icon: string; baseDemand: number; priceSensitivity: number; color: string }> = {
  smartphone:  { label: 'Smartphone',  icon: '📱', baseDemand: 1.2, priceSensitivity: 0.85, color: '#3b82f6' },
  laptop:      { label: 'Laptop',      icon: '💻', baseDemand: 0.9, priceSensitivity: 0.75, color: '#8b5cf6' },
  smartwatch:  { label: 'Smartwatch',  icon: '⌚', baseDemand: 1.0, priceSensitivity: 0.90, color: '#10b981' },
  tablet:      { label: 'Tablet',      icon: '🖥️', baseDemand: 0.8, priceSensitivity: 0.80, color: '#f59e0b' },
  earbuds:     { label: 'Earbuds',     icon: '🎧', baseDemand: 1.3, priceSensitivity: 0.95, color: '#ec4899' },
  smarttv:     { label: 'Smart TV',    icon: '📺', baseDemand: 0.7, priceSensitivity: 0.70, color: '#06b6d4' },
};
