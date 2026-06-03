/**
 * ═══════════════════════════════════════════════════════════════════
 *  EMPLOYEE & DEVICE PRODUCTION LOOP — ADVANCED MECHANICS
 * ═══════════════════════════════════════════════════════════════════
 *  Automated workforce management with:
 *    - Workforce Traits & XP (leveling, random traits, skill growth)
 *    - Device Durability & Maintenance (degradation, repair, halting)
 *    - Supply & Demand Market Logic (dynamic pricing, decay)
 *    - Background tick loop with all systems integrated
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

// ═════════════════════════════════════════════════════════════════
//  SECTION 1: DATA STRUCTURES
// ═════════════════════════════════════════════════════════════════

export type EmployeeType = 'engineer' | 'technician' | 'salesperson' | 'manager';

// ── Worker Traits ────────────────────────────────────────────────

export type WorkerTrait =
  | 'efficient'      // +10% production speed
  | 'expensive'      // +20% salary requirement
  | 'unstable'       // 5% chance to pause production per tick
  | 'diligent'       // +15% XP gain
  | 'resilient'      // -50% device durability loss when assigned
  | 'lazy'           // -10% production speed
  | 'veteran'        // +5% efficiency per level (instead of 3%)
  | 'trainee';       // -15% salary, +20% XP gain

export interface WorkerTraitConfig {
  trait: WorkerTrait;
  label: string;
  description: string;
  salaryModifier: number;      // Multiplier on base salary (1.0 = no change)
  efficiencyModifier: number;  // Multiplier on efficiency (1.0 = no change)
  xpGainModifier: number;      // Multiplier on XP earned (1.0 = no change)
  durabilityModifier: number;  // Multiplier on durability loss (1.0 = no change)
  pauseChance: number;         // 0-1, chance to pause production per tick
}

// ── Employee (enhanced) ──────────────────────────────────────────

export interface Employee {
  workerId: string;
  type: EmployeeType;
  baseSalaryPerTick: number;
  assignedDeviceId: string | null;
  hiredAt: number;
  // ── NEW: Traits & XP ──
  trait: WorkerTrait;
  level: number;
  xp: number;
  xpToNextLevel: number;
  isPaused: boolean;           // Set by 'unstable' trait
}

// ── Device Instance (enhanced) ───────────────────────────────────

export interface DeviceInstance {
  instanceId: string;
  definitionId: string;
  name: string;
  status: 'idle' | 'operating' | 'maintenance';
  baseProductionRate: number;
  assignedWorkerId: string | null;
  // ── NEW: Durability ──
  durability: number;          // 0-100, default 100
  maxDurability: number;
  totalTicksOperated: number;
}

// ── Player Profile ───────────────────────────────────────────────

export interface PlayerProfile {
  uuid: string;
  username: string;
  walletBalance: number;
  employees: Employee[];
  devices: DeviceInstance[];
}

// ── Market Pricing (global state) ────────────────────────────────

export interface MarketPricingState {
  /** Map of blueprintId → current price multiplier (1.0 = base price) */
  priceMultipliers: Record<string, number>;
  /** Map of blueprintId → last purchase timestamp */
  lastPurchaseTimes: Record<string, number>;
  /** Global game hour counter for decay calculation */
  gameHour: number;
}

// ── Result Types ─────────────────────────────────────────────────

