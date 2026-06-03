/**
 * ═══════════════════════════════════════════════════════════════════
 *  MODULE C: WORKFORCE AUTOMATION & GAME LOOP
 * ═══════════════════════════════════════════════════════════════════
 *  Employee hiring, device assignment, and background tick processing.
 *  
 *  Tick Loop (runs every TICK_INTERVAL_MS):
 *    1. Deduct employee salaries from player wallets
 *    2. Bankruptcy protection: if balance < 0, halt all operations
 *    3. Income generation: credit passive income from operating devices
 */

import { playerStore } from '../store/playerStore';
import { getEmployeeType, getDevice } from './market';
import { createHiredEmployee } from '../types';
import type {
  EmployeeType,
  OwnedDevice,
  HiredEmployee,
  PlayerProfile,
  TickReport,
  TransactionResult,
} from '../types';

// ─── Configuration ───────────────────────────────────────────────

const TICK_INTERVAL_MS = 60_000; // 1 minute tick
const BANKRUPTCY_THRESHOLD = 0;

// ─── Hire Employee ───────────────────────────────────────────────

export async function hireEmployee(
  playerUuid: string,
  employeeType: EmployeeType
): Promise<TransactionResult> {
  const player = playerStore.getByUuid(playerUuid);
  if (!player) {
    return { success: false, message: 'Player not found.' };
  }

  const typeDef = getEmployeeType(employeeType);
  if (!typeDef) {
    return { success: false, message: `Invalid employee type "${employeeType}".` };
  }

  // Workforce cap check
  if (player.hiredEmployees.length >= 50) {
    return { success: false, message: 'Workforce cap reached (50 employees max).' };
  }

  // Sufficient funds?
  if (player.walletBalance < typeDef.hireCost) {
    return {
      success: false,
      message: `Insufficient funds. Hiring costs $${typeDef.hireCost.toFixed(2)}, you have $${player.walletBalance.toFixed(2)}.`,
    };
  }

  const newEmployee = createHiredEmployee(employeeType, typeDef.baseSalaryRate);

  const updated = await playerStore.atomicUpdate(playerUuid, (p) => {
    if (p.walletBalance < typeDef.hireCost) {
      throw new Error('INSUFFICIENT_FUNDS');
    }
    p.walletBalance = Math.round((p.walletBalance - typeDef.hireCost) * 100) / 100;
    p.hiredEmployees.push(newEmployee);
    p.lastActiveAt = Date.now();
    return p;
  });

  if (!updated) {
    return { success: false, message: 'Hiring failed.' };
  }

  return {
    success: true,
    message: `Hired ${typeDef.label} for $${typeDef.hireCost.toFixed(2)}. Salary: $${typeDef.baseSalaryRate.toFixed(2)}/tick.`,
    data: {
      workerId: newEmployee.workerId,
      type: employeeType,
      label: typeDef.label,
      hireCost: typeDef.hireCost,
      salaryRate: typeDef.baseSalaryRate,
      remainingBalance: updated.walletBalance,
    },
  };
}

// ─── Assign Employee to Device ───────────────────────────────────

export async function assignEmployee(
  playerUuid: string,
  workerId: string,
  deviceId: string
): Promise<TransactionResult> {
  const player = playerStore.getByUuid(playerUuid);
  if (!player) {
    return { success: false, message: 'Player not found.' };
  }

  // Find the employee
  const employee = player.hiredEmployees.find((e) => e.workerId === workerId);
  if (!employee) {
    return { success: false, message: `Employee "${workerId}" not found in your workforce.` };
  }

  if (employee.assignmentStatus === 'assigned') {
    return { success: false, message: `Employee "${employee.type}" is already assigned to a device.` };
  }

  // Find the device
  const device = player.ownedDevices.find((d) => d.instanceId === deviceId);
  if (!device) {
    return { success: false, message: `Device "${deviceId}" not found in your inventory.` };
  }

  if (device.status === 'operating') {
    return { success: false, message: `Device is already operating with an assigned employee.` };
  }

  // Atomic: assign both
  const updated = await playerStore.atomicUpdate(playerUuid, (p) => {
    const emp = p.hiredEmployees.find((e) => e.workerId === workerId);
    const dev = p.ownedDevices.find((d) => d.instanceId === deviceId);

    if (!emp || !dev) throw new Error('ENTITY_NOT_FOUND');
    if (emp.assignmentStatus === 'assigned' || dev.status === 'operating') {
      throw new Error('ALREADY_ASSIGNED');
    }

    emp.assignmentStatus = 'assigned';
    emp.assignedDeviceId = deviceId;
    dev.status = 'operating';
    dev.assignedEmployeeId = workerId;
    p.lastActiveAt = Date.now();

    return p;
  });

  if (!updated) {
    return { success: false, message: 'Assignment failed.' };
  }

  const typeDef = getEmployeeType(employee.type);
  const deviceDef = getDevice(device.deviceType);

  return {
    success: true,
    message: `${typeDef?.label ?? employee.type} assigned to ${deviceDef?.name ?? device.deviceType}. Device now generating income.`,
    data: {
      workerId,
      deviceId,
      efficiencyMultiplier: typeDef?.efficiencyMultiplier ?? 1.0,
    },
  };
}

