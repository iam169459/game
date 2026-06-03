/**
 * ═══════════════════════════════════════════════════════════════════
 *  BLUEPRINT & DEVICE MECHANICS FRAMEWORK
 * ═══════════════════════════════════════════════════════════════════
 *  Static market registry with blueprint IP purchases and device
 *  crafting. All operations are atomic and validated.
 *  
 *  Features:
 *    - Static registry: Blueprints (IP) + Devices (assets)
 *    - purchaseBlueprint(): deduct funds, unlock IP permanently
 *    - buildDevice(): validate blueprint ownership, spawn instance
 *    - Robust error messages for all edge cases
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

// ═════════════════════════════════════════════════════════════════
//  SECTION 1: DATA STRUCTURES
// ═════════════════════════════════════════════════════════════════

/** Blueprint = Intellectual Property. One-time purchase to unlock crafting rights. */
export interface Blueprint {
  id: string;
  name: string;
  description: string;
  cost: number;
  tier: number;           // 1-5 rarity
  category: string;
}

/** Device Definition = Template for crafting. Tied to a blueprint. */
export interface DeviceDefinition {
  id: string;
  name: string;
  description: string;
  blueprintId: string;    // Must own this blueprint to craft
  craftingCost: number;   // Per-unit cost
  productionRate: number; // Passive income per tick
  tier: number;
  category: string;
}

/** Owned Device Instance = Unique asset owned by a player. */
export interface OwnedDevice {
  instanceId: string;     // UUID, unique per crafted unit
  definitionId: string;   // References DeviceDefinition.id
  status: 'idle' | 'active';
  createdAt: number;
}

/** Player profile (minimal for this module). */
export interface PlayerProfile {
  uuid: string;
  username: string;
  walletBalance: number;
  unlockedBlueprints: string[];  // Blueprint IDs owned
  ownedDevices: OwnedDevice[];   // Crafted device instances
}

/** Standard result type for all operations. */
export interface MarketResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 2: STATIC MARKET REGISTRY
// ═════════════════════════════════════════════════════════════════

export const BLUEPRINTS: Blueprint[] = [
  {
    id: 'bp-smartphone',
    name: 'Smartphone Blueprint',
    description: 'Manufacturing rights for consumer smartphones.',
    cost: 500,
    tier: 1,
    category: 'electronics',
  },
  {
    id: 'bp-laptop',
    name: 'Laptop Blueprint',
    description: 'Manufacturing rights for laptop computers.',
    cost: 1200,
    tier: 2,
    category: 'electronics',
  },
  {
    id: 'bp-smartwatch',
    name: 'Smartwatch Blueprint',
    description: 'Manufacturing rights for wearable smartwatches.',
    cost: 800,
    tier: 2,
    category: 'wearables',
  },
  {
    id: 'bp-tablet',
    name: 'Tablet Blueprint',
    description: 'Manufacturing rights for tablet devices.',
    cost: 1000,
    tier: 2,
    category: 'electronics',
  },
  {
    id: 'bp-server',
    name: 'Server Blueprint',
    description: 'Manufacturing rights for enterprise rack servers.',
    cost: 3000,
    tier: 3,
    category: 'infrastructure',
  },
  {
    id: 'bp-gpu',
    name: 'GPU Blueprint',
    description: 'Manufacturing rights for graphics processing units.',
    cost: 5000,
    tier: 4,
    category: 'components',
  },
  {
    id: 'bp-quantum',
    name: 'Quantum Chip Blueprint',
    description: 'Manufacturing rights for quantum processing units.',
    cost: 15000,
    tier: 5,
    category: 'advanced',
  },
];

