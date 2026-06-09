/**
 * ═══════════════════════════════════════════════════════════════════
 *  PERSISTENCE STORE — Hybrid Firestore / File Data Management
 * ═══════════════════════════════════════════════════════════════════
 *  Uses Google Cloud Firestore when variables are provided,
 *  otherwise falls back to local in-memory storage with JSON serialization.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, writeFile, readFile } from 'fs';
import { join } from 'path';
import type { PlayerProfile } from '../types';
import { Firestore } from '@google-cloud/firestore';

const DATA_DIR = join(process.cwd(), 'data');
const PLAYERS_FILE = join(DATA_DIR, 'players.json');

// ─── Mutex for write operations (local fallback mode) ─────────────
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

// ─── Player Store ──────────────────────────────────────────────────

class PlayerStore {
  private players: Map<string, PlayerProfile> = new Map();
  private usernameIndex: Map<string, string> = new Map(); // username -> uuid
  private dirty = false;
  private db: Firestore | null = null;
  private isCloudMode = false;

  constructor() {
    // Check if Firebase/Firestore credentials are provided
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      try {
        this.db = new Firestore({
          projectId: process.env.FIREBASE_PROJECT_ID,
          credentials: {
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          },
        });
        this.isCloudMode = true;
        console.log('[Store] Connected to Google Cloud Firestore successfully.');
      } catch (err) {
        console.error('[Store] Failed to initialize Firestore client:', err);
        console.log('[Store] Falling back to local file persistence.');
        this.loadFromDisk();
      }
    } else {
      console.log('[Store] Google credentials missing. Using local file persistence.');
      this.loadFromDisk();
    }
  }

  // ── Local Fallback Persistence ───────────────────────────────────

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
        console.log(`[Store] Loaded ${data.length} players from local disk.`);
      }
    } catch (err) {
      console.error('[Store] Failed to load players from disk:', err);
    }
  }

  /** Flush to disk synchronously. Called on graceful shutdown. */
  flushSync(): void {
    if (this.isCloudMode || !this.dirty) return;
    try {
      if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = Array.from(this.players.values());
      writeFileSync(PLAYERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
      this.dirty = false;
      console.log(`[Store] Flushed ${data.length} players to local disk (sync).`);
    } catch (err) {
      console.error('[Store] Failed to flush synchronously:', err);
    }
  }

  /** Flush to disk asynchronously. Called periodically to avoid blocking the event loop. */
  async flushAsync(): Promise<void> {
    if (this.isCloudMode || !this.dirty) return;
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
      console.log(`[Store] Flushed ${data.length} players to local disk (async).`);
    } catch (err) {
      console.error('[Store] Failed to flush asynchronously:', err);
    }
  }

  // ── Database Operations (Async) ──────────────────────────────────

  async getByUuid(uuid: string): Promise<PlayerProfile | null> {
    if (this.isCloudMode) {
      try {
        const doc = await this.db!.collection('players').doc(uuid).get();
        if (!doc.exists) return null;
        return doc.data() as PlayerProfile;
      } catch (err) {
        console.error(`[Store] Firestore error in getByUuid(${uuid}):`, err);
        return null;
      }
    } else {
      const profile = this.players.get(uuid);
      return profile ? JSON.parse(JSON.stringify(profile)) as PlayerProfile : null;
    }
  }

  async getByUsername(username: string): Promise<PlayerProfile | null> {
    if (this.isCloudMode) {
      try {
        const snapshot = await this.db!.collection('players')
          .where('username_lowercase', '==', username.toLowerCase())
          .limit(1)
          .get();
        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as PlayerProfile;
      } catch (err) {
        console.error(`[Store] Firestore error in getByUsername(${username}):`, err);
        return null;
      }
    } else {
      const uuid = this.usernameIndex.get(username.toLowerCase());
      if (!uuid) return null;
      return this.getByUuid(uuid);
    }
  }

  async uuidExists(uuid: string): Promise<boolean> {
    if (this.isCloudMode) {
      try {
        const doc = await this.db!.collection('players').doc(uuid).get();
        return doc.exists;
      } catch (err) {
        console.error('[Store] Firestore error in uuidExists:', err);
        return false;
      }
    } else {
      return this.players.has(uuid);
    }
  }

  async usernameExists(username: string): Promise<boolean> {
    if (this.isCloudMode) {
      try {
        const snapshot = await this.db!.collection('players')
          .where('username_lowercase', '==', username.toLowerCase())
          .limit(1)
          .get();
        return !snapshot.empty;
      } catch (err) {
        console.error('[Store] Firestore error in usernameExists:', err);
        return false;
      }
    } else {
      return this.usernameIndex.has(username.toLowerCase());
    }
  }

  async getAllPlayers(): Promise<PlayerProfile[]> {
    if (this.isCloudMode) {
      try {
        const snapshot = await this.db!.collection('players').get();
        return snapshot.docs.map((doc) => doc.data() as PlayerProfile);
      } catch (err) {
        console.error('[Store] Firestore error in getAllPlayers:', err);
        return [];
      }
    } else {
      return Array.from(this.players.values()).map((p) => JSON.parse(JSON.stringify(p)) as PlayerProfile);
    }
  }

  async insert(profile: PlayerProfile): Promise<void> {
    if (this.isCloudMode) {
      try {
        const data = {
          ...profile,
          username_lowercase: profile.username.toLowerCase(),
        };
        await this.db!.collection('players').doc(profile.uuid).set(data);
      } catch (err) {
        console.error('[Store] Firestore error in insert:', err);
        throw err;
      }
    } else {
      await acquireWriteLock();
      try {
        this.players.set(profile.uuid, profile);
        this.usernameIndex.set(profile.username.toLowerCase(), profile.uuid);
        this.dirty = true;
      } finally {
        releaseWriteLock();
      }
    }
  }

  async delete(uuid: string): Promise<boolean> {
    if (this.isCloudMode) {
      try {
        await this.db!.collection('players').doc(uuid).delete();
        await this.db!.collection('saves').doc(uuid).delete();
        return true;
      } catch (err) {
        console.error('[Store] Firestore error in delete:', err);
        return false;
      }
    } else {
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
  }

  async atomicUpdate(
    uuid: string,
    mutator: (profile: PlayerProfile) => PlayerProfile
  ): Promise<PlayerProfile | null> {
    if (this.isCloudMode) {
      try {
        const docRef = this.db!.collection('players').doc(uuid);
        const result = await this.db!.runTransaction(async (transaction) => {
          const doc = await transaction.get(docRef);
          if (!doc.exists) return null;
          const data = doc.data() as PlayerProfile;
          const updated = mutator(data);
          // Sync lowercase search field
          (updated as any).username_lowercase = updated.username.toLowerCase();
          transaction.set(docRef, updated);
          return updated;
        });
        return result;
      } catch (err) {
        console.error(`[Store] Firestore error in atomicUpdate(${uuid}):`, err);
        return null;
      }
    } else {
      await acquireWriteLock();
      try {
        const profile = this.players.get(uuid);
        if (!profile) return null;

        const clone = JSON.parse(JSON.stringify(profile)) as PlayerProfile;
        const updated = mutator(clone);

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
  }

  // ─── Game Save Persistence ───────────────────────────────────────

  async saveGameState(uuid: string, saveState: any): Promise<void> {
    if (this.isCloudMode) {
      try {
        await this.db!.collection('saves').doc(uuid).set({
          uuid,
          saveState,
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.error(`[Store] Firestore error saving game state for ${uuid}:`, err);
        throw err;
      }
    } else {
      const SAVES_DIR = join(DATA_DIR, 'saves');
      if (!existsSync(SAVES_DIR)) {
        mkdirSync(SAVES_DIR, { recursive: true });
      }
      const saveFile = join(SAVES_DIR, `${uuid}.json`);
      await new Promise<void>((resolve, reject) => {
        writeFile(saveFile, JSON.stringify(saveState, null, 2), 'utf-8', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  async loadGameState(uuid: string): Promise<any | null> {
    if (this.isCloudMode) {
      try {
        const doc = await this.db!.collection('saves').doc(uuid).get();
        if (!doc.exists) return null;
        return doc.data()?.saveState ?? null;
      } catch (err) {
        console.error(`[Store] Firestore error loading game state for ${uuid}:`, err);
        return null;
      }
    } else {
      const saveFile = join(DATA_DIR, 'saves', `${uuid}.json`);
      if (!existsSync(saveFile)) return null;
      try {
        const raw = await new Promise<string>((resolve, reject) => {
          readFile(saveFile, 'utf-8', (err, content) => {
            if (err) reject(err);
            else resolve(content);
          });
        });
        return JSON.parse(raw);
      } catch (err) {
        console.error('[Store] Failed to read local save file:', err);
        return null;
      }
    }
  }

  get size(): number {
    return this.players.size;
  }
}

// ─── Singleton Export ────────────────────────────────────────────

export const playerStore = new PlayerStore();

// Auto-flush local data every 30 seconds
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
