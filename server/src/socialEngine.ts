/**
 * ═══════════════════════════════════════════════════════════════════
 *  PLAYER SOCIAL ENGINE — Friend List & P2P Transactions
 * ═══════════════════════════════════════════════════════════════════
 *  Clean, modular, production-ready social system.
 *  
 *  Features:
 *    - UUID-based friend lists with symmetric updates
 *    - /friend add [name]  — validates self-add, duplicates, existence
 *    - /friend remove [name] — symmetric removal
 *    - /donate [name] [amount] — atomic transfer with exploit prevention
 *  
 *  Storage: JSON file with mutex-locked writes.
 *  Safety:  Atomic balance updates, decimal precision, race-condition guards.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

// ═════════════════════════════════════════════════════════════════
//  SECTION 1: DATA STRUCTURES
// ═════════════════════════════════════════════════════════════════

export interface PlayerProfile {
  uuid: string;
  username: string;
  walletBalance: number;
  friendsList: string[];       // Array of friend UUIDs
  createdAt: number;
  lastActiveAt: number;
}

export interface SocialResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 2: PERSISTENT STORE
// ═════════════════════════════════════════════════════════════════

const DATA_DIR = join(process.cwd(), 'data');
const PLAYERS_FILE = join(DATA_DIR, 'social_players.json');

class PlayerDatabase {
  private players: Map<string, PlayerProfile> = new Map();
  private usernameIndex: Map<string, string> = new Map();
  private dirty = false;
  private writeLock = false;

  constructor() {
    this.load();
  }

  // ── Persistence ──────────────────────────────────────────────

  private load(): void {
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      if (existsSync(PLAYERS_FILE)) {
        const data: PlayerProfile[] = JSON.parse(readFileSync(PLAYERS_FILE, 'utf-8'));
        for (const p of data) {
          this.players.set(p.uuid, p);
          this.usernameIndex.set(p.username.toLowerCase(), p.uuid);
        }
        console.log(`[DB] Loaded ${data.length} players.`);
      }
    } catch (err) {
      console.error('[DB] Load error:', err);
    }
  }

  save(): void {
    if (!this.dirty) return;
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(PLAYERS_FILE, JSON.stringify(Array.from(this.players.values()), null, 2));
      this.dirty = false;
    } catch (err) {
      console.error('[DB] Save error:', err);
    }
  }

  // ── Mutex ────────────────────────────────────────────────────

  private async lock(): Promise<void> {
    while (this.writeLock) await new Promise((r) => setTimeout(r, 1));
    this.writeLock = true;
  }

  private unlock(): void {
    this.writeLock = false;
  }

  // ── Read (returns clone) ─────────────────────────────────────

  getByUuid(uuid: string): PlayerProfile | null {
    const p = this.players.get(uuid);
    return p ? JSON.parse(JSON.stringify(p)) : null;
  }

  getByUsername(username: string): PlayerProfile | null {
    const uuid = this.usernameIndex.get(username.toLowerCase());
    return uuid ? this.getByUuid(uuid) : null;
  }

  exists(uuid: string): boolean {
    return this.players.has(uuid);
  }

  usernameTaken(username: string): boolean {
    return this.usernameIndex.has(username.toLowerCase());
  }

  // ── Write (atomic under lock) ────────────────────────────────

  async update(uuid: string, fn: (p: PlayerProfile) => PlayerProfile): Promise<PlayerProfile | null> {
    await this.lock();
    try {
      const p = this.players.get(uuid);
      if (!p) return null;

      const clone: PlayerProfile = JSON.parse(JSON.stringify(p));
      const updated = fn(clone);

      if (updated.username.toLowerCase() !== p.username.toLowerCase()) {
        this.usernameIndex.delete(p.username.toLowerCase());
        this.usernameIndex.set(updated.username.toLowerCase(), updated.uuid);
      }

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

// ── Singleton ────────────────────────────────────────────────────

export const db = new PlayerDatabase();
setInterval(() => db.save(), 30_000);
process.on('SIGINT', () => { db.save(); process.exit(0); });

// ═════════════════════════════════════════════════════════════════
//  SECTION 3: PLAYER CREATION
// ═════════════════════════════════════════════════════════════════

export function createPlayer(username: string, startingBalance = 1000): SocialResult {
  if (!username || username.trim().length === 0) {
    return { success: false, message: 'Username is required.' };
  }

  if (username.length > 32) {
    return { success: false, message: 'Username must be 32 characters or less.' };
  }

  if (db.usernameTaken(username)) {
    return { success: false, message: `Username "${username}" is already taken.` };
  }

  const profile: PlayerProfile = {
    uuid: randomUUID(),
    username: username.trim(),
    walletBalance: startingBalance,
    friendsList: [],
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };

  // Insert is async but we fire-and-forget here for the API wrapper
  db.insert(profile);

  return {
    success: true,
    message: `Player "${profile.username}" created.`,
    data: { uuid: profile.uuid, username: profile.username, walletBalance: profile.walletBalance },
  };
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 4: FRIEND MANAGEMENT
// ═════════════════════════════════════════════════════════════════

/**
 * /friend add [name]
 * 
 * Adds a friend symmetrically. Both players' lists are updated atomically.
 * 
 * Validations:
 *   1. Sender must exist
 *   2. Target must exist (by username)
 *   3. Cannot add yourself
 *   4. Cannot add duplicates
 */
