// ============================================================================
// MULTIPLAYER CORPORATE MANAGEMENT ENGINE - MAIN ORCHESTRATOR
// Enterprise-grade facade providing unified API for all 5 engine modules
// ============================================================================

import type {
  PlayerId,
  DeviceId,
  EngineResult,
  CompanyProfile,
  GameConfig,
  DeviceProduct,
  Employee,
  RetailStore,
  KeynoteEvent,
  StockHolding,
  MarketPricePoint,
  FriendEntry,
  DonationRecord,
  HardwareSpecMatrix,
  DisplayNode,
  OpticsArray,
  BiometricSubsystem,
  SiliconMicroarch,
  OSFlashConfig,
  LogisticsPackaging,
  VenueTier,
  DeviceType,
} from './types';
import { ErrorCode, DEFAULT_GAME_CONFIG } from './types';

// Module imports
import * as Profiles from './profiles';
import * as Social from './social';
import * as Hardware from './hardware';
import * as Pricing from './pricing';
import * as Market from './market';

// ─── Engine Configuration ───────────────────────────────────────────────────

let engineConfig: GameConfig = { ...DEFAULT_GAME_CONFIG };
let isInitialized = false;

/**
 * Initialize the game engine with custom configuration.
 */
export function initializeEngine(config?: Partial<GameConfig>): void {
  if (config) {
    engineConfig = { ...DEFAULT_GAME_CONFIG, ...config };
    Market.setGameConfig(engineConfig);
  }
  isInitialized = true;
  console.log('Multiplayer Corporate Management Engine v2.0 initialized');
}

/**
 * Get current engine configuration.
 */
export function getEngineConfig(): GameConfig {
  return { ...engineConfig };
}

/**
 * Check if engine is initialized.
 */
export function isEngineReady(): boolean {
  return isInitialized;
}

// ─── Player Management ──────────────────────────────────────────────────────

/**
 * Register a new player and create their company profile.
 */
export function registerPlayer(
  playerId: PlayerId,
  username: string,
  companyName: string
): EngineResult<CompanyProfile> {
  if (!isInitialized) {
    return { success: false, error: 'Engine not initialized', code: ErrorCode.GAME_NOT_STARTED };
  }

  if (!playerId || typeof playerId !== 'string') {
    return { success: false, error: 'Invalid player ID', code: ErrorCode.INVALID_INPUT };
  }

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return { success: false, error: 'Username must be at least 3 characters', code: ErrorCode.INVALID_INPUT };
  }

  if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
    return { success: false, error: 'Company name must be at least 2 characters', code: ErrorCode.INVALID_INPUT };
  }

  const result = Profiles.createProfile(playerId, username, companyName);
  if (!result.success) {
    return { success: false, error: result.error, code: result.code };
  }

  return {
    success: true,
    data: result.profile,
    message: `Welcome, ${username}! Your company "${companyName}" has been created.`,
  };
}

/**
 * Get player profile.
 */
export function getPlayerProfile(playerId: PlayerId): EngineResult<CompanyProfile> {
  const profile = Profiles.getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }
  return { success: true, data: profile, message: 'Profile retrieved' };
}

// ─── MODULE A: Social Core & Transaction Matrix ─────────────────────────────

/**
 * Add a friend (symmetric operation).
 */
export async function addFriend(
  senderId: PlayerId,
  targetId: PlayerId
): Promise<EngineResult<FriendEntry>> {
  return Social.addFriend(senderId, targetId);
}

/**
 * Remove a friend (symmetric operation).
 */
export async function removeFriend(
  senderId: PlayerId,
  targetId: PlayerId
): Promise<EngineResult<void>> {
  return Social.removeFriend(senderId, targetId);
}

/**
 * Block a player.
 */
export async function blockPlayer(
  blockerId: PlayerId,
  targetId: PlayerId
): Promise<EngineResult<void>> {
  return Social.blockPlayer(blockerId, targetId);
}

/**
 * Unblock a player.
 */
export async function unblockPlayer(
  blockerId: PlayerId,
  targetId: PlayerId
): Promise<EngineResult<void>> {
  return Social.unblockPlayer(blockerId, targetId);
}

/**
 * Send a donation (secure atomic transfer).
 */
export async function sendDonation(
  senderId: PlayerId,
  recipientId: PlayerId,
  amount: number
): Promise<EngineResult<DonationRecord>> {
  return Social.sendDonation(senderId, recipientId, amount);
}

/**
 * Get friends list.
 */
export function getFriendsList(playerId: PlayerId): EngineResult<FriendEntry[]> {
  return Social.getFriendsList(playerId);
}

