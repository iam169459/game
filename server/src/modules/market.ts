/**
 * ═══════════════════════════════════════════════════════════════════
 *  MODULE B: MARKET, BLUEPRINTS & DEVICES
 * ═══════════════════════════════════════════════════════════════════
 *  Static market registry with blueprint IP and device crafting.
 *  All purchases are validated and atomic.
 */

import { playerStore } from '../store/playerStore';
import { createOwnedDevice } from '../types';
import type {
  Blueprint,
  DeviceDefinition,
  EmployeeTypeDefinition,
  EmployeeType,
  TransactionResult,
} from '../types';

// ─── Static Market Registry ──────────────────────────────────────

export const BLUEPRINTS: Blueprint[] = [
  {
    id: 'bp-smartphone',
    name: 'Smartphone Blueprint',
    description: 'IP rights to manufacture smartphones. Entry-level consumer electronics.',
    purchaseCost: 500,
    category: 'electronics',
    tier: 1,
  },
  {
    id: 'bp-laptop',
    name: 'Laptop Blueprint',
    description: 'IP rights to manufacture laptops. Mid-range computing devices.',
    purchaseCost: 1200,
    category: 'electronics',
    tier: 2,
  },
  {
    id: 'bp-smartwatch',
    name: 'Smartwatch Blueprint',
    description: 'IP rights to manufacture smartwatches. Wearable technology.',
    purchaseCost: 800,
    category: 'wearables',
    tier: 2,
  },
  {
    id: 'bp-tablet',
    name: 'Tablet Blueprint',
    description: 'IP rights to manufacture tablets. Portable computing.',
    purchaseCost: 1000,
    category: 'electronics',
    tier: 2,
  },
  {
    id: 'bp-server',
    name: 'Server Blueprint',
    description: 'IP rights to manufacture rack servers. Enterprise infrastructure.',
    purchaseCost: 3000,
    category: 'infrastructure',
    tier: 3,
  },
  {
    id: 'bp-gpu',
    name: 'GPU Blueprint',
    description: 'IP rights to manufacture graphics processors. High-demand silicon.',
    purchaseCost: 5000,
    category: 'components',
    tier: 4,
  },
  {
    id: 'bp-quantum',
    name: 'Quantum Chip Blueprint',
    description: 'IP rights to manufacture quantum processing units. bleeding-edge tech.',
    purchaseCost: 15000,
    category: 'advanced',
    tier: 5,
  },
];