export interface LoopResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface TickReport {
  timestamp: number;
  playersProcessed: number;
  totalSalariesDeducted: number;
  totalIncomeGenerated: number;
  totalXpAwarded: number;
  totalDurabilityLost: number;
  bankruptciesTriggered: number;
  traitsTriggered: number;
  marketPriceChanges: number;
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 2: STATIC CONFIGURATION
// ═════════════════════════════════════════════════════════════════

// ── Employee Types ───────────────────────────────────────────────

export const EMPLOYEE_TYPES: Array<{
  type: EmployeeType;
  label: string;
  hireCost: number;
  baseSalaryPerTick: number;
  baseEfficiency: number;
  description: string;
}> = [
  {
    type: 'engineer',
    label: 'Engineer',
    hireCost: 300,
    baseSalaryPerTick: 5.0,
    baseEfficiency: 1.25,
    description: 'Boosts device income by 25%. Essential for high-tier production.',
  },
  {
    type: 'technician',
    label: 'Technician',
    hireCost: 150,
    baseSalaryPerTick: 2.5,
    baseEfficiency: 1.10,
    description: 'Boosts device income by 10%. Affordable entry point.',
  },
  {
    type: 'salesperson',
    label: 'Salesperson',
    hireCost: 200,
    baseSalaryPerTick: 3.5,
    baseEfficiency: 1.15,
    description: 'Boosts device income by 15%. Balanced cost and output.',
  },
  {
    type: 'manager',
    label: 'Manager',
    hireCost: 500,
    baseSalaryPerTick: 8.0,
    baseEfficiency: 1.40,
    description: 'Boosts device income by 40%. Premium option.',
  },
];

// ── Worker Traits ────────────────────────────────────────────────

export const WORKER_TRAITS: WorkerTraitConfig[] = [
  {
    trait: 'efficient',
    label: 'Efficient',
    description: '+10% production speed',
    salaryModifier: 1.0,
    efficiencyModifier: 1.10,
    xpGainModifier: 1.0,
    durabilityModifier: 1.0,
    pauseChance: 0,
  },
  {
    trait: 'expensive',
    label: 'Expensive',
    description: '+20% salary requirement',
    salaryModifier: 1.20,
    efficiencyModifier: 1.0,
    xpGainModifier: 1.0,
    durabilityModifier: 1.0,
    pauseChance: 0,
  },
  {
    trait: 'unstable',
    label: 'Unstable',
    description: '5% chance to pause production each tick',
    salaryModifier: 0.9,
    efficiencyModifier: 1.05,
    xpGainModifier: 1.0,
    durabilityModifier: 1.0,
    pauseChance: 0.05,
  },
  {
    trait: 'diligent',
    label: 'Diligent',
    description: '+15% XP gain rate',
    salaryModifier: 1.10,
    efficiencyModifier: 1.0,
    xpGainModifier: 1.15,
    durabilityModifier: 1.0,
    pauseChance: 0,
  },
  {
    trait: 'resilient',
    label: 'Resilient',
    description: '-50% device durability loss when assigned',
    salaryModifier: 1.05,
    efficiencyModifier: 0.95,
    xpGainModifier: 1.0,
    durabilityModifier: 0.50,
    pauseChance: 0,
  },
  {
    trait: 'lazy',
    label: 'Lazy',
    description: '-10% production speed',
    salaryModifier: 0.80,
    efficiencyModifier: 0.90,
    xpGainModifier: 0.8,
    durabilityModifier: 1.0,
    pauseChance: 0,
  },
  {
    trait: 'veteran',
    label: 'Veteran',
    description: '+5% efficiency per level (instead of 3%)',
    salaryModifier: 1.15,
    efficiencyModifier: 1.0,
    xpGainModifier: 1.0,
    durabilityModifier: 0.8,
    pauseChance: 0,
  },
  {
    trait: 'trainee',
    label: 'Trainee',
    description: '-15% salary, +20% XP gain',
    salaryModifier: 0.85,
    efficiencyModifier: 0.95,
    xpGainModifier: 1.20,
    durabilityModifier: 1.0,
    pauseChance: 0,
  },
];

// ── Leveling Constants ───────────────────────────────────────────

const XP_PER_CYCLE = 5;
const XP_TO_LEVEL = 100;
const EFFICIENCY_PER_LEVEL = 0.03;      // +3% per level (base)
const SALARY_PER_LEVEL = 0.03;          // +3% salary per level
const VETERAN_EFFICIENCY_BONUS = 0.05;  // +5% per level (veteran trait)

// ── Durability Constants ─────────────────────────────────────────

const DURABILITY_LOSS_PER_TICK = 0.5;
const LOW_DURABILITY_THRESHOLD = 25;    // Below this = 50% income penalty
const LOW_DURABILITY_PENALTY = 0.50;    // 50% income reduction
const ZERO_DURABILITY_HALT = true;      // Halt at 0%
const REPAIR_COST_PER_POINT = 5.0;      // Cost to repair 1 durability point

// ── Market Pricing Constants ─────────────────────────────────────

const PRICE_INCREASE_PER_PURCHASE = 0.01;  // +1% per purchase
const PRICE_MAX_MULTIPLIER = 2.00;         // 200% cap
const PRICE_DECAY_PER_HOUR = 0.005;        // -0.5% per game hour unpurchased
const PRICE_MIN_MULTIPLIER = 1.00;         // Floor at base price

// ── Tick Constants ───────────────────────────────────────────────

const TICK_INTERVAL_MS = 60_000;
const BANKRUPTCY_THRESHOLD = 0;
const MAX_EMPLOYEES = 50;

// ═════════════════════════════════════════════════════════════════
//  SECTION 3: HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════

/** Round to N decimal places. */
function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Get random element from array. */
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Get trait config by trait name. */
function getTraitConfig(trait: WorkerTrait): WorkerTraitConfig {
  return WORKER_TRAITS.find((t) => t.trait === trait)!;
}

/** Get employee type config. */
function getEmployeeTypeConfig(type: EmployeeType) {
  return EMPLOYEE_TYPES.find((et) => et.type === type)!;
}

/** Calculate effective salary (base × trait modifier × level scaling). */
function calcEffectiveSalary(emp: Employee): number {
  const traitConfig = getTraitConfig(emp.trait);
  const levelScaling = 1 + (emp.level - 1) * SALARY_PER_LEVEL;
  return roundTo(emp.baseSalaryPerTick * traitConfig.salaryModifier * levelScaling, 2);
}

/** Calculate effective efficiency (base × trait × level bonus). */
function calcEffectiveEfficiency(emp: Employee): number {
  const typeConfig = getEmployeeTypeConfig(emp.type);
  const traitConfig = getTraitConfig(emp.trait);

  let levelBonus: number;
  if (emp.trait === 'veteran') {
    levelBonus = 1 + (emp.level - 1) * VETERAN_EFFICIENCY_BONUS;
  } else {
    levelBonus = 1 + (emp.level - 1) * EFFICIENCY_PER_LEVEL;
  }

  return roundTo(typeConfig.baseEfficiency * traitConfig.efficiencyModifier * levelBonus, 4);
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 4: PERSISTENT STORE
// ═════════════════════════════════════════════════════════════════

const DATA_DIR = join(process.cwd(), 'data');
const PLAYERS_FILE = join(DATA_DIR, 'advanced_players.json');
const MARKET_FILE = join(DATA_DIR, 'market_pricing.json');

class PlayerStore {
  private players: Map<string, PlayerProfile> = new Map();
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
        for (const p of data) this.players.set(p.uuid, p);
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

  private async acquireLock(): Promise<void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        if (!this.writeLock) {
          this.writeLock = true;
          resolve();
        } else {
          setTimeout(tryAcquire, 0);
        }
      };
      tryAcquire();
    });
  }

  private releaseLock(): void {
    this.writeLock = false;
  }

  get(uuid: string): PlayerProfile | null {
    const p = this.players.get(uuid);
    return p ? JSON.parse(JSON.stringify(p)) : null;
  }

  getAll(): PlayerProfile[] {
    return Array.from(this.players.values()).map((p) => JSON.parse(JSON.stringify(p)));
  }

  async update(uuid: string, fn: (p: PlayerProfile) => PlayerProfile): Promise<PlayerProfile | null> {
    await this.acquireLock();
    try {
      const p = this.players.get(uuid);
      if (!p) return null;
      const clone: PlayerProfile = JSON.parse(JSON.stringify(p));
      const updated = fn(clone);
      this.players.set(uuid, updated);
      this.dirty = true;
      return JSON.parse(JSON.stringify(updated));
    } finally {
      this.releaseLock();
    }
  }

  async bulkUpdate(fn: (players: PlayerProfile[]) => PlayerProfile[]): Promise<void> {
    await this.acquireLock();
    try {
      const clones = Array.from(this.players.values()).map(
        (p) => JSON.parse(JSON.stringify(p)) as PlayerProfile
      );
      const updated = fn(clones);
      for (const p of updated) this.players.set(p.uuid, p);
      this.dirty = true;
    } finally {
      this.releaseLock();
    }
  }

  async insert(profile: PlayerProfile): Promise<void> {
    await this.acquireLock();
    try {
      this.players.set(profile.uuid, profile);
      this.dirty = true;
    } finally {
      this.releaseLock();
    }
  }
}

