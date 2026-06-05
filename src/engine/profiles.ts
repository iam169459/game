// ============================================================================
// PROFILE PERSISTENCE MODULE
// Handles player profile CRUD operations with atomic state management
// ============================================================================

import type { CompanyProfile, PlayerId, FinancialLedger, SocialMatrix, SecuritiesPortfolio } from './types';
import { ErrorCode } from './types';

// ─── In-Memory Profile Store (Production: Replace with Database) ────────────
const profileStore = new Map<PlayerId, CompanyProfile>();
const usernameIndex = new Map<string, PlayerId>();

// ─── Profile Factory ────────────────────────────────────────────────────────
export function createDefaultProfile(
  id: PlayerId,
  username: string,
  companyName: string
): CompanyProfile {
  const now = Date.now();

  const financials: FinancialLedger = {
    cash: 100000, // Starting capital
    fans: 100,
    researchCoins: 50, // Starting RC
    totalRevenue: 0,
    totalExpenses: 0,
    monthlySalaries: 0,
    monthlyMaintenance: 0,
    isBankrupt: false,
    bankruptcyFrozenAt: null,
  };

  const social: SocialMatrix = {
    friends: [],
    blockedPlayers: [],
    donationHistory: [],
  };

  const portfolio: SecuritiesPortfolio = {
    holdings: [],
    totalPortfolioValue: 0,
    totalInvested: 0,
    totalGainLoss: 0,
  };

  return {
    id,
    username: username.toLowerCase(),
    companyName,
    createdAt: now,
    lastActiveAt: now,

    financials,
    social,

    devices: [],
    retailStores: [],
    employees: [],
    portfolio,

    keynoteHistory: [],

    month: 1,
    day: 1,
    totalDevicesReleased: 0,
    companyValuation: financials.cash,
    marketShare: 0,
  };
}

// ─── Profile CRUD Operations ────────────────────────────────────────────────

/**
 * Retrieve a player profile by ID.
 * Returns undefined if not found.
 */
export function getProfile(playerId: PlayerId): CompanyProfile | undefined {
  const profile = profileStore.get(playerId);
  if (profile) {
    profile.lastActiveAt = Date.now();
  }
  return profile;
}

/**
 * Retrieve a player profile by username.
 * Returns undefined if not found.
 */
export function getProfileByUsername(username: string): CompanyProfile | undefined {
  const playerId = usernameIndex.get(username.toLowerCase());
  return playerId ? getProfile(playerId) : undefined;
}

/**
 * Check if a username is already taken.
 */
export function isUsernameTaken(username: string): boolean {
  return usernameIndex.has(username.toLowerCase());
}

/**
 * Persist a new player profile.
 * Returns the created profile or error if username exists.
 */
export function createProfile(
  id: PlayerId,
  username: string,
  companyName: string
): { success: true; profile: CompanyProfile } | { success: false; error: string; code: ErrorCode } {
  if (isUsernameTaken(username)) {
    return {
      success: false,
      error: 'Username already taken',
      code: ErrorCode.PLAYER_NOT_FOUND,
    };
  }

  const profile = createDefaultProfile(id, username, companyName);
  profileStore.set(id, profile);
  usernameIndex.set(username.toLowerCase(), id);

  return { success: true, profile };
}

/**
 * Update a profile atomically.
 * Provides a lock mechanism to prevent race conditions.
 */
const updateLocks = new Map<PlayerId, Promise<void>>();

export async function updateProfile(
  playerId: PlayerId,
  updater: (profile: CompanyProfile) => CompanyProfile
): Promise<{ success: true; profile: CompanyProfile } | { success: false; error: string; code: ErrorCode }> {
  // Wait for any pending update on this profile
  const existingLock = updateLocks.get(playerId);
  if (existingLock) {
    await existingLock;
  }

  let resolveLock: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    resolveLock = resolve;
  });
  updateLocks.set(playerId, lockPromise);

  try {
    const profile = profileStore.get(playerId);
    if (!profile) {
      return {
        success: false,
        error: 'Player not found',
        code: ErrorCode.PLAYER_NOT_FOUND,
      };
    }

    const updated = updater(profile);
    updated.lastActiveAt = Date.now();
    profileStore.set(playerId, updated);

    return { success: true, profile: updated };
  } finally {
    updateLocks.delete(playerId);
    resolveLock!();
  }
}

/**
 * Delete a player profile and clean up all indexes.
 */
export function deleteProfile(playerId: PlayerId): boolean {
  const profile = profileStore.get(playerId);
  if (!profile) return false;

  profileStore.delete(playerId);
  usernameIndex.delete(profile.username);
  return true;
}

/**
 * Get all profiles (for admin/debug purposes).
 */
export function getAllProfiles(): CompanyProfile[] {
  return Array.from(profileStore.values());
}

/**
 * Get total registered players.
 */
export function getPlayerCount(): number {
  return profileStore.size;
}

/**
 * Validate profile integrity.
 * Checks all required fields and fixes missing data.
 */
export function validateProfile(profile: CompanyProfile): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!profile.id) issues.push('Missing profile ID');
  if (!profile.username) issues.push('Missing username');
  if (!profile.companyName) issues.push('Missing company name');

  if (!profile.financials) {
    issues.push('Missing financials - initialized defaults');
    profile.financials = createDefaultProfile('', '', '').financials;
  }

  if (!profile.social) {
    issues.push('Missing social matrix - initialized defaults');
    profile.social = createDefaultProfile('', '', '').social;
  }

  if (!profile.portfolio) {
    issues.push('Missing portfolio - initialized defaults');
    profile.portfolio = createDefaultProfile('', '', '').portfolio;
  }

  if (!Array.isArray(profile.devices)) profile.devices = [];
  if (!Array.isArray(profile.retailStores)) profile.retailStores = [];
  if (!Array.isArray(profile.employees)) profile.employees = [];
  if (!Array.isArray(profile.keynoteHistory)) profile.keynoteHistory = [];

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Export profile data for persistence.
 */
export function exportProfile(profile: CompanyProfile): string {
  return JSON.stringify(profile, null, 2);
}

/**
 * Import profile data from persistence.
 */
export function importProfile(data: string): CompanyProfile | null {
  try {
    const profile = JSON.parse(data) as CompanyProfile;
    const validation = validateProfile(profile);

    if (validation.valid) {
      profileStore.set(profile.id, profile);
      usernameIndex.set(profile.username, profile.id);
      return profile;
    }

    console.warn('Profile validation issues:', validation.issues);
    return profile; // Return even with issues, validation fixes were applied
  } catch {
    return null;
  }
}