export const DEVICES: DeviceDefinition[] = [
  {
    id: 'dev-smartphone-basic',
    name: 'Basic Smartphone',
    description: 'Entry-level smartphone for mass market.',
    blueprintId: 'bp-smartphone',
    craftingCost: 150,
    passiveIncomePerTick: 2.5,
    category: 'electronics',
    tier: 1,
  },
  {
    id: 'dev-smartphone-pro',
    name: 'Pro Smartphone',
    description: 'Premium smartphone with advanced features.',
    blueprintId: 'bp-smartphone',
    craftingCost: 400,
    passiveIncomePerTick: 8.0,
    category: 'electronics',
    tier: 2,
  },
  {
    id: 'dev-laptop-standard',
    name: 'Standard Laptop',
    description: 'Reliable laptop for everyday use.',
    blueprintId: 'bp-laptop',
    craftingCost: 350,
    passiveIncomePerTick: 6.0,
    category: 'electronics',
    tier: 2,
  },
  {
    id: 'dev-laptop-workstation',
    name: 'Workstation Laptop',
    description: 'High-performance laptop for professionals.',
    blueprintId: 'bp-laptop',
    craftingCost: 900,
    passiveIncomePerTick: 18.0,
    category: 'electronics',
    tier: 3,
  },
  {
    id: 'dev-smartwatch-fit',
    name: 'Fit Tracker',
    description: 'Basic fitness tracking smartwatch.',
    blueprintId: 'bp-smartwatch',
    craftingCost: 200,
    passiveIncomePerTick: 4.0,
    category: 'wearables',
    tier: 1,
  },
  {
    id: 'dev-smartwatch-ultra',
    name: 'Ultra Watch',
    description: 'Premium smartwatch with health monitoring.',
    blueprintId: 'bp-smartwatch',
    craftingCost: 600,
    passiveIncomePerTick: 12.0,
    category: 'wearables',
    tier: 3,
  },
  {
    id: 'dev-tablet-air',
    name: 'Tablet Air',
    description: 'Lightweight tablet for content consumption.',
    blueprintId: 'bp-tablet',
    craftingCost: 300,
    passiveIncomePerTick: 5.5,
    category: 'electronics',
    tier: 2,
  },
  {
    id: 'dev-tablet-pro',
    name: 'Tablet Pro',
    description: 'Professional tablet with stylus support.',
    blueprintId: 'bp-tablet',
    craftingCost: 700,
    passiveIncomePerTick: 14.0,
    category: 'electronics',
    tier: 3,
  },
  {
    id: 'dev-server-rack',
    name: 'Rack Server',
    description: 'Enterprise-grade rack server.',
    blueprintId: 'bp-server',
    craftingCost: 2000,
    passiveIncomePerTick: 45.0,
    category: 'infrastructure',
    tier: 3,
  },
  {
    id: 'dev-server-cluster',
    name: 'Server Cluster',
    description: 'Multi-node server cluster for heavy workloads.',
    blueprintId: 'bp-server',
    craftingCost: 8000,
    passiveIncomePerTick: 200.0,
    category: 'infrastructure',
    tier: 4,
  },
  {
    id: 'dev-gpu-mid',
    name: 'Mid-Range GPU',
    description: 'Consumer graphics card.',
    blueprintId: 'bp-gpu',
    craftingCost: 1500,
    passiveIncomePerTick: 35.0,
    category: 'components',
    tier: 3,
  },
  {
    id: 'dev-gpu-flagship',
    name: 'Flagship GPU',
    description: 'Top-tier graphics processor for AI and gaming.',
    blueprintId: 'bp-gpu',
    craftingCost: 5000,
    passiveIncomePerTick: 120.0,
    category: 'components',
    tier: 5,
  },
  {
    id: 'dev-quantum-core',
    name: 'Quantum Core',
    description: 'Experimental quantum processing unit.',
    blueprintId: 'bp-quantum',
    craftingCost: 12000,
    passiveIncomePerTick: 500.0,
    category: 'advanced',
    tier: 5,
  },
];

export const EMPLOYEE_TYPES: EmployeeTypeDefinition[] = [
  {
    type: 'engineer',
    label: 'Engineer',
    hireCost: 300,
    baseSalaryRate: 5.0,
    efficiencyMultiplier: 1.25,
    description: 'Boosts device income by 25%. Essential for high-tier production.',
  },
  {
    type: 'technician',
    label: 'Technician',
    hireCost: 150,
    baseSalaryRate: 2.5,
    efficiencyMultiplier: 1.10,
    description: 'Boosts device income by 10%. Affordable workforce entry point.',
  },
  {
    type: 'salesperson',
    label: 'Salesperson',
    hireCost: 200,
    baseSalaryRate: 3.5,
    efficiencyMultiplier: 1.15,
    description: 'Boosts device income by 15%. Good balance of cost and output.',
  },
  {
    type: 'manager',
    label: 'Manager',
    hireCost: 500,
    baseSalaryRate: 8.0,
    efficiencyMultiplier: 1.40,
    description: 'Boosts device income by 40%. Premium workforce option.',
  },
];

// ─── Helper Lookups ──────────────────────────────────────────────

export function getBlueprint(id: string): Blueprint | undefined {
  return BLUEPRINTS.find((bp) => bp.id === id);
}

export function getDevice(id: string): DeviceDefinition | undefined {
  return DEVICES.find((d) => d.id === id);
}

export function getEmployeeType(type: EmployeeType): EmployeeTypeDefinition | undefined {
  return EMPLOYEE_TYPES.find((et) => et.type === type);
}

export function getDevicesForBlueprint(blueprintId: string): DeviceDefinition[] {
  return DEVICES.filter((d) => d.blueprintId === blueprintId);
}

// ─── Purchase Blueprint ──────────────────────────────────────────