class MarketPricingStore {
  private state: MarketPricingState = {
    priceMultipliers: {},
    lastPurchaseTimes: {},
    gameHour: 0,
  };
  private dirty = false;

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      if (existsSync(MARKET_FILE)) {
        this.state = JSON.parse(readFileSync(MARKET_FILE, 'utf-8'));
        console.log(`[Market] Loaded pricing state (hour: ${this.state.gameHour}).`);
      }
    } catch (err) {
      console.error('[Market] Load error:', err);
    }
  }

  save(): void {
    if (!this.dirty) return;
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(MARKET_FILE, JSON.stringify(this.state, null, 2));
      this.dirty = false;
    } catch (err) {
      console.error('[Market] Save error:', err);
    }
  }

  getState(): MarketPricingState {
    return JSON.parse(JSON.stringify(this.state));
  }

  getCurrentPrice(basePrice: number, blueprintId: string): number {
    const multiplier = this.state.priceMultipliers[blueprintId] ?? 1.0;
    return roundTo(basePrice * multiplier, 2);
  }

  recordPurchase(blueprintId: string): void {
    const current = this.state.priceMultipliers[blueprintId] ?? 1.0;
    const newMultiplier = Math.min(current + PRICE_INCREASE_PER_PURCHASE, PRICE_MAX_MULTIPLIER);
    this.state.priceMultipliers[blueprintId] = roundTo(newMultiplier, 4);
    this.state.lastPurchaseTimes[blueprintId] = Date.now();
    this.dirty = true;
  }

  advanceHour(): number {
    this.state.gameHour++;
    let changes = 0;
    const now = Date.now();

    for (const blueprintId of Object.keys(this.state.priceMultipliers)) {
      const lastPurchase = this.state.lastPurchaseTimes[blueprintId] ?? 0;
      const hoursSincePurchase = (now - lastPurchase) / (60 * 60 * 1000);

      // Decay if not purchased recently (>= 1 game hour)
      if (hoursSincePurchase >= 1) {
        const current = this.state.priceMultipliers[blueprintId];
        if (current > PRICE_MIN_MULTIPLIER) {
          const newMultiplier = Math.max(current - PRICE_DECAY_PER_HOUR, PRICE_MIN_MULTIPLIER);
          this.state.priceMultipliers[blueprintId] = roundTo(newMultiplier, 4);
          changes++;
        }
      }
    }

    this.dirty = true;
    return changes;
  }
}

