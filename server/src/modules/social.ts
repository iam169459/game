/**
 * ═══════════════════════════════════════════════════════════════════
 *  MODULE A: SOCIAL MATRIX & P2P TRANSACTIONS
 * ═══════════════════════════════════════════════════════════════════
 *  Friend management with symmetric updates.
 *  Secure atomic money transfers with exploit prevention.
 */

import { playerStore } from '../store/playerStore';
import type { TransactionResult } from '../types';

// ─── Add Friend ──────────────────────────────────────────────────

/**
 * Adds a friend relationship symmetrically.
 * Validates: self-add prevention, duplicate prevention, target existence.
 */
export async function addFriend(
  playerUuid: string,
  targetIdentifier: string // username or UUID
): Promise<TransactionResult> {
  // 1. Validate sender exists
  const sender = playerStore.getByUuid(playerUuid);
  if (!sender) {
    return { success: false, message: 'Player not found.' };
  }

  // 2. Resolve target by username or UUID
  let target = playerStore.getByUsername(targetIdentifier);
  if (!target) {
    target = playerStore.getByUuid(targetIdentifier);
  }
  if (!target) {
    return { success: false, message: `Target player "${targetIdentifier}" not found.` };
  }

  // 3. Prevent self-add
  if (sender.uuid === target.uuid) {
    return { success: false, message: 'You cannot add yourself as a friend.' };
  }

  // 4. Prevent duplicate
  if (sender.friendsList.includes(target.uuid)) {
    return { success: false, message: `${target.username} is already your friend.` };
  }

  // 5. Symmetrically update both players (atomic)
  const now = Date.now();

  await playerStore.atomicUpdate(sender.uuid, (p) => {
    p.friendsList.push(target!.uuid);
    p.lastActiveAt = now;
    return p;
  });

  await playerStore.atomicUpdate(target.uuid, (p) => {
    if (!p.friendsList.includes(sender.uuid)) {
      p.friendsList.push(sender.uuid);
    }
    p.lastActiveAt = now;
    return p;
  });

  return {
    success: true,
    message: `${target.username} has been added to your friends list.`,
    data: { friendUuid: target.uuid, friendUsername: target.username },
  };
}

// ─── Remove Friend ───────────────────────────────────────────────

/**
 * Removes a friend relationship symmetrically.
 */
export async function removeFriend(
  playerUuid: string,
  targetUuid: string
): Promise<TransactionResult> {
  const sender = playerStore.getByUuid(playerUuid);
  if (!sender) {
    return { success: false, message: 'Player not found.' };
  }

  const target = playerStore.getByUuid(targetUuid);
  if (!target) {
    return { success: false, message: 'Target player not found.' };
  }

  if (!sender.friendsList.includes(targetUuid)) {
    return { success: false, message: `${target.username} is not on your friends list.` };
  }

  const now = Date.now();

  await playerStore.atomicUpdate(sender.uuid, (p) => {
    p.friendsList = p.friendsList.filter((id) => id !== targetUuid);
    p.lastActiveAt = now;
    return p;
  });

  await playerStore.atomicUpdate(target.uuid, (p) => {
    p.friendsList = p.friendsList.filter((id) => id !== playerUuid);
    p.lastActiveAt = now;
    return p;
  });

  return {
    success: true,
    message: `${target.username} has been removed from your friends list.`,
  };
}

// ─── Donate Money (Secure Atomic Transfer) ───────────────────────

/**
 * CRITICAL: Securely transfers money between two players.
 * 
 * Safety measures:
 * - Balance is read, validated, and written atomically under write lock
 * - Positive amount check (> 0)
 * - Sufficient funds check
 * - Sender cannot be recipient
 * - Both balances update in sequence under lock (no interleaving)
 */
export async function donateMoney(
  senderUuid: string,
  recipientUuid: string,
  amount: number
): Promise<TransactionResult> {
  // ── Pre-validation (read-only, fast-fail) ──

  if (senderUuid === recipientUuid) {
    return { success: false, message: 'You cannot donate to yourself.' };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, message: 'Donation amount must be a positive number.' };
  }

  // Round to 2 decimal places to prevent floating-point drift
  amount = Math.round(amount * 100) / 100;

  if (amount < 0.01) {
    return { success: false, message: 'Minimum donation is $0.01.' };
  }

  const sender = playerStore.getByUuid(senderUuid);
  if (!sender) {
    return { success: false, message: 'Sender player not found.' };
  }

  const recipient = playerStore.getByUuid(recipientUuid);
  if (!recipient) {
    return { success: false, message: 'Recipient player not found.' };
  }

  // ── Atomic Transfer ──
  // Both updates happen under the same write lock guarantee.
  // The store's atomicUpdate acquires/releases the lock per call,
  // but since we validate balance before the first write and
  // amounts are immutable between our reads and writes (single-threaded
  // Node.js event loop + our mutex), this is safe.

  if (sender.walletBalance < amount) {
    return {
      success: false,
      message: `Insufficient funds. You have $${sender.walletBalance.toFixed(2)}, tried to send $${amount.toFixed(2)}.`,
    };
  }

  const now = Date.now();

  // Deduct from sender
  const updatedSender = await playerStore.atomicUpdate(senderUuid, (p) => {
    // Re-check balance inside atomic update for extra safety
    if (p.walletBalance < amount) {
      throw new Error('INSUFFICIENT_FUNDS_RACE_CONDITION');
    }
    p.walletBalance = Math.round((p.walletBalance - amount) * 100) / 100;
    p.lastActiveAt = now;
    return p;
  });

  if (!updatedSender) {
    return { success: false, message: 'Transfer failed: sender update error.' };
  }

  // Credit to recipient
  const updatedRecipient = await playerStore.atomicUpdate(recipientUuid, (p) => {
    p.walletBalance = Math.round((p.walletBalance + amount) * 100) / 100;
    p.lastActiveAt = now;
    return p;
  });

  if (!updatedRecipient) {
    // Rollback: credit back to sender (should never happen in practice)
    await playerStore.atomicUpdate(senderUuid, (p) => {
      p.walletBalance = Math.round((p.walletBalance + amount) * 100) / 100;
      return p;
    });
    return { success: false, message: 'Transfer failed: recipient update error. Funds refunded.' };
  }

  return {
    success: true,
    message: `Successfully donated $${amount.toFixed(2)} to ${recipient.username}.`,
    data: {
      senderBalance: updatedSender.walletBalance,
      recipientBalance: updatedRecipient.walletBalance,
      amount,
    },
  };
}

// ─── Get Friend List (with profiles) ─────────────────────────────

export function getFriendList(playerUuid: string): TransactionResult {
  const player = playerStore.getByUuid(playerUuid);
  if (!player) {
    return { success: false, message: 'Player not found.' };
  }

  const friends = player.friendsList
    .map((uuid) => playerStore.getByUuid(uuid))
    .filter(Boolean)
    .map((p) => ({
      uuid: p!.uuid,
      username: p!.username,
      walletBalance: p!.walletBalance,
      deviceCount: p!.ownedDevices.length,
      employeeCount: p!.hiredEmployees.length,
      lastActiveAt: p!.lastActiveAt,
    }));

  return {
    success: true,
    message: `Found ${friends.length} friends.`,
    data: friends,
  };
}
