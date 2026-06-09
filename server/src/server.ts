/**
 * ═══════════════════════════════════════════════════════════════════
 *  REST API SERVER — Multiplayer Social Economy Endpoints
 * ═══════════════════════════════════════════════════════════════════
 *  Express-based HTTP API exposing all framework modules.
 *  
 *  Routes:
 *    POST   /api/players              — Create new player
 *    GET    /api/players/:uuid        — Get player profile
 *    GET    /api/players              — List all players
 *    
 *    POST   /api/social/add-friend    — Add friend
 *    POST   /api/social/remove-friend — Remove friend
 *    POST   /api/social/donate        — Transfer money
 *    GET    /api/social/friends/:uuid — Get friend list
 *    
 *    GET    /api/market               — Get market catalog
 *    POST   /api/market/buy-blueprint — Purchase blueprint
 *    POST   /api/market/craft-device  — Craft device
 *    
 *    POST   /api/workforce/hire       — Hire employee
 *    POST   /api/workforce/assign     — Assign to device
 *    POST   /api/workforce/unassign   — Unassign employee
 *    
 *    POST   /api/admin/tick           — Force tick (admin)
 *    GET    /api/admin/tick-report    — Last tick report
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { playerStore } from './store/playerStore';
import { createPlayerProfile } from './types';
import { addFriend, removeFriend, donateMoney, getFriendList } from './modules/social';
import { purchaseBlueprint, craftDevice, getMarketCatalog } from './modules/market';
import { hireEmployee, assignEmployee, unassignEmployee, forceTick, getLastTickReport } from './modules/workforce';
import { startTickLoop } from './modules/workforce';
import {
  repairDevice as advancedRepair,
  getDynamicPrice,
  getMarketPricingState,
  getAllTraits,
  getPlayerStatus as getAdvancedStatus,
  startLoop as startAdvancedLoop,
  getLastReport as getAdvancedTickReport,
  EMPLOYEE_TYPES as ADVANCED_EMPLOYEE_TYPES,
  WORKER_TRAITS,
} from './productionEngine';
import type { EmployeeType } from './types';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// ─── Middleware ───────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

// ─── Helper: Send Result ─────────────────────────────────────────

function sendResult(res: express.Response, result: { success: boolean; message: string; data?: unknown }) {
  const status = result.success ? 200 : 400;
  res.status(status).json(result);
}

// ═════════════════════════════════════════════════════════════════
//  PLAYER ENDPOINTS
// ═════════════════════════════════════════════════════════════════

/** POST /api/players — Create a new player */
app.post('/api/players', async (req, res) => {
  const { username } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return sendResult(res, { success: false, message: 'Username is required.' });
  }

  if (username.length > 32) {
    return sendResult(res, { success: false, message: 'Username must be 32 characters or less.' });
  }

  if (await playerStore.usernameExists(username.trim())) {
    return sendResult(res, { success: false, message: `Username "${username}" is already taken.` });
  }

  const profile = createPlayerProfile(username.trim());
  await playerStore.insert(profile);

  sendResult(res, {
    success: true,
    message: `Player "${profile.username}" created successfully.`,
    data: { uuid: profile.uuid, username: profile.username, walletBalance: profile.walletBalance },
  });
});

/** GET /api/players/:uuid — Get player profile */
app.get('/api/players/:uuid', async (req, res) => {
  const profile = await playerStore.getByUuid(req.params.uuid);
  if (!profile) {
    return sendResult(res, { success: false, message: 'Player not found.' });
  }
  sendResult(res, { success: true, message: 'Player found.', data: profile });
});

/** GET /api/players — List all players */
app.get('/api/players', async (_req, res) => {
  const players = (await playerStore.getAllPlayers()).map((p) => ({
    uuid: p.uuid,
    username: p.username,
    walletBalance: p.walletBalance,
    deviceCount: p.ownedDevices.length,
    employeeCount: p.hiredEmployees.length,
    friendCount: p.friendsList.length,
    lastActiveAt: p.lastActiveAt,
  }));
  sendResult(res, { success: true, message: `Found ${players.length} players.`, data: players });
});

/** POST /api/players/:uuid/save — Save client game state */
app.post('/api/players/:uuid/save', async (req, res) => {
  const { uuid } = req.params;
  const { saveState } = req.body;
  if (!saveState) {
    return sendResult(res, { success: false, message: 'saveState is required.' });
  }
  const exists = await playerStore.uuidExists(uuid);
  if (!exists) {
    return sendResult(res, { success: false, message: 'Player not found.' });
  }
  await playerStore.saveGameState(uuid, saveState);
  sendResult(res, { success: true, message: 'Game state synced successfully.' });
});

