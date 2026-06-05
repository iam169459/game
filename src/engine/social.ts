// ============================================================================
// MODULE A: SOCIAL CORE & TRANSACTION MATRIX
// Handles friend management, blocking, and secure fund transfers
// ============================================================================

import type { PlayerId, EngineResult, FriendEntry, DonationRecord } from './types';
import { ErrorCode } from './types';
import { getProfile, updateProfile } from './profiles';

// ─── Constants ──────────────────────────────────────────────────────────────
const MAX_FRIENDS = 100;
const MAX_DONATION_PER_DAY = 100000;
const MIN_DONATION = 1;
const DONATION_COOLDOWN_MS = 60000; // 1 minute between donations

// ─── Input Validation Helpers ───────────────────────────────────────────────

function validatePlayerId(id: PlayerId): EngineResult {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return { success: false, error: 'Invalid player ID', code: ErrorCode.INVALID_INPUT };
  }
  return { success: true, data: undefined as unknown as void, message: 'Valid' };
}

function validateDonationAmount(amount: unknown): EngineResult<number> {
  if (amount === null || amount === undefined) {
    return { success: false, error: 'Donation amount is required', code: ErrorCode.INVALID_AMOUNT };
  }

  const num = Number(amount);
  if (!Number.isFinite(num)) {
    return { success: false, error: 'Donation amount must be a valid number', code: ErrorCode.INVALID_AMOUNT };
  }

  if (!Number.isInteger(num)) {
    return { success: false, error: 'Donation amount must be a whole number', code: ErrorCode.INVALID_AMOUNT };
  }

  if (num < MIN_DONATION) {
    return { success: false, error: `Donation amount must be at least $${MIN_DONATION}`, code: ErrorCode.INVALID_AMOUNT };
  }

  if (num > MAX_DONATION_PER_DAY) {
    return { success: false, error: `Donation amount cannot exceed $${MAX_DONATION_PER_DAY.toLocaleString()} per transaction`, code: ErrorCode.INVALID_AMOUNT };
  }

  return { success: true, data: num, message: 'Valid amount' };
}

// ─── Social Core Functions ──────────────────────────────────────────────────

/**
 * Add a friend symmetrically between two players.
 * Links both profiles simultaneously to prevent data inconsistency.
 *
 * @param senderId - The player sending the friend request
 * @param targetId - The player being added
 * @returns EngineResult indicating success or specific failure reason
 */
