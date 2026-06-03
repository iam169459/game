/**
 * ═══════════════════════════════════════════════════════════════════
 *  MULTIPLAYER SOCIAL ECONOMY FRAMEWORK — Core Type Definitions
 * ═══════════════════════════════════════════════════════════════════
 *  UUID-based player profiles with full economic & social tracking.
 *  All IDs are string UUIDs. All money is Decimal-safe Double.
 */

import { randomUUID } from 'crypto';

// ─── Enums & Literals ────────────────────────────────────────────

export type DeviceStatus = 'idle' | 'operating';
export type EmployeeType = 'engineer' | 'technician' | 'salesperson' | 'manager';
export type AssignmentStatus = 'unassigned' | 'assigned';

// ─── Core Entity Interfaces ──────────────────────────────────────

export interface OwnedDevice {
  instanceId: string;       // Unique UUID per crafted instance
  deviceType: string;       // References DeviceBlueprint.id
  status: DeviceStatus;
  assignedEmployeeId: string | null;
  createdAt: number;        // Epoch ms
}

export interface HiredEmployee {
  workerId: string;         // Unique UUID per hire
  type: EmployeeType;
  baseSalaryRate: number;   // Cost per tick (e.g., per minute)
  assignmentStatus: AssignmentStatus;
  assignedDeviceId: string | null;
  hiredAt: number;          // Epoch ms
}

export interface PlayerProfile {
  uuid: string;                        // Unique player identifier
  username: string;                    // Display name
  walletBalance: number;               // Current cash on hand
  friendsList: string[];               // Array of friend UUIDs
  unlockedBlueprints: string[];        // Array of blueprint IDs
  ownedDevices: OwnedDevice[];         // Crafted device instances
  hiredEmployees: HiredEmployee[];     // Workforce roster
  createdAt: number;
  lastActiveAt: number;
}

// ─── Market Registry Types ───────────────────────────────────────

export interface Blueprint {
  id: string;
  name: string;
  description: string;
  purchaseCost: number;          // One-time cost to unlock IP
  category: string;
  tier: number;                  // 1-5 rarity tier
}

export interface DeviceDefinition {
  id: string;
  name: string;
  description: string;
  blueprintId: string;           // Must own this blueprint to craft
  craftingCost: number;          // Cost per unit crafted
  passiveIncomePerTick: number;  // Revenue generated per tick loop
  category: string;
  tier: number;
}

export interface EmployeeTypeDefinition {
  type: EmployeeType;
  label: string;
  hireCost: number;              // Upfront hiring fee
  baseSalaryRate: number;        // Cost per tick
  efficiencyMultiplier: number;  // Boost to assigned device income
  description: string;
}

// ─── Transaction & Result Types ──────────────────────────────────

export interface TransactionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface TickReport {
  timestamp: number;
  playersProcessed: number;
  totalIncomeGenerated: number;
  totalSalariesDeducted: number;
  bankruptciesTriggered: number;
}

// ─── API Request/Response Types ──────────────────────────────────

export interface AddFriendRequest {
  playerUuid: string;
  targetUsername: string;
}

export interface RemoveFriendRequest {
  playerUuid: string;
  targetUuid: string;
}

export interface DonateRequest {
  senderUuid: string;
  recipientUuid: string;
  amount: number;
}

export interface PurchaseBlueprintRequest {
  playerUuid: string;
  blueprintId: string;
}

export interface CraftDeviceRequest {
  playerUuid: string;
  deviceId: string;
}

export interface HireEmployeeRequest {
  playerUuid: string;
  employeeType: EmployeeType;
}

export interface AssignEmployeeRequest {
  playerUuid: string;
  workerId: string;
  deviceId: string;
}

// ─── Factory Helpers ─────────────────────────────────────────────

export function createPlayerProfile(username: string): PlayerProfile {
  return {
    uuid: randomUUID(),
    username,
    walletBalance: 1000.00,          // Starting balance
    friendsList: [],
    unlockedBlueprints: [],
    ownedDevices: [],
    hiredEmployees: [],
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };
}

export function createOwnedDevice(deviceType: string): OwnedDevice {
  return {
    instanceId: randomUUID(),
    deviceType,
    status: 'idle',
    assignedEmployeeId: null,
    createdAt: Date.now(),
  };
}

export function createHiredEmployee(type: EmployeeType, salaryRate: number): HiredEmployee {
  return {
    workerId: randomUUID(),
    type,
    baseSalaryRate: salaryRate,
    assignmentStatus: 'unassigned',
    assignedDeviceId: null,
    hiredAt: Date.now(),
  };
}
