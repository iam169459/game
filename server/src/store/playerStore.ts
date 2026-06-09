/**
 * ═══════════════════════════════════════════════════════════════════
 *  PERSISTENCE STORE — Thread-Safe Player Data Management
 * ═══════════════════════════════════════════════════════════════════
 *  In-memory store with JSON file persistence.
 *  All mutations go through atomic read-modify-write cycles.
 *  Read operations return cloned snapshots to prevent mutation bugs.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, writeFile } from 'fs';
import { join, dirname } from 'path';
import type { PlayerProfile } from '../types';

const DATA_DIR = join(process.cwd(), 'data');
const PLAYERS_FILE = join(DATA_DIR, 'players.json');

// ─── Mutex for write operations ──────────────────────────────────
let writeLock = false;
const writeQueue: Array<() => void> = [];

async function acquireWriteLock(): Promise<void> {
  return new Promise((resolve) => {
    const tryAcquire = () => {
      if (!writeLock) {
        writeLock = true;
        resolve();
      } else {
        setTimeout(tryAcquire, 1);
      }
    };
    tryAcquire();
  });
}

function releaseWriteLock(): void {
  writeLock = false;
  const next = writeQueue.shift();
  if (next) next();
}

// ─── Data Store ──────────────────────────────────────────────────

class PlayerStore {
  private players: Map<string, PlayerProfile> = new Map();
  private usernameIndex: Map<string, string> = new Map(); // username -> uuid
  private dirty = false;

  constructor() {
    this.loadFromDisk();
  }

  // ── Persistence ──────────────────────────────────────────────

  private loadFromDisk(): void {
    try {
      if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
      }
      if (existsSync(PLAYERS_FILE)) {
        const raw = readFileSync(PLAYERS_FILE, 'utf-8');
        const data: PlayerProfile[] = JSON.parse(raw);
        for (const profile of data) {
          this.players.set(profile.uuid, profile);
          this.usernameIndex.set(profile.username.toLowerCase(), profile.uuid);
        }
        console.log(`[Store] Loaded ${data.length} players from disk.`);
      }
    } catch (err) {
      console.error('[Store] Failed to load players:', err);
    }
  }

  /** Flush to disk synchronously. Called on graceful shutdown. */
  flushSync(): void {
    if (!this.dirty) return;
    try {
      if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = Array.from(this.players.values());
      writeFileSync(PLAYERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
      this.dirty = false;
      console.log(`[Store] Flushed ${data.length} players to disk (sync).`);
    } catch (err) {
      console.error('[Store] Failed to flush synchronously:', err);
    }
  }

  /** Flush to disk asynchronously. Called periodically to avoid blocking the event loop. */
  async flushAsync(): Promise<void> {
    if (!this.dirty) return;
    try {
      if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = Array.from(this.players.values());
      const payload = JSON.stringify(data, null, 2);
      await new Promise<void>((resolve, reject) => {
        writeFile(PLAYERS_FILE, payload, 'utf-8', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      this.dirty = false;
      console.log(`[Store] Flushed ${data.length} players to disk (async).`);
    } catch (err) {
      console.error('[Store] Failed to flush asynchronously:', err);
    }
  }

  // ── Read Operations (return clones) ──────────────────────────

  getByUuid(uuid: string): PlayerProfile | null {
    const profile = this.players.get(uuid);
    return profile ? JSON.parse(JSON.stringify(profile)) as PlayerProfile : null;
  }

  getByUsername(username: string): PlayerProfile | null {
    const uuid = this.usernameIndex.get(username.toLowerCase());
    if (!uuid) return null;
    return this.getByUuid(uuid);
  }

  uuidExists(uuid: string): boolean {
    return this.players.has(uuid);
  }

  usernameExists(username: string): boolean {
    return this.usernameIndex.has(username.toLowerCase());
  }

  getAllPlayers(): PlayerProfile[] {
    return Array.from(this.players.values()).map((p) => JSON.parse(JSON.stringify(p)) as PlayerProfile);
  }

  // ── Write Operations (atomic read-modify-write) ──────────────

  /**
   * Atomically update a player profile.
   * The mutator receives a deep clone; returning it writes it back.
   * Returns the updated profile or null if not found.
   */
  async atomicUpdate(
    uuid: string,
    mutator: (profile: PlayerProfile) => PlayerProfile
  ): Promise<PlayerProfile | null> {
    await acquireWriteLock();
    try {
      const profile = this.players.get(uuid);
      if (!profile) return null;

      const clone = JSON.parse(JSON.stringify(profile)) as PlayerProfile;
      const updated = mutator(clone);

      // Rebuild username index if name changed
      if (updated.username.toLowerCase() !== profile.username.toLowerCase()) {
        this.usernameIndex.delete(profile.username.toLowerCase());
        this.usernameIndex.set(updated.username.toLowerCase(), updated.uuid);
      }

      this.players.set(uuid, updated);
      this.dirty = true;
      return JSON.parse(JSON.stringify(updated)) as PlayerProfile;
    } finally {
      releaseWriteLock();
    }
  }

  /** Insert a brand-new player profile. */
  async insert(profile: PlayerProfile): Promise<void> {
    await acquireWriteLock();
    try {
      this.players.set(profile.uuid, profile);
      this.usernameIndex.set(profile.username.toLowerCase(), profile.uuid);
      this.dirty = true;
    } finally {
      releaseWriteLock();
    }
  }

  /** Delete a player by UUID. */
  async delete(uuid: string): Promise<boolean> {
    await acquireWriteLock();
    try {
      const profile = this.players.get(uuid);
      if (!profile) return false;
      this.usernameIndex.delete(profile.username.toLowerCase());
      this.players.delete(uuid);
      this.dirty = true;
      return true;
    } finally {
      releaseWriteLock();
    }
  }

  /** Get count of active players. */
  get size(): number {
    return this.players.size;
  }
}

// ─── Singleton Export ────────────────────────────────────────────

export const playerStore = new PlayerStore();

// Auto-flush every 30 seconds
setInterval(() => playerStore.flushAsync(), 30_000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[Store] Flushing before shutdown...');
  playerStore.flushSync();
  process.exit(0);
});

process.on('SIGTERM', () => {
  playerStore.flushSync();
  process.exit(0);
});