// ─── Unassign Employee ───────────────────────────────────────────

export async function unassignEmployee(
  playerUuid: string,
  workerId: string
): Promise<TransactionResult> {
  const player = playerStore.getByUuid(playerUuid);
  if (!player) {
    return { success: false, message: 'Player not found.' };
  }

  const employee = player.hiredEmployees.find((e) => e.workerId === workerId);
  if (!employee) {
    return { success: false, message: 'Employee not found.' };
  }

  if (employee.assignmentStatus === 'unassigned') {
    return { success: false, message: 'Employee is already unassigned.' };
  }

  const deviceId = employee.assignedDeviceId;

  const updated = await playerStore.atomicUpdate(playerUuid, (p) => {
    const emp = p.hiredEmployees.find((e) => e.workerId === workerId);
    if (!emp || emp.assignmentStatus === 'unassigned') return p;

    // Unassign device
    if (emp.assignedDeviceId) {
      const dev = p.ownedDevices.find((d) => d.instanceId === emp.assignedDeviceId);
      if (dev) {
        dev.status = 'idle';
        dev.assignedEmployeeId = null;
      }
    }

    emp.assignmentStatus = 'unassigned';
    emp.assignedDeviceId = null;
    p.lastActiveAt = Date.now();

    return p;
  });

  if (!updated) {
    return { success: false, message: 'Unassignment failed.' };
  }

  return {
    success: true,
    message: 'Employee unassigned. Device returned to idle.',
  };
}

// ─── Automated Tick Loop ─────────────────────────────────────────

let tickRunning = false;
let tickTimer: ReturnType<typeof setInterval> | null = null;
let lastTickReport: TickReport | null = null;

/**
 * Process a single tick for ALL active players.
 * 
 * Order of operations:
 * 1. Deduct salaries (all employees, assigned or not)
 * 2. Bankruptcy check → if balance < 0, halt everything
 * 3. Income generation → only from operating devices with assigned employees
 */
async function processTick(): Promise<TickReport> {
  if (tickRunning) {
    console.warn('[Tick] Previous tick still running, skipping.');
    return lastTickReport ?? { timestamp: Date.now(), playersProcessed: 0, totalIncomeGenerated: 0, totalSalariesDeducted: 0, bankruptciesTriggered: 0 };
  }

  tickRunning = true;
  const startTime = Date.now();
  const allPlayers = playerStore.getAllPlayers();

  let totalIncome = 0;
  let totalSalaries = 0;
  let bankruptcies = 0;

  for (const player of allPlayers) {
    try {
      await processPlayerTick(player.uuid);
      // Re-read to get updated values for reporting
      const updated = playerStore.getByUuid(player.uuid);
      if (updated) {
        // Calculate what happened (approximate for reporting)
        const salaryCost = player.hiredEmployees.reduce((sum, e) => sum + e.baseSalaryRate, 0);
        totalSalaries += salaryCost;
      }
    } catch (err) {
      console.error(`[Tick] Error processing player ${player.uuid}:`, err);
    }
  }

  // Re-read all for accurate income reporting
  const afterPlayers = playerStore.getAllPlayers();
  for (const p of afterPlayers) {
    const before = allPlayers.find((ap) => ap.uuid === p.uuid);
    if (before) {
      const incomeDiff = p.walletBalance - before.walletBalance + 
        before.hiredEmployees.reduce((sum, e) => sum + e.baseSalaryRate, 0);
      if (incomeDiff > 0) totalIncome += incomeDiff;
    }
  }

  // Count bankruptcies
  for (const p of afterPlayers) {
    if (p.walletBalance < BANKRUPTCY_THRESHOLD) bankruptcies++;
  }

  const report: TickReport = {
    timestamp: startTime,
    playersProcessed: allPlayers.length,
    totalIncomeGenerated: Math.round(totalIncome * 100) / 100,
    totalSalariesDeducted: Math.round(totalSalaries * 100) / 100,
    bankruptciesTriggered: bankruptcies,
  };

  lastTickReport = report;
  tickRunning = false;

  if (allPlayers.length > 0) {
    console.log(
      `[Tick] Processed ${report.playersProcessed} players | ` +
      `Income: $${report.totalIncomeGenerated.toFixed(2)} | ` +
      `Salaries: -$${report.totalSalariesDeducted.toFixed(2)} | ` +
      `Bankruptcies: ${report.bankruptciesTriggered}`
    );
  }

  return report;
}