export async function purchaseBlueprint(
  playerUuid: string,
  blueprintId: string
): Promise<TransactionResult> {
  const player = playerStore.getByUuid(playerUuid);
  if (!player) {
    return { success: false, message: 'Player not found.' };
  }

  const blueprint = getBlueprint(blueprintId);
  if (!blueprint) {
    return { success: false, message: `Blueprint "${blueprintId}" does not exist.` };
  }

  // Already owned?
  if (player.unlockedBlueprints.includes(blueprintId)) {
    return { success: false, message: `You already own the ${blueprint.name}.` };
  }

  // Sufficient funds?
  if (player.walletBalance < blueprint.purchaseCost) {
    return {
      success: false,
      message: `Insufficient funds. Need $${blueprint.purchaseCost.toFixed(2)}, have $${player.walletBalance.toFixed(2)}.`,
    };
  }

  // Atomic: deduct cost + unlock blueprint
  const updated = await playerStore.atomicUpdate(playerUuid, (p) => {
    if (p.walletBalance < blueprint.purchaseCost) {
      throw new Error('INSUFFICIENT_FUNDS');
    }
    p.walletBalance = Math.round((p.walletBalance - blueprint.purchaseCost) * 100) / 100;
    p.unlockedBlueprints.push(blueprintId);
    p.lastActiveAt = Date.now();
    return p;
  });

  if (!updated) {
    return { success: false, message: 'Purchase failed.' };
  }

  return {
    success: true,
    message: `Unlocked ${blueprint.name} for $${blueprint.purchaseCost.toFixed(2)}.`,
    data: {
      blueprintId,
      blueprintName: blueprint.name,
      remainingBalance: updated.walletBalance,
    },
  };
}

// ─── Craft Device ────────────────────────────────────────────────

export async function craftDevice(
  playerUuid: string,
  deviceId: string
): Promise<TransactionResult> {
  const player = playerStore.getByUuid(playerUuid);
  if (!player) {
    return { success: false, message: 'Player not found.' };
  }

  const deviceDef = getDevice(deviceId);
  if (!deviceDef) {
    return { success: false, message: `Device "${deviceId}" does not exist in the market.` };
  }

  // Check blueprint ownership
  if (!player.unlockedBlueprints.includes(deviceDef.blueprintId)) {
    const bp = getBlueprint(deviceDef.blueprintId);
    return {
      success: false,
      message: `Blueprint locked. Purchase the ${bp?.name ?? deviceDef.blueprintId} first.`,
    };
  }

  // Sufficient funds?
  if (player.walletBalance < deviceDef.craftingCost) {
    return {
      success: false,
      message: `Insufficient funds. Crafting costs $${deviceDef.craftingCost.toFixed(2)}, you have $${player.walletBalance.toFixed(2)}.`,
    };
  }

  // Atomic: deduct cost + add device instance
  const newDevice = createOwnedDevice(deviceId);

  const updated = await playerStore.atomicUpdate(playerUuid, (p) => {
    if (p.walletBalance < deviceDef.craftingCost) {
      throw new Error('INSUFFICIENT_FUNDS');
    }
    p.walletBalance = Math.round((p.walletBalance - deviceDef.craftingCost) * 100) / 100;
    p.ownedDevices.push(newDevice);
    p.lastActiveAt = Date.now();
    return p;
  });

  if (!updated) {
    return { success: false, message: 'Crafting failed.' };
  }

  return {
    success: true,
    message: `Crafted ${deviceDef.name} for $${deviceDef.craftingCost.toFixed(2)}.`,
    data: {
      instanceId: newDevice.instanceId,
      deviceName: deviceDef.name,
      status: newDevice.status,
      remainingBalance: updated.walletBalance,
    },
  };
}

// ─── Get Market Catalog ──────────────────────────────────────────

export function getMarketCatalog(): {
  blueprints: Blueprint[];
  devices: DeviceDefinition[];
  employeeTypes: EmployeeTypeDefinition[];
} {
  return {
    blueprints: BLUEPRINTS,
    devices: DEVICES,
    employeeTypes: EMPLOYEE_TYPES,
  };
}
