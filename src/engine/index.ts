// ============================================================================
// MULTIPLAYER CORPORATE MANAGEMENT ENGINE v2.0
// Enterprise-grade game engine barrel export
// ============================================================================

// Main engine facade
export * from './engine';

// Individual modules (for advanced usage)
export * as Profiles from './profiles';
export * as Social from './social';
export * as Hardware from './hardware';
export * as Pricing from './pricing';
export * as Market from './market';

// Types
export type {
  PlayerId,
  DeviceId,
  BlueprintId,
  SiliconId,
  OSBuildId,
  StoreId,
  EmployeeId,
  TickerSymbol,
  Department,
  DeviceType,
  VenueTier,
  OSPlatform,
  NanometerTier,
  RAMType,
  SoCBrand,
  BiometricPlacement,
  ResolutionTier,
  MaterialType,
  FinancialLedger,
  FriendEntry,
  SocialMatrix,
  DonationRecord,
  DisplayNode,
  OpticsArray,
  BiometricSubsystem,
  GPUArchitecture,
  SiliconMicroarch,
  OSFlashConfig,
  LogisticsPackaging,
  HardwareSpecMatrix,
  DeviceProduct,
  RetailStore,
  Employee,
  StockHolding,
  SecuritiesPortfolio,
  KeynoteEvent,
  MarketPricePoint,
  CompanyProfile,
  GameConfig,
} from './types';

export { ErrorCode, DEFAULT_GAME_CONFIG } from './types';