/** GET /api/players/:uuid/save — Load client game state */
app.get('/api/players/:uuid/save', async (req, res) => {
  const { uuid } = req.params;
  const exists = await playerStore.uuidExists(uuid);
  if (!exists) {
    return sendResult(res, { success: false, message: 'Player not found.' });
  }
  const saveState = await playerStore.loadGameState(uuid);
  sendResult(res, { success: true, message: 'Game state loaded.', data: saveState });
});

// ═════════════════════════════════════════════════════════════════
//  SOCIAL ENDPOINTS
// ═════════════════════════════════════════════════════════════════

/** POST /api/social/add-friend */
app.post('/api/social/add-friend', async (req, res) => {
  const { playerUuid, targetUsername } = req.body;

  if (!playerUuid || !targetUsername) {
    return sendResult(res, { success: false, message: 'playerUuid and targetUsername are required.' });
  }

  const result = await addFriend(playerUuid, targetUsername);
  sendResult(res, result);
});

/** POST /api/social/remove-friend */
app.post('/api/social/remove-friend', async (req, res) => {
  const { playerUuid, targetUuid } = req.body;

  if (!playerUuid || !targetUuid) {
    return sendResult(res, { success: false, message: 'playerUuid and targetUuid are required.' });
  }

  const result = await removeFriend(playerUuid, targetUuid);
  sendResult(res, result);
});

/** POST /api/social/donate */
app.post('/api/social/donate', async (req, res) => {
  const { senderUuid, recipientUuid, amount } = req.body;

  if (!senderUuid || !recipientUuid || amount === undefined) {
    return sendResult(res, { success: false, message: 'senderUuid, recipientUuid, and amount are required.' });
  }

  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return sendResult(res, { success: false, message: 'Amount must be a valid number.' });
  }

  const result = await donateMoney(senderUuid, recipientUuid, amount);
  sendResult(res, result);
});

/** GET /api/social/friends/:uuid */
app.get('/api/social/friends/:uuid', async (req, res) => {
  const result = await getFriendList(req.params.uuid);
  sendResult(res, result);
});

// ═════════════════════════════════════════════════════════════════
//  MARKET ENDPOINTS
// ═════════════════════════════════════════════════════════════════

/** GET /api/market — Full catalog */
app.get('/api/market', (_req, res) => {
  const catalog = getMarketCatalog();
  sendResult(res, { success: true, message: 'Market catalog.', data: catalog });
});

/** POST /api/market/buy-blueprint */
app.post('/api/market/buy-blueprint', async (req, res) => {
  const { playerUuid, blueprintId } = req.body;

  if (!playerUuid || !blueprintId) {
    return sendResult(res, { success: false, message: 'playerUuid and blueprintId are required.' });
  }

  const result = await purchaseBlueprint(playerUuid, blueprintId);
  sendResult(res, result);
});

/** POST /api/market/craft-device */
app.post('/api/market/craft-device', async (req, res) => {
  const { playerUuid, deviceId } = req.body;

  if (!playerUuid || !deviceId) {
    return sendResult(res, { success: false, message: 'playerUuid and deviceId are required.' });
  }

  const result = await craftDevice(playerUuid, deviceId);
  sendResult(res, result);
});

// ═════════════════════════════════════════════════════════════════
//  WORKFORCE ENDPOINTS
// ═════════════════════════════════════════════════════════════════

/** POST /api/workforce/hire */
app.post('/api/workforce/hire', async (req, res) => {
  const { playerUuid, employeeType } = req.body;

  if (!playerUuid || !employeeType) {
    return sendResult(res, { success: false, message: 'playerUuid and employeeType are required.' });
  }

  const validTypes: EmployeeType[] = ['engineer', 'technician', 'salesperson', 'manager'];
  if (!validTypes.includes(employeeType)) {
    return sendResult(res, {
      success: false,
      message: `Invalid employee type. Valid types: ${validTypes.join(', ')}`,
    });
  }

  const result = await hireEmployee(playerUuid, employeeType);
  sendResult(res, result);
});