export const store = new PlayerStore();
export const marketPricing = new MarketPricingStore();

setInterval(() => {
  store.save();
  marketPricing.save();
}, 30_000);

process.on('SIGINT', () => {
  store.save();
  marketPricing.save();
  process.exit(0);
});

// ═════════════════════════════════════════════════════════════════
//  SECTION 5: PLAYER CREATION
// ═════════════════════════════════════════════════════════════════

export function createPlayer(username: string, startingBalance = 5000): LoopResult {
  if (!username?.trim()) {
    return { success: false, message: 'Username is required.' };
  }

  const profile: PlayerProfile = {
    uuid: randomUUID(),
    username: username.trim(),
    walletBalance: startingBalance,
    employees: [],
    devices: [],
  };

  store.insert(profile);

  return {
    success: true,
    message: `Player "${profile.username}" created with $${startingBalance}.`,
    data: { uuid: profile.uuid, walletBalance: startingBalance },
  };
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 6: HIRE EMPLOYEE (with random trait)
// ═════════════════════════════════════════════════════════════════

/**
 * hireEmployee(playerUuid, workerType)
 * 
 * Charges an upfront fee, assigns a random trait, and adds to roster.
 * Trait affects salary, efficiency, XP gain, and special behaviors.
 */
export async function hireEmployee(
  playerUuid: string,
  workerType: EmployeeType
): Promise<LoopResult> {
  const player = store.get(playerUuid);
  if (!player) {
    return { success: false, message: 'Player not found.' };
  }

  const config = getEmployeeTypeConfig(workerType);
  if (!config) {
    return {
      success: false,
      message: `Invalid worker type "${workerType}". Valid: ${EMPLOYEE_TYPES.map((e) => e.type).join(', ')}`,
    };
  }

  if (player.employees.length >= MAX_EMPLOYEES) {
    return { success: false, message: `Workforce cap reached (${MAX_EMPLOYEES}).` };
  }

  // ── Assign random trait ──
  const trait = randomFrom(WORKER_TRAITS);
  const traitConfig = getTraitConfig(trait.trait);

  // Salary is modified by trait
  const effectiveHireCost = roundTo(config.hireCost * traitConfig.salaryModifier, 2);

  if (player.walletBalance < effectiveHireCost) {
    return {
      success: false,
      message: `Insufficient funds. ${config.label} (${trait.label}) costs $${effectiveHireCost.toFixed(2)}, balance $${player.walletBalance.toFixed(2)}.`,
    };
  }

  const newEmployee: Employee = {
    workerId: randomUUID(),
    type: workerType,
    baseSalaryPerTick: config.baseSalaryPerTick,
    assignedDeviceId: null,
    hiredAt: Date.now(),
    trait: trait.trait,
    level: 1,
    xp: 0,
    xpToNextLevel: XP_TO_LEVEL,
    isPaused: false,
  };

  const updated = await store.update(playerUuid, (p) => {
    if (p.walletBalance < effectiveHireCost) throw new Error('INSUFFICIENT_FUNDS');
    p.walletBalance = roundTo(p.walletBalance - effectiveHireCost, 2);
    p.employees.push(newEmployee);
    return p;
  });

  if (!updated) {
    return { success: false, message: 'Hiring failed.' };
  }

  return {
    success: true,
    message: `${config.label} (${trait.label}) hired for $${effectiveHireCost.toFixed(2)}. ${traitConfig.description}.`,
    data: {
      workerId: newEmployee.workerId,
      type: workerType,
      trait: trait.trait,
      traitDescription: traitConfig.description,
      effectiveSalary: calcEffectiveSalary(newEmployee),
      effectiveEfficiency: calcEffectiveEfficiency(newEmployee),
      remainingBalance: updated.walletBalance,
    },
  };
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 7: ASSIGN EMPLOYEE
// ═════════════════════════════════════════════════════════════════

export async function assignEmployee(
  playerUuid: string,
  workerId: string,
  deviceInstanceId: string
): Promise<LoopResult> {
  const player = store.get(playerUuid);
  if (!player) return { success: false, message: 'Player not found.' };

  const employee = player.employees.find((e) => e.workerId === workerId);
  if (!employee) return { success: false, message: `Employee "${workerId}" not found.` };
  if (employee.assignedDeviceId !== null) {
    return { success: false, message: 'Employee is already assigned. Unassign first.' };
  }

  const device = player.devices.find((d) => d.instanceId === deviceInstanceId);
  if (!device) return { success: false, message: `Device "${deviceInstanceId}" not found.` };
  if (device.status === 'operating') {
    return { success: false, message: `Device "${device.name}" is already operating.` };
  }
  if (device.durability <= 0) {
    return { success: false, message: `Device "${device.name}" has 0 durability. Repair it first.` };
  }

  const updated = await store.update(playerUuid, (p) => {
    const emp = p.employees.find((e) => e.workerId === workerId);
    const dev = p.devices.find((d) => d.instanceId === deviceInstanceId);
    if (!emp || !dev) throw new Error('NOT_FOUND');
    if (emp.assignedDeviceId !== null || dev.status === 'operating' || dev.durability <= 0) {
      throw new Error('INVALID_STATE');
    }

    emp.assignedDeviceId = deviceInstanceId;
    dev.assignedWorkerId = workerId;
    dev.status = 'operating';
    emp.isPaused = false; // Reset pause state on new assignment
    return p;
  });

  if (!updated) return { success: false, message: 'Assignment failed.' };

  const traitConfig = getTraitConfig(employee.trait);
  return {
    success: true,
    message: `${getEmployeeTypeConfig(employee.type).label} (${traitConfig.label}) assigned to "${device.name}".`,
    data: { workerId, deviceInstanceId, efficiency: calcEffectiveEfficiency(employee) },
  };
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 8: UNASSIGN EMPLOYEE
// ═════════════════════════════════════════════════════════════════

export async function unassignEmployee(
  playerUuid: string,
  workerId: string
): Promise<LoopResult> {
  const player = store.get(playerUuid);
  if (!player) return { success: false, message: 'Player not found.' };

  const employee = player.employees.find((e) => e.workerId === workerId);
  if (!employee) return { success: false, message: 'Employee not found.' };
  if (employee.assignedDeviceId === null) {
    return { success: false, message: 'Employee is already unassigned.' };
  }

  const updated = await store.update(playerUuid, (p) => {
    const emp = p.employees.find((e) => e.workerId === workerId);
    if (!emp || emp.assignedDeviceId === null) return p;

    const dev = p.devices.find((d) => d.instanceId === emp.assignedDeviceId);
    if (dev) {
      dev.status = 'idle';
      dev.assignedWorkerId = null;
    }
    emp.assignedDeviceId = null;
    emp.isPaused = false;
    return p;
  });

  if (!updated) return { success: false, message: 'Unassignment failed.' };
  return { success: true, message: 'Employee unassigned. Device returned to idle.' };
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 9: ADD DEVICE (with durability)
// ═════════════════════════════════════════════════════════════════

export async function addDevice(
  playerUuid: string,
  name: string,
  productionRate: number
): Promise<LoopResult> {
  const player = store.get(playerUuid);
  if (!player) return { success: false, message: 'Player not found.' };

  const newDevice: DeviceInstance = {
    instanceId: randomUUID(),
    definitionId: `dev-${Date.now()}`,
    name,
    status: 'idle',
    baseProductionRate: productionRate,
    assignedWorkerId: null,
    durability: 100,
    maxDurability: 100,
    totalTicksOperated: 0,
  };

  const updated = await store.update(playerUuid, (p) => {
    p.devices.push(newDevice);
    return p;
  });

  if (!updated) return { success: false, message: 'Failed to add device.' };
  return {
    success: true,
    message: `Device "${name}" added (durability: 100/100, rate: $${productionRate}/tick).`,
    data: { instanceId: newDevice.instanceId, productionRate },
  };
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 10: REPAIR DEVICE (durability system)
// ═════════════════════════════════════════════════════════════════

/**
 * repairDevice(playerUuid, deviceInstanceId)
 * 
 * Restores durability to full. Cost = REPAIR_COST_PER_POINT × missing durability.
 * Example: Repairing from 40 to 100 costs 60 × $5 = $300.
 */
export async function repairDevice(
  playerUuid: string,
  deviceInstanceId: string
): Promise<LoopResult> {
  const player = store.get(playerUuid);
  if (!player) return { success: false, message: 'Player not found.' };

  const device = player.devices.find((d) => d.instanceId === deviceInstanceId);
  if (!device) return { success: false, message: `Device "${deviceInstanceId}" not found.` };

  const missingDurability = device.maxDurability - device.durability;
  if (missingDurability <= 0) {
    return { success: false, message: `"${device.name}" is already at full durability.` };
  }

  const repairCost = roundTo(missingDurability * REPAIR_COST_PER_POINT, 2);

  if (player.walletBalance < repairCost) {
    return {
      success: false,
      message: `Insufficient funds. Repair costs $${repairCost.toFixed(2)}, balance $${player.walletBalance.toFixed(2)}.`,
    };
  }

  const updated = await store.update(playerUuid, (p) => {
    const dev = p.devices.find((d) => d.instanceId === deviceInstanceId);
    if (!dev) throw new Error('NOT_FOUND');

    const missing = dev.maxDurability - dev.durability;
    const cost = roundTo(missing * REPAIR_COST_PER_POINT, 2);
    if (p.walletBalance < cost) throw new Error('INSUFFICIENT_FUNDS');

    p.walletBalance = roundTo(p.walletBalance - cost, 2);
    dev.durability = dev.maxDurability;
    if (dev.status === 'maintenance') dev.status = 'idle';
    return p;
  });

  if (!updated) return { success: false, message: 'Repair failed.' };

  return {
    success: true,
    message: `"${device.name}" fully repaired for $${repairCost.toFixed(2)}. Durability: ${device.maxDurability}/${device.maxDurability}.`,
    data: {
      instanceId: deviceInstanceId,
      repairCost,
      durabilityRestored: missingDurability,
      remainingBalance: updated.walletBalance,
    },
  };
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 11: MARKET PRICING FUNCTIONS
// ═════════════════════════════════════════════════════════════════

/**
 * Gets the current dynamic price for a blueprint.
 * Returns basePrice × current multiplier.
 */
export function getDynamicPrice(basePrice: number, blueprintId: string): number {
  return marketPricing.getCurrentPrice(basePrice, blueprintId);
}

/**
 * Records a blueprint purchase, increasing its price by 1%.
 */
export function recordBlueprintPurchase(blueprintId: string): void {
  marketPricing.recordPurchase(blueprintId);
}

/**
 * Gets the full pricing state for display.
 */
export function getMarketPricingState() {
  return marketPricing.getState();
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 12: AUTOMATED TICK LOOP (all systems integrated)
// ═════════════════════════════════════════════════════════════════

let tickRunning = false;
let tickTimer: ReturnType<typeof setInterval> | null = null;
let lastTickReport: TickReport | null = null;

/**
 * processTick()
 * 
 * Master tick loop processing ALL players with all advanced systems:
 * 
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  PER PLAYER:                                                    │
 * │                                                                  │
 * │  1. DEDUCT SALARIES (trait-modified, level-scaled)              │
 * │     - Engineer    = $5.00 × trait × level                        │
 * │     - Technician  = $2.50 × trait × level                        │
 * │     - etc.                                                       │
 * │                                                                  │
 * │  2. BANKRUPTCY CHECK                                            │
 * │     If balance < $0 → freeze all operations                     │
 * │                                                                  │
 * │  3. INCOME GENERATION                                           │
 * │     For each 'operating' device:                                │
 * │     a. Check durability > 0                                     │
 * │     b. Check if assigned worker is 'unstable' → roll pause      │
 * │     c. Calculate income:                                        │
 * │        baseRate × efficiency(trait+level) × durabilityPenalty    │
 * │     d. Award XP to worker                                       │
 * │     e. Reduce device durability                                 │
 * │                                                                  │
 * │  4. MARKET PRICE DECAY                                          │
 * │     Every game hour: decay unpurchased blueprint prices by 0.5%  │
 * └──────────────────────────────────────────────────────────────────┘
 */
async function processTick(): Promise<TickReport> {
  if (tickRunning) {
    return lastTickReport ?? {
      timestamp: Date.now(),
      playersProcessed: 0,
      totalSalariesDeducted: 0,
      totalIncomeGenerated: 0,
      totalXpAwarded: 0,
      totalDurabilityLost: 0,
      bankruptciesTriggered: 0,
      traitsTriggered: 0,
      marketPriceChanges: 0,
    };
  }

  tickRunning = true;
  const startTime = Date.now();
  let totalSalaries = 0;
  let totalIncome = 0;
  let totalXp = 0;
  let totalDurabilityLost = 0;
  let bankruptcies = 0;
  let traitsTriggered = 0;

  await store.bulkUpdate((players) => {
    return players.map((player) => {
      const p: PlayerProfile = JSON.parse(JSON.stringify(player));

      // ── Step 1: Deduct Salaries ──
      let salaryCost = 0;
      for (const emp of p.employees) {
        const empSalary = calcEffectiveSalary(emp);
        salaryCost += empSalary;
        totalSalaries += empSalary;
      }
      salaryCost = roundTo(salaryCost, 2);

      if (salaryCost > 0) {
        p.walletBalance = roundTo(p.walletBalance - salaryCost, 2);
      }

      // ── Step 2: Bankruptcy Check ──
      if (p.walletBalance < BANKRUPTCY_THRESHOLD) {
        bankruptcies++;
        console.log(`[Tick] BANKRUPTCY: ${p.username} ($${p.walletBalance.toFixed(2)}) — halting.`);

        for (const device of p.devices) {
          if (device.status === 'operating') {
            device.status = 'maintenance';
            device.assignedWorkerId = null;
          }
        }
        for (const emp of p.employees) {
          emp.assignedDeviceId = null;
          emp.isPaused = false;
        }
        return p;
      }

      // ── Step 3: Income Generation + Traits + XP + Durability ──
      let income = 0;

      for (const device of p.devices) {
        if (device.status !== 'operating') continue;
        if (device.durability <= 0) {
          device.status = 'maintenance';
          device.assignedWorkerId = null;
          continue;
        }

        let deviceIncome = device.baseProductionRate;
        const assignedEmp = device.assignedWorkerId
          ? p.employees.find((e) => e.workerId === device.assignedWorkerId)
          : null;

        if (assignedEmp) {
          // ── Unstable trait: 5% pause chance ──
          const traitConfig = getTraitConfig(assignedEmp.trait);
          if (traitConfig.pauseChance > 0 && Math.random() < traitConfig.pauseChance) {
            assignedEmp.isPaused = true;
            device.status = 'idle'; // Visual indicator
            traitsTriggered++;
            console.log(`[Tick] TRAIT: ${assignedEmp.workerId.slice(0, 8)} (unstable) paused production.`);
            continue; // Skip income for this device
          }

          assignedEmp.isPaused = false;

          // ── Apply efficiency (trait + level) ──
          const efficiency = calcEffectiveEfficiency(assignedEmp);
          deviceIncome *= efficiency;

          // ── Award XP ──
          let xpGain = XP_PER_CYCLE;
          xpGain *= traitConfig.xpGainModifier; // Trait modifier
          xpGain = roundTo(xpGain, 1);
          assignedEmp.xp += xpGain;
          totalXp += xpGain;

          // ── Level up check ──
          while (assignedEmp.xp >= assignedEmp.xpToNextLevel) {
            assignedEmp.xp -= assignedEmp.xpToNextLevel;
            assignedEmp.level++;
            assignedEmp.xpToNextLevel = roundTo(assignedEmp.xpToNextLevel * 1.1, 0); // Scale
            console.log(`[Tick] LEVEL UP: ${assignedEmp.workerId.slice(0, 8)} → Level ${assignedEmp.level}!`);
          }

          // ── Durability loss (modified by resilient trait) ──
          let durabilityLoss = DURABILITY_LOSS_PER_TICK * traitConfig.durabilityModifier;
          device.durability = Math.max(0, roundTo(device.durability - durabilityLoss, 2));
          totalDurabilityLost += durabilityLoss;
          device.totalTicksOperated++;
        } else {
          // No employee — still lose durability (slower)
          let durabilityLoss = DURABILITY_LOSS_PER_TICK * 0.5;
          device.durability = Math.max(0, roundTo(device.durability - durabilityLoss, 2));
          totalDurabilityLost += durabilityLoss;
        }

        // ── Durability penalty ──
        if (device.durability <= 0) {
          deviceIncome = 0;
          device.status = 'maintenance';
          device.assignedWorkerId = null;
        } else if (device.durability < LOW_DURABILITY_THRESHOLD) {
          deviceIncome *= LOW_DURABILITY_PENALTY;
        }

        income += deviceIncome;
      }

      income = roundTo(income, 2);
      if (income > 0) {
        p.walletBalance = roundTo(p.walletBalance + income, 2);
        totalIncome += income;
      }

      return p;
    });
  });

  // ── Step 4: Market Price Decay ──
  const marketChanges = marketPricing.advanceHour();

  const playerCount = store.getAll().length;

  const report: TickReport = {
    timestamp: startTime,
    playersProcessed: playerCount,
    totalSalariesDeducted: roundTo(totalSalaries, 2),
    totalIncomeGenerated: roundTo(totalIncome, 2),
    totalXpAwarded: roundTo(totalXp, 1),
    totalDurabilityLost: roundTo(totalDurabilityLost, 2),
    bankruptciesTriggered: bankruptcies,
    traitsTriggered,
    marketPriceChanges: marketChanges,
  };

  lastTickReport = report;

  if (playerCount > 0) {
    console.log(
      `[Tick] ${playerCount} players | ` +
      `Salaries: -$${report.totalSalariesDeducted.toFixed(2)} | ` +
      `Income: +$${report.totalIncomeGenerated.toFixed(2)} | ` +
      `XP: +${report.totalXpAwarded} | ` +
      `Durability: -${report.totalDurabilityLost.toFixed(1)} | ` +
      `Traits: ${report.traitsTriggered} | ` +
      `Market: ${report.marketPriceChanges} changes | ` +
      `Bankruptcies: ${report.bankruptciesTriggered}`
    );
  }

  tickRunning = false;
  return report;
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 13: LOOP CONTROL
// ═════════════════════════════════════════════════════════════════

export function startLoop(): void {
  if (tickTimer) {
    console.warn('[Loop] Already running.');
    return;
  }
  console.log(`[Loop] Starting production loop (interval: ${TICK_INTERVAL_MS / 1000}s)`);
  tickTimer = setInterval(async () => {
    await processTick();
  }, TICK_INTERVAL_MS);
}

export function stopLoop(): void {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
    console.log('[Loop] Stopped.');
  }
}

export async function forceTick(): Promise<TickReport> {
  return processTick();
}

export function getLastReport(): TickReport | null {
  return lastTickReport;
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 14: QUERY HELPERS
// ═════════════════════════════════════════════════════════════════

export function getPlayerStatus(playerUuid: string): LoopResult {
  const player = store.get(playerUuid);
  if (!player) return { success: false, message: 'Player not found.' };

  const employees = player.employees.map((emp) => ({
    workerId: emp.workerId.slice(0, 8),
    type: emp.type,
    trait: emp.trait,
    level: emp.level,
    xp: emp.xp,
    xpToNext: emp.xpToNextLevel,
    effectiveSalary: calcEffectiveSalary(emp),
    effectiveEfficiency: calcEffectiveEfficiency(emp),
    assigned: emp.assignedDeviceId !== null,
    paused: emp.isPaused,
  }));

  const devices = player.devices.map((dev) => ({
    instanceId: dev.instanceId.slice(0, 8),
    name: dev.name,
    status: dev.status,
    durability: `${dev.durability}/${dev.maxDurability}`,
    durabilityPercent: `${Math.round((dev.durability / dev.maxDurability) * 100)}%`,
    ticksOperated: dev.totalTicksOperated,
    baseRate: dev.baseProductionRate,
  }));

  const totalSalary = player.employees.reduce((sum, e) => sum + calcEffectiveSalary(e), 0);
  const totalIncome = player.devices
    .filter((d) => d.status === 'operating')
    .reduce((sum, d) => {
      const emp = player.employees.find((e) => e.workerId === d.assignedWorkerId);
      let rate = d.baseProductionRate;
      if (emp) rate *= calcEffectiveEfficiency(emp);
      if (d.durability < LOW_DURABILITY_THRESHOLD) rate *= LOW_DURABILITY_PENALTY;
      return sum + rate;
    }, 0);

  return {
    success: true,
    message: 'Player status.',
    data: {
      uuid: player.uuid,
      username: player.username,
      walletBalance: player.walletBalance,
      employees,
      devices,
      summary: {
        employeeCount: player.employees.length,
        deviceCount: player.devices.length,
        operatingDevices: player.devices.filter((d) => d.status === 'operating').length,
        maintenanceDevices: player.devices.filter((d) => d.status === 'maintenance').length,
        totalSalaryPerTick: roundTo(totalSalary, 2),
        totalIncomePerTick: roundTo(totalIncome, 2),
        netIncomePerTick: roundTo(totalIncome - totalSalary, 2),
      },
    },
  };
}

export function getAllTraits(): LoopResult {
  return {
    success: true,
    message: `${WORKER_TRAITS.length} traits available.`,
    data: WORKER_TRAITS,
  };
}