// ─── MODULE B: Hardware Specification Matrix & Assembler ────────────────────

/**
 * Configure complete hardware specifications for a device.
 * This is the core configuration constructor system.
 */
export function configureHardwareSpecs(
  display: Partial<DisplayNode>,
  optics: Partial<OpticsArray>,
  biometric: Partial<BiometricSubsystem>,
  silicon: Partial<SiliconMicroarch>,
  osFlash: Partial<OSFlashConfig>,
  packaging: Partial<LogisticsPackaging>,
  osBuildId: string
): EngineResult<HardwareSpecMatrix> {
  return Hardware.configureHardwareSpecs(display, optics, biometric, silicon, osFlash, packaging, osBuildId);
}

/**
 * Preview manufacturing cost for hardware specs.
 */
export function previewManufacturingCost(specs: HardwareSpecMatrix) {
  return Hardware.previewManufacturingCost(specs);
}

/**
 * Preview quality score for hardware specs.
 */
export function previewQualityScore(specs: HardwareSpecMatrix): EngineResult<number> {
  return Hardware.previewQualityScore(specs);
}

/**
 * Assemble a new device with complete hardware specifications.
 */
export async function assembleDevice(
  playerId: PlayerId,
  name: string,
  type: DeviceType,
  specs: HardwareSpecMatrix,
  retailPrice: number
): Promise<EngineResult<DeviceProduct>> {
  return Hardware.assembleDevice(playerId, name, type, specs, retailPrice);
}

/**
 * Get all devices for a player.
 */
export function getDevices(playerId: PlayerId): EngineResult<DeviceProduct[]> {
  return Hardware.getDevices(playerId);
}

/**
 * Get a specific device.
 */
export function getDevice(playerId: PlayerId, deviceId: string): EngineResult<DeviceProduct> {
  return Hardware.getDevice(playerId, deviceId);
}

/**
 * Update hardware specifications for a non-finalized device.
 */
export async function updateDeviceHardware(
  playerId: PlayerId,
  deviceId: string,
  specs: HardwareSpecMatrix
): Promise<EngineResult<DeviceProduct>> {
  return Hardware.updateDeviceHardware(playerId, deviceId, specs);
}

// ─── MODULE C: Price Positioning, Manufacturing & Launch ────────────────────

/**
 * Commercial Price Slider Tool - Finalize device pricing.
 * Validates against manufacturing cost and calculates margins.
 */
export async function finalizeDevicePricing(
  playerId: PlayerId,
  deviceId: DeviceId,
  targetSalePrice: number
): Promise<EngineResult<{
  device: DeviceProduct;
  manufacturingCost: number;
  targetSalePrice: number;
  netProfitMargin: number;
  marginPercentage: number;
}>> {
  return Pricing.finalizeDevicePricing(playerId, deviceId, targetSalePrice);
}

/**
 * Preview pricing analysis without finalizing.
 */
export function previewPricing(
  deviceId: DeviceId,
  targetSalePrice: number,
  playerId: PlayerId
) {
  const profile = Profiles.getProfile(playerId);
  return Pricing.previewPricing(deviceId, targetSalePrice, profile);
}

/**
 * Update pricing for a non-finalized device.
 */
export async function updateDevicePricing(
  playerId: PlayerId,
  deviceId: DeviceId,
  newPrice: number
): Promise<EngineResult<DeviceProduct>> {
  return Pricing.updateDevicePricing(playerId, deviceId, newPrice);
}

/**
 * Discontinue a device.
 */
export async function discontinueDevice(
  playerId: PlayerId,
  deviceId: DeviceId
): Promise<EngineResult<void>> {
  return Pricing.discontinueDevice(playerId, deviceId);
}

/**
 * Delete a device (only if not finalized or sold).
 */
export async function deleteDevice(
  playerId: PlayerId,
  deviceId: DeviceId
): Promise<EngineResult<void>> {
  return Pricing.deleteDevice(playerId, deviceId);
}

/**
 * Get finalized devices ready for market.
 */
export function getFinalizedDevices(playerId: PlayerId): EngineResult<DeviceProduct[]> {
  return Pricing.getFinalizedDevices(playerId);
}

/**
 * Get devices pending pricing finalization.
 */
export function getPendingDevices(playerId: PlayerId): EngineResult<DeviceProduct[]> {
  return Pricing.getPendingDevices(playerId);
}

// ─── MODULE D: Market Revenue, Keynote Hype & Automation ────────────────────

/**
 * Execute a keynote event.
 */
export async function executeKeynote(
  playerId: PlayerId,
  venueTier: VenueTier,
  deviceIds: DeviceId[]
): Promise<EngineResult<KeynoteEvent>> {
  return Market.executeKeynote(playerId, venueTier, deviceIds);
}