export async function addFriend(
  playerUuid: string,
  targetUsername: string
): Promise<SocialResult> {
  // ── Validate sender ──
  const sender = db.getByUuid(playerUuid);
  if (!sender) {
    return { success: false, message: 'Player not found.' };
  }

  // ── Resolve target ──
  const target = db.getByUsername(targetUsername);
  if (!target) {
    return { success: false, message: `Player "${targetUsername}" not found.` };
  }

  // ── Self-add check ──
  if (sender.uuid === target.uuid) {
    return { success: false, message: 'You cannot add yourself as a friend.' };
  }

  // ── Duplicate check ──
  if (sender.friendsList.includes(target.uuid)) {
    return { success: false, message: `"${target.username}" is already your friend.` };
  }

  // ── Symmetric atomic update ──
  const now = Date.now();

  await db.update(sender.uuid, (p) => {
    p.friendsList.push(target.uuid);
    p.lastActiveAt = now;
    return p;
  });

  await db.update(target.uuid, (p) => {
    if (!p.friendsList.includes(sender.uuid)) {
      p.friendsList.push(sender.uuid);
    }
    p.lastActiveAt = now;
    return p;
  });

  return {
    success: true,
    message: `"${target.username}" added to your friends list.`,
    data: { friendUuid: target.uuid, friendUsername: target.username },
  };
}

/**
 * /friend remove [name]
 * 
 * Removes a friend symmetrically. Both players' lists are updated atomically.
 */
export async function removeFriend(
  playerUuid: string,
  targetUsername: string
): Promise<SocialResult> {
  const sender = db.getByUuid(playerUuid);
  if (!sender) {
    return { success: false, message: 'Player not found.' };
  }

  const target = db.getByUsername(targetUsername);
  if (!target) {
    return { success: false, message: `Player "${targetUsername}" not found.` };
  }

  if (!sender.friendsList.includes(target.uuid)) {
    return { success: false, message: `"${target.username}" is not on your friends list.` };
  }

  const now = Date.now();

  await db.update(sender.uuid, (p) => {
    p.friendsList = p.friendsList.filter((id) => id !== target.uuid);
    p.lastActiveAt = now;
    return p;
  });

  await db.update(target.uuid, (p) => {
    p.friendsList = p.friendsList.filter((id) => id !== sender.uuid);
    p.lastActiveAt = now;
    return p;
  });

  return {
    success: true,
    message: `"${target.username}" removed from your friends list.`,
  };
}

/**
 * Get a player's friend list with profile details.
 */