export const DEVICES: DeviceDefinition[] = [
  // ── Smartphone devices ──
  {
    id: 'dev-smartphone-basic',
    name: 'Basic Smartphone',
    description: 'Entry-level smartphone for mass market.',
    blueprintId: 'bp-smartphone',
    craftingCost: 150,
    productionRate: 2.5,
    tier: 1,
    category: 'electronics',
  },
  {
    id: 'dev-smartphone-pro',
    name: 'Pro Smartphone',
    description: 'Premium smartphone with advanced features.',
    blueprintId: 'bp-smartphone',
    craftingCost: 400,
    productionRate: 8.0,
    tier: 2,
    category: 'electronics',
  },
  {
    id: 'dev-smartphone-ultra',
    name: 'Ultra Smartphone',
    description: 'Flagship smartphone with cutting-edge specs.',
    blueprintId: 'bp-smartphone',
    craftingCost: 900,
    productionRate: 18.0,
    tier: 3,
    category: 'electronics',
  },

  // ── Laptop devices ──
  {
    id: 'dev-laptop-standard',
    name: 'Standard Laptop',
    description: 'Reliable laptop for everyday use.',
    blueprintId: 'bp-laptop',
    craftingCost: 350,
    productionRate: 6.0,
    tier: 2,
    category: 'electronics',
  },
  {
    id: 'dev-laptop-workstation',
    name: 'Workstation Laptop',
    description: 'High-performance laptop for professionals.',
    blueprintId: 'bp-laptop',
    craftingCost: 900,
    productionRate: 18.0,
    tier: 3,
    category: 'electronics',
  },

  // ── Smartwatch devices ──
  {
    id: 'dev-smartwatch-fit',
    name: 'Fit Tracker',
    description: 'Basic fitness tracking smartwatch.',
    blueprintId: 'bp-smartwatch',
    craftingCost: 200,
    productionRate: 4.0,
    tier: 1,
    category: 'wearables',
  },
  {
    id: 'dev-smartwatch-ultra',
    name: 'Ultra Watch',
    description: 'Premium smartwatch with health monitoring.',
    blueprintId: 'bp-smartwatch',
    craftingCost: 600,
    productionRate: 12.0,
    tier: 3,
    category: 'wearables',
  },

  // ── Tablet devices ──
  {
    id: 'dev-tablet-air',
    name: 'Tablet Air',
    description: 'Lightweight tablet for content consumption.',
    blueprintId: 'bp-tablet',
    craftingCost: 300,
    productionRate: 5.5,
    tier: 2,
    category: 'electronics',
  },
  {
    id: 'dev-tablet-pro',
    name: 'Tablet Pro',
    description: 'Professional tablet with stylus support.',
    blueprintId: 'bp-tablet',
    craftingCost: 700,
    productionRate: 14.0,
    tier: 3,
    category: 'electronics',
  },

  // ── Server devices ──
  {
    id: 'dev-server-rack',
    name: 'Rack Server',
    description: 'Enterprise-grade rack server.',
    blueprintId: 'bp-server',
    craftingCost: 2000,
    productionRate: 45.0,
    tier: 3,
    category: 'infrastructure',
  },
  {
    id: 'dev-server-cluster',
    name: 'Server Cluster',
    description: 'Multi-node cluster for heavy workloads.',
    blueprintId: 'bp-server',
    craftingCost: 8000,
    productionRate: 200.0,
    tier: 4,
    category: 'infrastructure',
  },

  // ── GPU devices ──
  {
    id: 'dev-gpu-mid',
    name: 'Mid-Range GPU',
    description: 'Consumer graphics card.',
    blueprintId: 'bp-gpu',
    craftingCost: 1500,
    productionRate: 35.0,
    tier: 3,
    category: 'components',
  },
  {
    id: 'dev-gpu-flagship',
    name: 'Flagship GPU',
    description: 'Top-tier processor for AI and gaming.',
    blueprintId: 'bp-gpu',
    craftingCost: 5000,
    productionRate: 120.0,
    tier: 5,
    category: 'components',
  },

  // ── Quantum devices ──
  {
    id: 'dev-quantum-core',
    name: 'Quantum Core',
    description: 'Experimental quantum processing unit.',
    blueprintId: 'bp-quantum',
    craftingCost: 12000,
    productionRate: 500.0,
    tier: 5,
    category: 'advanced',
  },
];

// ═════════════════════════════════════════════════════════════════
//  SECTION 3: LOOKUP HELPERS
// ═════════════════════════════════════════════════════════════════

export function getBlueprint(id: string): Blueprint | undefined {
  return BLUEPRINTS.find((bp) => bp.id === id);
}

export function getDevice(id: string): DeviceDefinition | undefined {
  return DEVICES.find((d) => d.id === id);
}

export function getDevicesByBlueprint(blueprintId: string): DeviceDefinition[] {
  return DEVICES.filter((d) => d.blueprintId === blueprintId);
}