/**
 * Get keynote history.
 */
export function getKeynoteHistory(playerId: PlayerId): EngineResult<KeynoteEvent[]> {
  return Market.getKeynoteHistory(playerId);
}

/**
 * Get market price for a ticker.
 */
export function getMarketPrice(ticker: string): EngineResult<MarketPricePoint> {
  return Market.getMarketPrice(ticker);
}

/**
 * Get all market prices.
 */
export function getAllMarketPrices(): EngineResult<MarketPricePoint[]> {
  return Market.getAllMarketPrices();
}

/**
 * Buy company shares.
 */
export async function buyCompanyShares(
  playerId: PlayerId,
  ticker: string,
  amount: number
): Promise<EngineResult<StockHolding>> {
  return Market.buyCompanyShares(playerId, ticker, amount);
}

/**
 * Sell company shares.
 */
export async function sellCompanyShares(
  playerId: PlayerId,
  ticker: string,
  amount: number
): Promise<EngineResult<{ proceeds: number; holding: StockHolding | null }>> {
  return Market.sellCompanyShares(playerId, ticker, amount);
}

/**
 * Get player's portfolio.
 */
export function getPortfolio(playerId: PlayerId) {
  return Market.getPortfolio(playerId);
}

/**
 * Construct a retail store.
 */
export async function constructStore(
  playerId: PlayerId,
  country: string,
  region: string,
  tier: number
): Promise<EngineResult<RetailStore>> {
  return Market.constructStore(playerId, country, region, tier);
}

/**
 * Hire an employee.
 */
export async function hireEmployee(
  playerId: PlayerId,
  name: string,
  department: string,
  tier: number
): Promise<EngineResult<Employee>> {
  return Market.hireEmployee(playerId, name, department, tier);
}

// ─── Game Loop Control ──────────────────────────────────────────────────────

/**
 * Start the game loop.
 */
export function startGameLoop(intervalMs?: number): void {
  Market.startGameLoop(intervalMs);
}

/**
 * Stop the game loop.
 */
export function stopGameLoop(): void {
  Market.stopGameLoop();
}

/**
 * Get game loop status.
 */
export function getGameLoopStatus() {
  return Market.getGameLoopStatus();
}

/**
 * Process a daily tick manually.
 */
export async function processDailyTick(playerId: PlayerId) {
  return Market.processDailyTick(playerId);
}

/**
 * Process a monthly tick manually.
 */
export async function processMonthlyTick(playerId: PlayerId) {
  return Market.processMonthlyTick(playerId);
}

// ─── System Utilities ───────────────────────────────────────────────────────

/**
 * Get system health status.
 */
export function getSystemHealth() {
  const profileCount = Profiles.getPlayerCount();
  const gameLoop = Market.getGameLoopStatus();

  return {
    initialized: isInitialized,
    version: '2.0',
    modules: ['Social', 'Hardware', 'Pricing', 'Market', 'Automation'],
    profileCount,
    gameLoopRunning: gameLoop.running,
    gameLoopInterval: gameLoop.interval,
    config: engineConfig,
  };
}

/**
 * Export all engine data for persistence.
 */
export function exportAllData(): string {
  const profiles = Profiles.getAllProfiles();
  return JSON.stringify({
    version: 2,
    timestamp: Date.now(),
    profiles,
    config: engineConfig,
  }, null, 2);
}

/**
 * Import engine data from persistence.
 */
export function importAllData(data: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(data);
    if (!parsed.profiles || !Array.isArray(parsed.profiles)) {
      return { success: false, message: 'Invalid data format' };
    }

    for (const profile of parsed.profiles) {
      Profiles.importProfile(JSON.stringify(profile));
    }

    if (parsed.config) {
      initializeEngine(parsed.config);
    }

    return { success: true, message: `Imported ${parsed.profiles.length} profiles` };
  } catch {
    return { success: false, message: 'Failed to parse import data' };
  }
}

// Re-export types for consumers
export type {
  PlayerId,
  DeviceId,
  EngineResult,
  CompanyProfile,
  GameConfig,
  DeviceProduct,
  Employee,
  RetailStore,
  KeynoteEvent,
  StockHolding,
  MarketPricePoint,
  FriendEntry,
  DonationRecord,
  HardwareSpecMatrix,
  DisplayNode,
  OpticsArray,
  BiometricSubsystem,
  SiliconMicroarch,
  OSFlashConfig,
  LogisticsPackaging,
  VenueTier,
  DeviceType,
};

export { ErrorCode } from './types';