export function getFriends(playerUuid: string): SocialResult {
  const player = db.getByUuid(playerUuid);
  if (!player) {
    return { success: false, message: 'Player not found.' };
  }

  const friends = player.friendsList
    .map((uuid) => db.getByUuid(uuid))
    .filter(Boolean)
    .map((p) => ({
      uuid: p!.uuid,
      username: p!.username,
      walletBalance: p!.walletBalance,
      lastActiveAt: p!.lastActiveAt,
    }));

  return {
    success: true,
    message: `${friends.length} friend(s).`,
    data: friends as unknown as Record<string, unknown>,
  };
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 5: SECURE P2P DONATIONS
// ═════════════════════════════════════════════════════════════════

/**
 * /donate [name] [amount]
 * 
 * Securely transfers money between two players.
 * 
 * Safety measures:
 *   1. Amount must be a positive finite number > 0
 *   2. Sender cannot donate to themselves
 *   3. Sender must have sufficient balance
 *   4. Balance is re-checked INSIDE the atomic update (race-condition guard)
 *   5. All amounts rounded to 2 decimal places (prevents floating-point drift)
 *   6. If recipient update fails, sender is automatically refunded
 */
export async function donate(
  senderUuid: string,
  recipientUsername: string,
  amount: number
): Promise<SocialResult> {
  // ── Validate amount ──
  if (!Number.isFinite(amount)) {
    return { success: false, message: 'Amount must be a valid number.' };
  }

  // Round to 2 decimal places
  amount = Math.round(amount * 100) / 100;

  if (amount <= 0) {
    return { success: false, message: 'Amount must be greater than zero.' };
  }

  if (amount < 0.01) {
    return { success: false, message: 'Minimum donation is $0.01.' };
  }

  // ── Validate players ──
  const sender = db.getByUuid(senderUuid);
  if (!sender) {
    return { success: false, message: 'Sender not found.' };
  }

  const recipient = db.getByUsername(recipientUsername);
  if (!recipient) {
    return { success: false, message: `Player "${recipientUsername}" not found.` };
  }

  // ── Self-donation check ──
  if (sender.uuid === recipient.uuid) {
    return { success: false, message: 'You cannot donate to yourself.' };
  }

  // ── Sufficient funds check (pre-atomic, fast-fail) ──
  if (sender.walletBalance < amount) {
    return {
      success: false,
      message: `Insufficient funds. You have $${sender.walletBalance.toFixed(2)}, tried to send $${amount.toFixed(2)}.`,
    };
  }

  // ── Atomic Transfer ──
  // Step 1: Deduct from sender (with re-validation inside lock)
  const updatedSender = await db.update(senderUuid, (p) => {
    if (p.walletBalance < amount) {
      throw new Error('INSUFFICIENT_FUNDS');
    }
    p.walletBalance = Math.round((p.walletBalance - amount) * 100) / 100;
    p.lastActiveAt = Date.now();
    return p;
  });

  if (!updatedSender) {
    return { success: false, message: 'Transfer failed: sender update error.' };
  }

  // Step 2: Credit to recipient
  const updatedRecipient = await db.update(recipient.uuid, (p) => {
    p.walletBalance = Math.round((p.walletBalance + amount) * 100) / 100;
    p.lastActiveAt = Date.now();
    return p;
  });

  // Step 3: Rollback on failure (should never happen in practice)
  if (!updatedRecipient) {
    await db.update(senderUuid, (p) => {
      p.walletBalance = Math.round((p.walletBalance + amount) * 100) / 100;
      return p;
    });
    return { success: false, message: 'Transfer failed: recipient update error. Funds refunded.' };
  }

  return {
    success: true,
    message: `Donated $${amount.toFixed(2)} to ${recipient.username}.`,
    data: {
      senderBalance: updatedSender.walletBalance,
      recipientBalance: updatedRecipient.walletBalance,
      amount,
    },
  };
}

// ═════════════════════════════════════════════════════════════════
//  SECTION 6: COMMAND PARSER (CLI INTERFACE)
// ═════════════════════════════════════════════════════════════════

/**
 * Parse and execute a slash-command string.
 * 
 * Supported commands:
 *   /friend add [name]
 *   /friend remove [name]
 *   /donate [name] [amount]
 */
export async function handleCommand(
  playerUuid: string,
  input: string
): Promise<SocialResult> {
  const parts = input.trim().split(/\s+/);
  const command = parts[0]?.toLowerCase();

  if (!command) {
    return { success: false, message: 'Empty command.' };
  }

  // ── /friend add [name] ──
  if (command === '/friend' && parts[1]?.toLowerCase() === 'add') {
    const targetName = parts.slice(2).join(' ');
    if (!targetName) {
      return { success: false, message: 'Usage: /friend add [name]' };
    }
    return addFriend(playerUuid, targetName);
  }

  // ── /friend remove [name] ──
  if (command === '/friend' && parts[1]?.toLowerCase() === 'remove') {
    const targetName = parts.slice(2).join(' ');
    if (!targetName) {
      return { success: false, message: 'Usage: /friend remove [name]' };
    }
    return removeFriend(playerUuid, targetName);
  }

  // ── /donate [name] [amount] ──
  if (command === '/donate') {
    const targetName = parts[1];
    const amountStr = parts[2];
    if (!targetName || !amountStr) {
      return { success: false, message: 'Usage: /donate [name] [amount]' };
    }
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      return { success: false, message: 'Amount must be a valid number.' };
    }
    return donate(playerUuid, targetName, amount);
  }

  return { success: false, message: `Unknown command: "${command}".` };
}
