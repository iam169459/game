// ============================================================================
// MODULE C: PRICE POSITIONING, MANUFACTURING & LAUNCH
// Commercial price slider tool and device finalization
// ============================================================================

import type {
  PlayerId,
  DeviceId,
  EngineResult,
  DeviceProduct,
} from './types';
import { ErrorCode } from './types';
import { getProfile, updateProfile } from './profiles';

// ─── Input Validation ───────────────────────────────────────────────────────

function validatePlayerId(id: PlayerId): EngineResult {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return { success: false, error: 'Invalid player ID', code: ErrorCode.INVALID_INPUT };
  }
  return { success: true, data: undefined as unknown as void, message: 'Valid' };
}

function validatePrice(price: unknown): EngineResult<number> {
  if (price === null || price === undefined) {
    return { success: false, error: 'Price is required', code: ErrorCode.INVALID_AMOUNT };
  }

  const num = Number(price);
  if (!Number.isFinite(num)) {
    return { success: false, error: 'Price must be a valid number', code: ErrorCode.INVALID_AMOUNT };
  }

  if (num <= 0) {
    return { success: false, error: 'Price must be greater than zero', code: ErrorCode.INVALID_AMOUNT };
  }

  if (num < 1) {
    return { success: false, error: 'Price must be at least $1', code: ErrorCode.INVALID_AMOUNT };
  }

  if (num > 100000) {
    return { success: false, error: 'Price cannot exceed $100,000', code: ErrorCode.INVALID_AMOUNT };
  }

  return { success: true, data: num, message: 'Valid price' };
}

// ─── Module C: Price Positioning Functions ──────────────────────────────────

/**
 * Commercial Price Slider Tool
 *
 * Finalizes device pricing by validating against manufacturing cost.
 * Calculates net profit margin and blocks negative margins.
 *
 * STRICT VALIDATION:
 * 1. Device must exist and belong to player
 * 2. Device must not already be finalized
 * 3. Target sale price must be higher than manufacturing cost
 * 4. Net profit margin must be positive
 *
 * @param playerId - The player's ID
 * @param deviceId - The device to price
 * @param targetSalePrice - The intended retail price
 */
export async function finalizeDevicePricing(
  playerId: PlayerId,
  deviceId: DeviceId,
  targetSalePrice: unknown
): Promise<EngineResult<{
  device: DeviceProduct;
  manufacturingCost: number;
  targetSalePrice: number;
  netProfitMargin: number;
  marginPercentage: number;
}>> {
  // Validate player ID
  const idValidation = validatePlayerId(playerId);
  if (!idValidation.success) return idValidation as EngineResult<any>;

  // Validate device ID
  if (!deviceId || typeof deviceId !== 'string') {
    return { success: false, error: 'Invalid device ID', code: ErrorCode.INVALID_INPUT };
  }

  // Validate price
  const priceValidation = validatePrice(targetSalePrice);
  if (!priceValidation.success) return priceValidation as EngineResult<any>;

  const salePrice = priceValidation.data;

  // Fetch player profile
  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player profile not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  if (profile.financials.isBankrupt) {
    return { success: false, error: 'Company is bankrupt - cannot finalize pricing', code: ErrorCode.BANKRUPT };
  }

  // Find the device
  const deviceIndex = profile.devices.findIndex((d) => d.id === deviceId);
  if (deviceIndex === -1) {
    return {
      success: false,
      error: 'Device not found. Verify the device ID is correct.',
      code: ErrorCode.PLAYER_NOT_FOUND,
    };
  }

  const device = profile.devices[deviceIndex];

  // Check if already finalized
  if (device.isFinalized) {
    return {
      success: false,
      error: 'Device pricing is already finalized. Create a new device to set different pricing.',
      code: ErrorCode.DEVICE_ALREADY_FINALIZED,
    };
  }

  // Get manufacturing cost from device specs
  const manufacturingCost = device.manufacturingCost;

  // STRICT VALIDATION: Price must be higher than manufacturing cost
  if (salePrice <= manufacturingCost) {
    const deficit = manufacturingCost - salePrice;
    return {
      success: false,
      error: `PRICE BELOW COST ERROR: Target price ($${salePrice.toFixed(2)}) is $${deficit.toFixed(2)} below manufacturing cost ($${manufacturingCost.toFixed(2)}). Cannot finalize with negative margin.`,
      code: ErrorCode.PRICE_BELOW_COST,
    };
  }

  // Calculate net profit margin
  const netProfitMargin = salePrice - manufacturingCost;
  const marginPercentage = (netProfitMargin / salePrice) * 100;

  // Warning for very low margins
  if (marginPercentage < 5) {
    // Allow but warn
  }

  // Update device with finalized pricing
  const updatedDevice: DeviceProduct = {
    ...device,
    retailPrice: salePrice,
    netProfitMargin,
    isFinalized: true,
  };

  const result = await updateProfile(playerId, (profile) => ({
    ...profile,
    devices: profile.devices.map((d) => (d.id === deviceId ? updatedDevice : d)),
  }));

  if (!result.success) {
    return { success: false, error: result.error, code: result.code };
  }

  return {
    success: true,
    data: {
      device: updatedDevice,
      manufacturingCost,
      targetSalePrice: salePrice,
      netProfitMargin,
      marginPercentage,
    },
    message: `Pricing finalized: $${salePrice.toFixed(2)} (Margin: ${marginPercentage.toFixed(1)}%, Net: $${netProfitMargin.toFixed(2)}/unit)`,
  };
}