export function getBlueprintsByCategory(category: string): Blueprint[] {
  return BLUEPRINTS.filter((bp) => bp.category === category);
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 4: PERSISTENT STORE (player data)
// ═════════════════════════════════════════════════════════════════

const DATA_DIR = join(process.cwd(), 'data');
const PLAYERS_FILE = join(DATA_DIR, 'market_players.json');

class PlayerStore {
  private players: Map<string, PlayerProfile> = new Map();
  private usernameIndex: Map<string, string> = new Map();
  private dirty = false;
  private writeLock = false;

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      if (existsSync(PLAYERS_FILE)) {
        const data: PlayerProfile[] = JSON.parse(readFileSync(PLAYERS_FILE, 'utf-8'));
        for (const p of data) {
          this.players.set(p.uuid, p);
          this.usernameIndex.set(p.username.toLowerCase(), p.uuid);
        }
        console.log(`[Store] Loaded ${data.length} players.`);
      }
    } catch (err) {
      console.error('[Store] Load error:', err);
    }
  }

  save(): void {
    if (!this.dirty) return;
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(PLAYERS_FILE, JSON.stringify(Array.from(this.players.values()), null, 2));
      this.dirty = false;
    } catch (err) {
      console.error('[Store] Save error:', err);
    }
  }

  private async lock(): Promise<void> {
    while (this.writeLock) await new Promise((r) => setTimeout(r, 1));
    this.writeLock = true;
  }

  private unlock(): void {
    this.writeLock = false;
  }

  getByUuid(uuid: string): PlayerProfile | null {
    const p = this.players.get(uuid);
    return p ? JSON.parse(JSON.stringify(p)) : null;
  }

  async update(uuid: string, fn: (p: PlayerProfile) => PlayerProfile): Promise<PlayerProfile | null> {
    await this.lock();
    try {
      const p = this.players.get(uuid);
      if (!p) return null;
      const clone: PlayerProfile = JSON.parse(JSON.stringify(p));
      const updated = fn(clone);
      this.players.set(uuid, updated);
      this.dirty = true;
      return JSON.parse(JSON.stringify(updated));
    } finally {
      this.unlock();
    }
  }

  async insert(profile: PlayerProfile): Promise<void> {
    await this.lock();
    try {
      this.players.set(profile.uuid, profile);
      this.usernameIndex.set(profile.username.toLowerCase(), profile.uuid);
      this.dirty = true;
    } finally {
      this.unlock();
    }
  }
}

export const store = new PlayerStore();
setInterval(() => store.save(), 30_000);
process.on('SIGINT', () => { store.save(); process.exit(0); });

// ═════════════════════════════════════════════════════════════════
//  SECTION 5: CORE FUNCTIONS
// ═════════════════════════════════════════════════════════════════

/**
 * purchaseBlueprint(playerUuid, blueprintId)
 * 
 * Validates the player's wallet balance, deducts the cost, and
 * permanently unlocks the blueprint in their profile.
 * 
 * Error cases:
 *   - "Blueprint not found"        — invalid blueprintId
 *   - "Already owned"              — player already has this blueprint
 *   - "Insufficient funds"         — wallet < blueprint cost
 *   - "Player not found"           — invalid playerUuid
 */
export async function purchaseBlueprint(
  playerUuid: string,
  blueprintId: string
): Promise<MarketResult> {
  // ── Validate player ──
  const player = store.getByUuid(playerUuid);
  if (!player) {
    return { success: false, message: 'Player not found.' };
  }

  // ── Validate blueprint ──
  const blueprint = getBlueprint(blueprintId);
  if (!blueprint) {
    return {
      success: false,
      message: `Blueprint "${blueprintId}" not found in the market registry.`,
    };
  }

  // ── Check ownership ──
  if (player.unlockedBlueprints.includes(blueprintId)) {
    return {
      success: false,
      message: `You already own the ${blueprint.name}. No need to purchase again.`,
    };
  }

  // ── Validate funds ──
  if (player.walletBalance < blueprint.cost) {
    return {
      success: false,
      message: `Insufficient funds. ${blueprint.name} costs $${blueprint.cost.toFixed(2)}, your balance is $${player.walletBalance.toFixed(2)}.`,
    };
  }

  // ── Atomic: deduct cost + unlock blueprint ──
  const updated = await store.update(playerUuid, (p) => {
    // Re-check inside lock for race-condition safety
    if (p.walletBalance < blueprint.cost) {
      throw new Error('INSUFFICIENT_FUNDS');
    }
    p.walletBalance = Math.round((p.walletBalance - blueprint.cost) * 100) / 100;
    p.unlockedBlueprints.push(blueprintId);
    return p;
  });

  if (!updated) {
    return { success: false, message: 'Purchase failed due to a system error.' };
  }

  return {
    success: true,
    message: `${blueprint.name} unlocked for $${blueprint.cost.toFixed(2)}. You can now craft associated devices.`,
    data: {
      blueprintId,
      blueprintName: blueprint.name,
      cost: blueprint.cost,
      remainingBalance: updated.walletBalance,
    },
  };
}

