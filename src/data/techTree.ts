import type { TechNode } from '../types';

export const TECH_TREE: TechNode[] = [
  { id: 'lab-crafting', name: 'Part Assembly Lab', description: 'Unlock the Lab for combining parts', cost: 15000, researchDays: 4, prerequisites: [], unlocks: [], effects: { labUnlocked: true } },
  { id: 'display-oled', name: 'OLED Displays', description: 'Unlock OLED screens', cost: 20000, researchDays: 5, prerequisites: [], unlocks: ['oled-mid', 'amoled-watch'] },
  { id: 'display-2k', name: '2K Panels', description: 'High-res displays', cost: 40000, researchDays: 7, prerequisites: ['display-oled'], unlocks: ['oled-pro'] },
  { id: 'display-4k', name: '4K Mini-LED', description: 'Flagship displays', cost: 75000, researchDays: 10, prerequisites: ['display-2k'], unlocks: ['mini-led'] },
  { id: 'chip-7nm', name: '7nm Process', description: 'Mid-tier CPUs', cost: 25000, researchDays: 6, prerequisites: [], unlocks: ['cpu-mid', 'cpu-watch'], effects: { factorySpeed: 0.05 } },
  { id: 'chip-5nm', name: '5nm Neural Core', description: 'Pro processors', cost: 55000, researchDays: 8, prerequisites: ['chip-7nm'], unlocks: ['cpu-pro'] },
  { id: 'chip-3nm', name: '3nm Fusion', description: 'Flagship chips', cost: 95000, researchDays: 12, prerequisites: ['chip-5nm'], unlocks: ['cpu-ultra'] },
  { id: 'ram-4gb', name: '4GB LPDDR5', description: 'Mid-range memory', cost: 10000, researchDays: 3, prerequisites: [], unlocks: ['ram-4gb'] },
  { id: 'ram-8gb', name: '8GB LPDDR5X', description: 'High-speed memory', cost: 30000, researchDays: 5, prerequisites: ['ram-4gb'], unlocks: ['ram-8gb'] },
  { id: 'ram-16gb', name: '16GB DDR5', description: 'Flagship memory', cost: 60000, researchDays: 8, prerequisites: ['ram-8gb'], unlocks: ['ram-16gb'] },
  { id: 'camera-dual', name: 'Dual Camera', description: 'Multi-lens systems', cost: 18000, researchDays: 4, prerequisites: [], unlocks: ['cam-dual'] },
  { id: 'camera-pro', name: 'Pro Camera Array', description: 'Flagship cameras', cost: 48000, researchDays: 7, prerequisites: ['camera-dual'], unlocks: ['cam-triple'] },
  { id: 'battery-fast', name: 'Fast Charge', description: 'Better batteries', cost: 15000, researchDays: 4, prerequisites: [], unlocks: ['bat-mid'] },
  { id: 'battery-graphene', name: 'Graphene Cells', description: 'Flagship batteries', cost: 52000, researchDays: 7, prerequisites: ['battery-fast'], unlocks: ['bat-large'] },
  { id: 'storage-nvme', name: 'NVMe Storage', description: '256GB fast storage', cost: 12000, researchDays: 3, prerequisites: [], unlocks: ['stor-256'] },
  { id: 'storage-1tb', name: '1TB SSD Pro', description: 'Massive fast storage', cost: 45000, researchDays: 6, prerequisites: ['storage-nvme'], unlocks: ['stor-1tb'] },
  { id: 'chassis-premium', name: 'Premium Materials', description: 'Aluminum builds', cost: 10000, researchDays: 3, prerequisites: [], unlocks: ['chassis-alum'] },
  { id: 'chassis-titan', name: 'Titanium Frame', description: 'Flagship chassis', cost: 55000, researchDays: 8, prerequisites: ['chassis-premium'], unlocks: ['chassis-titan'] },
  { id: 'automation-1', name: 'Line Automation', description: '+15% factory speed', cost: 35000, researchDays: 5, prerequisites: ['chip-7nm'], effects: { factorySpeed: 0.15 } },
  { id: 'marketing-ai', name: 'AI Marketing', description: '+20% campaign power', cost: 28000, researchDays: 5, prerequisites: [], effects: { marketingBonus: 0.2 } },
];