/** POST /api/workforce/assign */
app.post('/api/workforce/assign', async (req, res) => {
  const { playerUuid, workerId, deviceId } = req.body;

  if (!playerUuid || !workerId || !deviceId) {
    return sendResult(res, { success: false, message: 'playerUuid, workerId, and deviceId are required.' });
  }

  const result = await assignEmployee(playerUuid, workerId, deviceId);
  sendResult(res, result);
});

/** POST /api/workforce/unassign */
app.post('/api/workforce/unassign', async (req, res) => {
  const { playerUuid, workerId } = req.body;

  if (!playerUuid || !workerId) {
    return sendResult(res, { success: false, message: 'playerUuid and workerId are required.' });
  }

  const result = await unassignEmployee(playerUuid, workerId);
  sendResult(res, result);
});

// ═════════════════════════════════════════════════════════════════
//  ADMIN ENDPOINTS
// ═════════════════════════════════════════════════════════════════

/** POST /api/admin/tick — Force a tick (for testing) */
app.post('/api/admin/tick', async (_req, res) => {
  const report = await forceTick();
  sendResult(res, { success: true, message: 'Tick processed.', data: report });
});

/** GET /api/admin/tick-report */
app.get('/api/admin/tick-report', (_req, res) => {
  const report = getLastTickReport();
  sendResult(res, {
    success: true,
    message: report ? 'Last tick report.' : 'No ticks processed yet.',
    data: report,
  });
});

/** GET /api/admin/stats */
app.get('/api/admin/stats', async (_req, res) => {
  const players = await playerStore.getAllPlayers();
  const totalBalance = players.reduce((sum, p) => sum + p.walletBalance, 0);
  const totalDevices = players.reduce((sum, p) => sum + p.ownedDevices.length, 0);
  const totalEmployees = players.reduce((sum, p) => sum + p.hiredEmployees.length, 0);
  const operatingDevices = players.reduce(
    (sum, p) => sum + p.ownedDevices.filter((d) => d.status === 'operating').length,
    0
  );

  sendResult(res, {
    success: true,
    message: 'Server statistics.',
    data: {
      totalPlayers: players.length,
      totalBalance: Math.round(totalBalance * 100) / 100,
      totalDevices,
      operatingDevices,
      totalEmployees,
      lastTickReport: getLastTickReport(),
    },
  });
});

// ═════════════════════════════════════════════════════════════════
//  ADVANCED PRODUCTION ENDPOINTS (productionEngine)
// ═════════════════════════════════════════════════════════════════

/** POST /api/advanced/repair — Repair a device */
app.post('/api/advanced/repair', async (req, res) => {
  const { playerUuid, deviceInstanceId } = req.body;
  if (!playerUuid || !deviceInstanceId) {
    return sendResult(res, { success: false, message: 'playerUuid and deviceInstanceId are required.' });
  }
  const result = await advancedRepair(playerUuid, deviceInstanceId);
  sendResult(res, result);
});

/** GET /api/advanced/traits — List all worker traits */
app.get('/api/advanced/traits', (_req, res) => {
  sendResult(res, getAllTraits());
});

/** GET /api/advanced/market-pricing — Get market pricing state */
app.get('/api/advanced/market-pricing', (_req, res) => {
  sendResult(res, { success: true, message: 'Market pricing state.', data: getMarketPricingState() });
});

/** GET /api/advanced/player/:uuid — Get advanced player status */
app.get('/api/advanced/player/:uuid', (req, res) => {
  sendResult(res, getAdvancedStatus(req.params.uuid));
});

/** GET /api/advanced/employee-types — Get advanced employee type configs */
app.get('/api/advanced/employee-types', (_req, res) => {
  sendResult(res, { success: true, message: 'Advanced employee types.', data: ADVANCED_EMPLOYEE_TYPES });
});

/** POST /api/advanced/tick — Force advanced tick */
app.post('/api/advanced/tick', async (_req, res) => {
  const report = await getAdvancedTickReport();
  sendResult(res, { success: true, message: 'Advanced tick report.', data: report });
});

// ─── Serve Frontend Static Files ──────────────────────────────────
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// For any other routes, serve index.html (supporting in-memory routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── Health Check ────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ─── Start Server ────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  MULTIPLAYER SOCIAL ECONOMY FRAMEWORK                   ║');
  console.log('║  Server running on http://localhost:' + PORT + '              ║');
  console.log('║  Tick loops: ACTIVE (60s interval each)                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  // Start automated tick loops
  startTickLoop();
  startAdvancedLoop();
});

export default app;