/**
 * buildDevice(playerUuid, deviceId)
 * 
 * Checks if the player has unlocked the required blueprint.
 * If true, deducts the crafting cost and spawns a unique device
 * instance into the player's active assets list.
 * 
 * Error cases:
 *   - "Device not found"           — invalid deviceId
 *   - "Blueprint locked"           — player doesn't own the required blueprint
 *   - "Insufficient funds"         — wallet < crafting cost
 *   - "Player not found"           — invalid playerUuid
 */
export async function buildDevice(
  playerUuid: string,
  deviceId: string
): Promise<MarketResult> {
  // ── Validate player ──
  const player = store.getByUuid(playerUuid);
  if (!player) {
    return { success: false, message: 'Player not found.' };
  }

  // ── Validate device definition ──
  const deviceDef = getDevice(deviceId);
  if (!deviceDef) {
    return {
      success: false,
      message: `Device "${deviceId}" not found in the market registry.`,
    };
  }

  // ── Check blueprint ownership ──
  if (!player.unlockedBlueprints.includes(deviceDef.blueprintId)) {
    const blueprint = getBlueprint(deviceDef.blueprintId);
    return {
      success: false,
      message: `Blueprint locked. You must purchase the ${blueprint?.name ?? deviceDef.blueprintId} before crafting ${deviceDef.name}.`,
    };
  }

  // ── Validate funds ──
  if (player.walletBalance < deviceDef.craftingCost) {
    return {
      success: false,
      message: `Insufficient funds. ${deviceDef.name} costs $${deviceDef.craftingCost.toFixed(2)} to craft, your balance is $${player.walletBalance.toFixed(2)}.`,
    };
  }

  // ── Create unique device instance ──
  const newDevice: OwnedDevice = {
    instanceId: randomUUID(),
    definitionId: deviceId,
    status: 'idle',
    createdAt: Date.now(),
  };

  // ── Atomic: deduct cost + add device ──
  const updated = await store.update(playerUuid, (p) => {
    // Re-check inside lock
    if (p.walletBalance < deviceDef.craftingCost) {
      throw new Error('INSUFFICIENT_FUNDS');
    }
    p.walletBalance = Math.round((p.walletBalance - deviceDef.craftingCost) * 100) / 100;
    p.ownedDevices.push(newDevice);
    return p;
  });

  if (!updated) {
    return { success: false, message: 'Crafting failed due to a system error.' };
  }

  return {
    success: true,
    message: `${deviceDef.name} crafted for $${deviceDef.craftingCost.toFixed(2)}. Instance ID: ${newDevice.instanceId.slice(0, 8)}...`,
    data: {
      instanceId: newDevice.instanceId,
      deviceName: deviceDef.name,
      blueprintName: getBlueprint(deviceDef.blueprintId)?.name,
      craftingCost: deviceDef.craftingCost,
      productionRate: deviceDef.productionRate,
      status: newDevice.status,
      remainingBalance: updated.walletBalance,
    },
  };
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 6: QUERY HELPERS
// ═════════════════════════════════════════════════════════════════

/** Get full market catalog. */
export function getMarketCatalog() {
  return {
    blueprints: BLUEPRINTS,
    devices: DEVICES,
  };
}

/** Get a player's owned devices with full definitions. */
export function getPlayerDevices(playerUuid: string): MarketResult {
  const player = store.getByUuid(playerUuid);
  if (!player) {
    return { success: false, message: 'Player not found.' };
  }

  const devices = player.ownedDevices.map((owned) => {
    const def = getDevice(owned.definitionId);
    return {
      instanceId: owned.instanceId,
      name: def?.name ?? 'Unknown',
      description: def?.description ?? '',
      productionRate: def?.productionRate ?? 0,
      status: owned.status,
      createdAt: owned.createdAt,
    };
  });

  return {
    success: true,
    message: `${devices.length} device(s) owned.`,
    data: devices as unknown as Record<string, unknown>,
  };
}

/** Get a player's unlocked blueprints with full info. */
export function getPlayerBlueprints(playerUuid: string): MarketResult {
  const player = store.getByUuid(playerUuid);
  if (!player) {
    return { success: false, message: 'Player not found.' };
  }

  const blueprints = player.unlockedBlueprints
    .map((id) => getBlueprint(id))
    .filter(Boolean)
    .map((bp) => ({
      id: bp!.id,
      name: bp!.name,
      description: bp!.description,
      tier: bp!.tier,
      category: bp!.category,
      devicesAvailable: getDevicesByBlueprint(bp!.id).length,
    }));

  return {
    success: true,
    message: `${blueprints.length} blueprint(s) unlocked.`,
    data: blueprints as unknown as Record<string, unknown>,
  };
}