/**
 * Preview pricing analysis without finalizing.
 * Useful for the price slider UI.
 */
export function previewPricing(
  deviceId: DeviceId,
  targetSalePrice: unknown,
  profile: ReturnType<typeof getProfile>
): EngineResult<{
  manufacturingCost: number;
  targetSalePrice: number;
  grossMargin: number;
  grossMarginPercent: number;
  platformFee: number;
  marketingBuffer: number;
  netProfit: number;
  netMarginPercent: number;
  breakEvenUnits: number;
  projectedDailyRevenue: number;
}> {
  if (!profile) {
    return { success: false, error: 'Player profile not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  const priceValidation = validatePrice(targetSalePrice);
  if (!priceValidation.success) return priceValidation as EngineResult<any>;

  const salePrice = priceValidation.data;
  const device = profile.devices.find((d) => d.id === deviceId);

  if (!device) {
    return { success: false, error: 'Device not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  const manufacturingCost = device.manufacturingCost;
  const grossMargin = salePrice - manufacturingCost;
  const grossMarginPercent = (grossMargin / salePrice) * 100;

  // Calculate fees
  const platformFee = salePrice * 0.10;
  const marketingBuffer = salePrice * 0.05;
  const netProfit = grossMargin - platformFee - marketingBuffer;
  const netMarginPercent = (netProfit / salePrice) * 100;

  // Break-even analysis
  const setupCost = 10000; // Device setup cost
  const breakEvenUnits = Math.ceil(setupCost / Math.max(0.01, netProfit));

  // Projected daily revenue based on fanbase
  const fans = profile.financials.fans;
  const qualityFactor = device.qualityScore / 10;
  const projectedDailyUnits = Math.max(0, Math.round((fans * qualityFactor) / (salePrice / 100)));
  const projectedDailyRevenue = projectedDailyUnits * netProfit;

  return {
    success: true,
    data: {
      manufacturingCost,
      targetSalePrice: salePrice,
      grossMargin,
      grossMarginPercent,
      platformFee,
      marketingBuffer,
      netProfit,
      netMarginPercent,
      breakEvenUnits,
      projectedDailyRevenue,
    },
    message: `Pricing preview: $${salePrice.toFixed(2)} → Net $${netProfit.toFixed(2)}/unit (${netMarginPercent.toFixed(1)}%)`,
  };
}

/**
 * Update pricing for a non-finalized device.
 */
export async function updateDevicePricing(
  playerId: PlayerId,
  deviceId: DeviceId,
  newPrice: unknown
): Promise<EngineResult<DeviceProduct>> {
  const idValidation = validatePlayerId(playerId);
  if (!idValidation.success) return idValidation as EngineResult<DeviceProduct>;

  const priceValidation = validatePrice(newPrice);
  if (!priceValidation.success) return priceValidation as EngineResult<DeviceProduct>;

  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  const device = profile.devices.find((d) => d.id === deviceId);
  if (!device) {
    return { success: false, error: 'Device not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  if (device.isFinalized) {
    return {
      success: false,
      error: 'Cannot update pricing after finalization',
      code: ErrorCode.DEVICE_ALREADY_FINALIZED,
    };
  }

  const salePrice = priceValidation.data;
  if (salePrice <= device.manufacturingCost) {
    return {
      success: false,
      error: `Price ($${salePrice.toFixed(2)}) must be above manufacturing cost ($${device.manufacturingCost.toFixed(2)})`,
      code: ErrorCode.PRICE_BELOW_COST,
    };
  }

  const updatedDevice: DeviceProduct = {
    ...device,
    retailPrice: salePrice,
    netProfitMargin: salePrice - device.manufacturingCost,
  };

  const result = await updateProfile(playerId, (profile) => ({
    ...profile,
    devices: profile.devices.map((d) => (d.id === deviceId ? updatedDevice : d)),
  }));

  if (!result.success) {
    return { success: false, error: result.error, code: result.code };
  }

  return {
    success: true,
    data: updatedDevice,
    message: `Price updated to $${salePrice.toFixed(2)}`,
  };
}

/**
 * Discontinue a device (stop production and sales).
 */
export async function discontinueDevice(
  playerId: PlayerId,
  deviceId: DeviceId
): Promise<EngineResult<void>> {
  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  const device = profile.devices.find((d) => d.id === deviceId);
  if (!device) {
    return { success: false, error: 'Device not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  const result = await updateProfile(playerId, (profile) => ({
    ...profile,
    devices: profile.devices.map((d) =>
      d.id === deviceId ? { ...d, isActive: false } : d
    ),
  }));

  if (!result.success) {
    return { success: false, error: result.error, code: result.code };
  }

  return { success: true, data: undefined as unknown as void, message: `Device "${device.name}" discontinued` };
}

/**
 * Delete a device entirely (only if not finalized or sold).
 */
export async function deleteDevice(
  playerId: PlayerId,
  deviceId: DeviceId
): Promise<EngineResult<void>> {
  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  const device = profile.devices.find((d) => d.id === deviceId);
  if (!device) {
    return { success: false, error: 'Device not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  if (device.isFinalized) {
    return {
      success: false,
      error: 'Cannot delete a finalized device. Discontinue it instead.',
      code: ErrorCode.DEVICE_ALREADY_FINALIZED,
    };
  }

  if (device.totalUnitsSold > 0) {
    return {
      success: false,
      error: 'Cannot delete a device with sales history',
      code: ErrorCode.DEVICE_ALREADY_FINALIZED,
    };
  }

  const result = await updateProfile(playerId, (profile) => ({
    ...profile,
    devices: profile.devices.filter((d) => d.id !== deviceId),
    totalDevicesReleased: Math.max(0, profile.totalDevicesReleased - 1),
  }));

  if (!result.success) {
    return { success: false, error: result.error, code: result.code };
  }

  return { success: true, data: undefined as unknown as void, message: `Device "${device.name}" deleted` };
}

/**
 * Get all finalized devices ready for market.
 */
export function getFinalizedDevices(playerId: PlayerId): EngineResult<DeviceProduct[]> {
  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  const finalized = profile.devices.filter((d) => d.isFinalized && d.isActive);

  return {
    success: true,
    data: finalized,
    message: `Found ${finalized.length} finalized devices`,
  };
}

/**
 * Get devices pending pricing finalization.
 */
export function getPendingDevices(playerId: PlayerId): EngineResult<DeviceProduct[]> {
  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  const pending = profile.devices.filter((d) => !d.isFinalized && d.isActive);

  return {
    success: true,
    data: pending,
    message: `Found ${pending.length} devices pending finalization`,
  };
}