/**
 * Process a single player's tick:
 * 1. Deduct all employee salaries
 * 2. Check bankruptcy → if so, halt all devices
 * 3. If solvent, generate income from operating devices
 */
async function processPlayerTick(playerUuid: string): Promise<void> {
  await playerStore.atomicUpdate(playerUuid, (p) => {
    const now = Date.now();

    // ── Step 1: Deduct Salaries ──
    let totalSalary = 0;
    for (const emp of p.hiredEmployees) {
      totalSalary += emp.baseSalaryRate;
    }
    totalSalary = Math.round(totalSalary * 100) / 100;

    if (totalSalary > 0) {
      p.walletBalance = Math.round((p.walletBalance - totalSalary) * 100) / 100;
    }

    // ── Step 2: Bankruptcy Protection ──
    if (p.walletBalance < BANKRUPTCY_THRESHOLD) {
      // HALT ALL OPERATIONS
      for (const device of p.ownedDevices) {
        if (device.status === 'operating') {
          device.status = 'idle';
          device.assignedEmployeeId = null;
        }
      }
      for (const emp of p.hiredEmployees) {
        if (emp.assignmentStatus === 'assigned') {
          emp.assignmentStatus = 'unassigned';
          emp.assignedDeviceId = null;
        }
      }
      p.lastActiveAt = now;
      return p;
    }

    // ── Step 3: Income Generation (operating devices only) ──
    let totalIncome = 0;
    for (const device of p.ownedDevices) {
      if (device.status !== 'operating') continue;

      const deviceDef = getDevice(device.deviceType);
      if (!deviceDef) continue;

      let income = deviceDef.passiveIncomePerTick;

      // Apply employee efficiency multiplier if assigned
      if (device.assignedEmployeeId) {
        const emp = p.hiredEmployees.find((e) => e.workerId === device.assignedEmployeeId);
        if (emp) {
          const typeDef = getEmployeeType(emp.type);
          income *= typeDef?.efficiencyMultiplier ?? 1.0;
        }
      }

      totalIncome += income;
    }

    totalIncome = Math.round(totalIncome * 100) / 100;
    if (totalIncome > 0) {
      p.walletBalance = Math.round((p.walletBalance + totalIncome) * 100) / 100;
    }

    p.lastActiveAt = now;
    return p;
  });
}

// ─── Tick Control ────────────────────────────────────────────────

export function startTickLoop(): void {
  if (tickTimer) {
    console.warn('[Tick] Loop already running.');
    return;
  }

  console.log(`[Tick] Starting automated loop (interval: ${TICK_INTERVAL_MS / 1000}s)`);
  tickTimer = setInterval(async () => {
    await processTick();
  }, TICK_INTERVAL_MS);

  // Also flush store periodically alongside ticks
  setInterval(() => {
    playerStore.flush();
  }, TICK_INTERVAL_MS);
}

export function stopTickLoop(): void {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
    console.log('[Tick] Loop stopped.');
  }
}

export function getLastTickReport(): TickReport | null {
  return lastTickReport;
}

// ─── Manual tick trigger (for testing) ───────────────────────────

export async function forceTick(): Promise<TickReport> {
  return processTick();
}