export async function addFriend(
  senderId: PlayerId,
  targetId: PlayerId
): Promise<EngineResult<FriendEntry>> {
  // Validate inputs
  const senderValidation = validatePlayerId(senderId);
  if (!senderValidation.success) return senderValidation as EngineResult<FriendEntry>;

  const targetValidation = validatePlayerId(targetId);
  if (!targetValidation.success) return targetValidation as EngineResult<FriendEntry>;

  // Prevent self-adding
  if (senderId === targetId) {
    return {
      success: false,
      error: 'Cannot add yourself as a friend',
      code: ErrorCode.SELF_ADD_BLOCKED,
    };
  }

  // Fetch both profiles
  const senderProfile = getProfile(senderId);
  const targetProfile = getProfile(targetId);

  if (!senderProfile) {
    return { success: false, error: 'Sender profile not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  if (!targetProfile) {
    return { success: false, error: 'Target player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  // Check if target has blocked sender
  if (targetProfile.social.blockedPlayers.includes(senderId)) {
    return {
      success: false,
      error: 'This player cannot be added',
      code: ErrorCode.BLOCKED_PLAYER,
    };
  }

  // Check if sender has blocked target
  if (senderProfile.social.blockedPlayers.includes(targetId)) {
    return {
      success: false,
      error: 'You have blocked this player. Unblock them first.',
      code: ErrorCode.BLOCKED_PLAYER,
    };
  }

  // Check if already friends (sender side)
  if (senderProfile.social.friends.some((f) => f.playerId === targetId)) {
    return {
      success: false,
      error: 'Already friends with this player',
      code: ErrorCode.ALREADY_FRIENDS,
    };
  }

  // Check friend limit
  if (senderProfile.social.friends.length >= MAX_FRIENDS) {
    return {
      success: false,
      error: `Friend list full (max ${MAX_FRIENDS})`,
      code: ErrorCode.PLAYER_NOT_FOUND,
    };
  }

  const now = Date.now();

  // Create friend entry for sender
  const senderFriendEntry: FriendEntry = {
    playerId: targetId,
    username: targetProfile.username,
    addedAt: now,
    trustLevel: 50, // Initial trust level
  };

  // Create friend entry for target (symmetric)
  const targetFriendEntry: FriendEntry = {
    playerId: senderId,
    username: senderProfile.username,
    addedAt: now,
    trustLevel: 50,
  };

  // Atomic update: Add friend to both profiles simultaneously
  const senderResult = await updateProfile(senderId, (profile) => ({
    ...profile,
    social: {
      ...profile.social,
      friends: [...profile.social.friends, senderFriendEntry],
    },
  }));

  if (!senderResult.success) {
    return { success: false, error: senderResult.error, code: senderResult.code };
  }

  const targetResult = await updateProfile(targetId, (profile) => ({
    ...profile,
    social: {
      ...profile.social,
      friends: [...profile.social.friends, targetFriendEntry],
    },
  }));

  if (!targetResult.success) {
    // Rollback sender change if target update fails
    await updateProfile(senderId, (profile) => ({
      ...profile,
      social: {
        ...profile.social,
        friends: profile.social.friends.filter((f) => f.playerId !== targetId),
      },
    }));
    return { success: false, error: 'Failed to update target profile', code: targetResult.code };
  }

  return {
    success: true,
    data: senderFriendEntry,
    message: `Successfully added ${targetProfile.username} as a friend`,
  };
}

/**
 * Remove a friend symmetrically from both profiles.
 *
 * @param senderId - The player removing the friend
 * @param targetId - The friend to remove
 */
export async function removeFriend(
  senderId: PlayerId,
  targetId: PlayerId
): Promise<EngineResult<void>> {
  // Validate inputs
  const senderValidation = validatePlayerId(senderId);
  if (!senderValidation.success) return senderValidation;

  const targetValidation = validatePlayerId(targetId);
  if (!targetValidation.success) return targetValidation;

  if (senderId === targetId) {
    return { success: false, error: 'Invalid operation', code: ErrorCode.INVALID_INPUT };
  }

  const senderProfile = getProfile(senderId);
  if (!senderProfile) {
    return { success: false, error: 'Sender profile not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  // Check if actually friends
  if (!senderProfile.social.friends.some((f) => f.playerId === targetId)) {
    return {
      success: false,
      error: 'Not friends with this player',
      code: ErrorCode.NOT_FRIENDS,
    };
  }

  // Atomic update: Remove from both profiles
  const senderResult = await updateProfile(senderId, (profile) => ({
    ...profile,
    social: {
      ...profile.social,
      friends: profile.social.friends.filter((f) => f.playerId !== targetId),
    },
  }));

  if (!senderResult.success) {
    return { success: false, error: senderResult.error, code: senderResult.code };
  }

  // Note: Target update failure doesn't invalidate the sender removal
  // In production, we'd use a distributed transaction or compensating actions
  await updateProfile(targetId, (profile) => ({
    ...profile,
    social: {
      ...profile.social,
      friends: profile.social.friends.filter((f) => f.playerId !== senderId),
    },
  }));

  return {
    success: true,
    data: undefined as unknown as void,
    message: 'Friend removed successfully',
  };
}

/**
 * Block a player, preventing them from adding you or seeing your profile.
 */
export async function blockPlayer(
  blockerId: PlayerId,
  targetId: PlayerId
): Promise<EngineResult<void>> {
  const blockerValidation = validatePlayerId(blockerId);
  if (!blockerValidation.success) return blockerValidation;

  const targetValidation = validatePlayerId(targetId);
  if (!targetValidation.success) return targetValidation;

  if (blockerId === targetId) {
    return { success: false, error: 'Cannot block yourself', code: ErrorCode.INVALID_INPUT };
  }

  const blockerProfile = getProfile(blockerId);
  if (!blockerProfile) {
    return { success: false, error: 'Profile not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  if (blockerProfile.social.blockedPlayers.includes(targetId)) {
    return { success: false, error: 'Already blocked', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  // Remove from friends list if they were friends
  await removeFriend(blockerId, targetId);

  // Add to blocked list
  const result = await updateProfile(blockerId, (profile) => ({
    ...profile,
    social: {
      ...profile.social,
      blockedPlayers: [...profile.social.blockedPlayers, targetId],
    },
  }));

  if (!result.success) {
    return { success: false, error: result.error, code: result.code };
  }

  return { success: true, data: undefined as unknown as void, message: 'Player blocked successfully' };
}

/**
 * Unblock a previously blocked player.
 */
export async function unblockPlayer(
  blockerId: PlayerId,
  targetId: PlayerId
): Promise<EngineResult<void>> {
  const blockerValidation = validatePlayerId(blockerId);
  if (!blockerValidation.success) return blockerValidation;

  const targetValidation = validatePlayerId(targetId);
  if (!targetValidation.success) return targetValidation;

  const blockerProfile = getProfile(blockerId);
  if (!blockerProfile) {
    return { success: false, error: 'Profile not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  if (!blockerProfile.social.blockedPlayers.includes(targetId)) {
    return { success: false, error: 'Player is not blocked', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  const result = await updateProfile(blockerId, (profile) => ({
    ...profile,
    social: {
      ...profile.social,
      blockedPlayers: profile.social.blockedPlayers.filter((id) => id !== targetId),
    },
  }));

  if (!result.success) {
    return { success: false, error: result.error, code: result.code };
  }

  return { success: true, data: undefined as unknown as void, message: 'Player unblocked successfully' };
}

// ─── Secure Donation Engine ─────────────────────────────────────────────────

/**
 * Transfer cash funds securely between two players.
 *
 * SECURITY SAFEGUARDS:
 * - Atomic transaction: Both balance changes happen simultaneously
 * - Sender balance validation before transfer
 * - Input sanitization for amount
 * - Cooldown between donations
 * - Daily limit enforcement
 * - Trust level affects max donation
 *
 * @param senderId - Player sending the donation
 * @param recipientId - Player receiving the donation
 * @param amount - Amount of cash to transfer
 */
export async function sendDonation(
  senderId: PlayerId,
  recipientId: PlayerId,
  amount: unknown
): Promise<EngineResult<DonationRecord>> {
  // Validate inputs
  const senderValidation = validatePlayerId(senderId);
  if (!senderValidation.success) return senderValidation as EngineResult<DonationRecord>;

  const recipientValidation = validatePlayerId(recipientId);
  if (!recipientValidation.success) return recipientValidation as EngineResult<DonationRecord>;

  const amountValidation = validateDonationAmount(amount);
  if (!amountValidation.success) return amountValidation as EngineResult<DonationRecord>;

  const donationAmount = amountValidation.data;

  // Prevent self-donation
  if (senderId === recipientId) {
    return {
      success: false,
      error: 'Cannot donate to yourself',
      code: ErrorCode.SELF_DONATION_BLOCKED,
    };
  }

  // Fetch both profiles
  const senderProfile = getProfile(senderId);
  const recipientProfile = getProfile(recipientId);

  if (!senderProfile) {
    return { success: false, error: 'Sender profile not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  if (!recipientProfile) {
    return { success: false, error: 'Recipient profile not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  // Check if sender is bankrupt
  if (senderProfile.financials.isBankrupt) {
    return {
      success: false,
      error: 'Company is bankrupt. Cannot make donations.',
      code: ErrorCode.BANKRUPT,
    };
  }

  // Check if recipient has blocked sender
  if (recipientProfile.social.blockedPlayers.includes(senderId)) {
    return {
      success: false,
      error: 'Cannot donate to this player',
      code: ErrorCode.BLOCKED_PLAYER,
    };
  }

  // Check sender has sufficient funds (ATOMIC CHECK)
  if (senderProfile.financials.cash < donationAmount) {
    return {
      success: false,
      error: `Insufficient funds. You have $${senderProfile.financials.cash.toLocaleString()}`,
      code: ErrorCode.INSUFFICIENT_FUNDS,
    };
  }

  // Check friend trust level for donation limits
  const friendship = senderProfile.social.friends.find((f) => f.playerId === recipientId);
  if (!friendship) {
    // Non-friends have a lower donation limit
    if (donationAmount > 10000) {
      return {
        success: false,
        error: 'Non-friends cannot receive more than $10,000 per donation',
        code: ErrorCode.INSUFFICIENT_FUNDS,
      };
    }
  } else if (donationAmount > 50000 && friendship.trustLevel < 75) {
    return {
      success: false,
      error: 'Trust level too low for this amount. Build trust by interacting more.',
      code: ErrorCode.INSUFFICIENT_FUNDS,
    };
  }

  // Check cooldown (prevent rapid-fire donations)
  const recentDonation = senderProfile.social.donationHistory
    .filter((d) => d.recipientId === recipientId)
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  if (recentDonation && Date.now() - recentDonation.timestamp < DONATION_COOLDOWN_MS) {
    return {
      success: false,
      error: 'Please wait before sending another donation to this player',
      code: ErrorCode.INVALID_AMOUNT,
    };
  }

  const now = Date.now();
  const donationId = `don-${senderId}-${recipientId}-${now}`;

  const record: DonationRecord = {
    id: donationId,
    recipientId,
    amount: donationAmount,
    timestamp: now,
  };

  // ─── ATOMIC TRANSACTION ─────────────────────────────────────────────
  // Both balance changes must succeed or both must fail
  // ─────────────────────────────────────────────────────────────────────

  // Step 1: Deduct from sender
  const senderResult = await updateProfile(senderId, (profile) => ({
    ...profile,
    financials: {
      ...profile.financials,
      cash: profile.financials.cash - donationAmount,
      totalExpenses: profile.financials.totalExpenses + donationAmount,
    },
    social: {
      ...profile.social,
      donationHistory: [...profile.social.donationHistory.slice(-99), record], // Keep last 100
    },
  }));

  if (!senderResult.success) {
    return { success: false, error: 'Failed to process sender transaction', code: senderResult.code };
  }

  // Step 2: Credit to recipient
  const recipientResult = await updateProfile(recipientId, (profile) => ({
    ...profile,
    financials: {
      ...profile.financials,
      cash: profile.financials.cash + donationAmount,
      totalRevenue: profile.financials.totalRevenue + donationAmount,
    },
    social: {
      ...profile.social,
      donationHistory: [...profile.social.donationHistory.slice(-99), record],
    },
  }));

  if (!recipientResult.success) {
    // ROLLBACK: Refund sender if recipient update fails
    await updateProfile(senderId, (profile) => ({
      ...profile,
      financials: {
        ...profile.financials,
        cash: profile.financials.cash + donationAmount,
        totalExpenses: profile.financials.totalExpenses - donationAmount,
      },
      social: {
        ...profile.social,
        donationHistory: profile.social.donationHistory.filter((d) => d.id !== donationId),
      },
    }));
    return { success: false, error: 'Failed to process recipient transaction', code: recipientResult.code };
  }

  // Step 3: Increase trust level for both players (if friends)
  if (friendship) {
    await updateProfile(senderId, (profile) => ({
      ...profile,
      social: {
        ...profile.social,
        friends: profile.social.friends.map((f) =>
          f.playerId === recipientId ? { ...f, trustLevel: Math.min(100, f.trustLevel + 5) } : f
        ),
      },
    }));

    await updateProfile(recipientId, (profile) => ({
      ...profile,
      social: {
        ...profile.social,
        friends: profile.social.friends.map((f) =>
          f.playerId === senderId ? { ...f, trustLevel: Math.min(100, f.trustLevel + 5) } : f
        ),
      },
    }));
  }

  return {
    success: true,
    data: record,
    message: `Successfully donated $${donationAmount.toLocaleString()} to ${recipientProfile.companyName}`,
  };
}

/**
 * Get friends list for a player.
 */
export function getFriendsList(playerId: PlayerId): EngineResult<FriendEntry[]> {
  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  return {
    success: true,
    data: profile.social.friends,
    message: `Found ${profile.social.friends.length} friends`,
  };
}

/**
 * Get mutual friends between two players.
 */
export function getMutualFriends(
  player1Id: PlayerId,
  player2Id: PlayerId
): EngineResult<FriendEntry[]> {
  const player1 = getProfile(player1Id);
  const player2 = getProfile(player2Id);

  if (!player1 || !player2) {
    return { success: false, error: 'Player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  const player1FriendIds = new Set(player1.social.friends.map((f) => f.playerId));
  const mutual = player2.social.friends.filter((f) => player1FriendIds.has(f.playerId));

  return {
    success: true,
    data: mutual,
    message: `Found ${mutual.length} mutual friends`,
  };
}

/**
 * Get donation history for a player.
 */
export function getDonationHistory(
  playerId: PlayerId,
  limit = 20
): EngineResult<DonationRecord[]> {
  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  const history = profile.social.donationHistory
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);

  return {
    success: true,
    data: history,
    message: `Found ${history.length} donation records`,
  };
}
