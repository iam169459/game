// ============================================================================
// MULTIPLAYER CORPORATE MANAGEMENT ENGINE - ENTERPRISE TYPE SYSTEM
// Comprehensive type definitions for all 5 interdependent modules
// ============================================================================

// ─── Primitives & Constants ─────────────────────────────────────────────────
export type PlayerId = string;
export type DeviceId = string;
export type BlueprintId = string;
export type SiliconId = string;
export type OSBuildId = string;
export type StoreId = string;
export type EmployeeId = string;
export type TickerSymbol = string;

export const DEPARTMENTS = ['design', 'programming', 'engineering'] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const DEVICE_TYPES = ['smartphone', 'laptop', 'tablet', 'watch', 'headphones', 'tv', 'scooter'] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

export const VENUE_TIERS = ['small_hall', 'theater', 'convention_center', 'stadium', 'world_arena'] as const;
export type VenueTier = (typeof VENUE_TIERS)[number];

export const OS_PLATFORMS = ['android', 'ios', 'windows', 'linux', 'proprietary'] as const;
export type OSPlatform = (typeof OS_PLATFORMS)[number];

export const NANOMETER_TIERS = [14, 10, 7, 5, 3, 2, 1.4, 1] as const;
export type NanometerTier = (typeof NANOMETER_TIERS)[number];

export const RAM_TYPES = ['DDR4', 'DDR5', 'LPDDR4X', 'LPDDR5', 'LPDDR5X', 'HBM3'] as const;
export type RAMType = (typeof RAM_TYPES)[number];

export const SOC_BRANDS = ['qualcomm', 'apple', 'samsung', 'mediatek', 'google', 'custom'] as const;
export type SoCBrand = (typeof SOC_BRANDS)[number];

export const BIOMETRIC_PLACEMENTS = ['side', 'behind', 'under_display', 'face'] as const;
export type BiometricPlacement = (typeof BIOMETRIC_PLACEMENTS)[number];

export const RESOLUTION_TIERS = ['720p', '1080p', '1440p', '4k', '8k'] as const;
export type ResolutionTier = (typeof RESOLUTION_TIERS)[number];

export const MATERIAL_TYPES = ['plastic', 'aluminum', 'titanium', 'carbon_fiber', 'glass', 'ceramic'] as const;
export type MaterialType = (typeof MATERIAL_TYPES)[number];

// ─── Financial Ledger ───────────────────────────────────────────────────────
export interface FinancialLedger {
  cash: number;
  fans: number;
  researchCoins: number;
  totalRevenue: number;
  totalExpenses: number;
  monthlySalaries: number;
  monthlyMaintenance: number;
  isBankrupt: boolean;
  bankruptcyFrozenAt: number | null;
}

// ─── Social Structures ──────────────────────────────────────────────────────
export interface FriendEntry {
  playerId: PlayerId;
  username: string;
  addedAt: number;
  trustLevel: number;
}

export interface SocialMatrix {
  friends: FriendEntry[];
  blockedPlayers: PlayerId[];
  donationHistory: DonationRecord[];
}

export interface DonationRecord {
  id: string;
  recipientId: PlayerId;
  amount: number;
  timestamp: number;
}

// ─── MODULE B: Hardware Specification Matrices ──────────────────────────────

/**
 * Display Node Configuration
 * Tracks visual output specifications with HDR and density metrics
 */
export interface DisplayNode {
  hdrEnabled: boolean;
  screenDensityPPI: number;        // Pixels per inch (200-800 typical)
  refreshRateHz: number;           // 60, 90, 120, 144, 240
  brightnessNits: number;          // 500-3000 nits
  panelType: 'LCD' | 'OLED' | 'AMOLED' | 'Mini-LED' | 'Micro-LED';
  colorGamutPercent: number;       // DCI-P3 coverage (0-100)
  touchSamplingHz: number;         // 120-480 Hz
  alwaysOnDisplay: boolean;
  costModifier: number;            // Computed cost modifier
}

/**
 * Optics Array Configuration
 * Camera system with video capabilities and stabilization
 */
export interface OpticsArray {
  mainSensorMP: number;            // Megapixels (8-200)
  videoMaxFPS: number;             // 30, 60, 120, 240, 480, 960
  slowMotionCapable: boolean;
  slowMotionMaxFPS: number;        // 120-960 FPS
  resolutionTier: ResolutionTier;
  cinematicMode: boolean;
  opticalStabilization: boolean;
  periscopeZoom: boolean;
  zoomMultiplier: number;          // 1x-100x
  nightMode: boolean;
  aiEnhancement: boolean;
  costModifier: number;
}

/**
 * Biometric Subsystem
 * Fingerprint and facial recognition configuration
 */
export interface BiometricSubsystem {
  fingerprintEnabled: boolean;
  fingerprintPlacement: BiometricPlacement;
  fingerprintStyleID: string;      // Custom style identifier
  fingerprintColorTag: string;     // Color theme tag
  faceRecognition: boolean;
  irisScanning: boolean;
  ultrasonicSensor: boolean;
  costModifier: number;
}

/**
 * GPU Architecture Configuration
 */
export interface GPUArchitecture {
  brand: string;                   // Adreno, Mali, Apple GPU, Xclipse
  cores: number;
  clockSpeedMHz: number;
  rayTracing: boolean;
  variableRateShading: boolean;
  costModifier: number;
}

/**
 * Silicon Micro-architecture
 * Complete SoC specification with CPU, GPU, and memory interfaces
 */
export interface SiliconMicroarch {
  socBrand: SoCBrand;
  socSeries: string;               // Snapdragon 8 Gen 3, A17 Pro, etc.
  cpuClockSpeedMHz: number;        // 1800-4000 MHz
  cpuCoreCount: number;            // 4-16 cores
  lithographyNodeNm: NanometerTier;
  l2CacheKB: number;               // 256-16384 KB
  gpu: GPUArchitecture;
  ramCapacityGB: number;           // 2-32 GB
  ramType: RAMType;
  ramBandwidthGBs: number;         // 25-800 GB/s
  romCapacityGB: number;           // 32-2048 GB
  romType: 'UFS_2_2' | 'UFS_3_1' | 'UFS_4_0' | 'NVMe';
  microSDExpandable: boolean;
  microSDMaxGB: number;            // 0-2048 GB
  npuEnabled: boolean;             // Neural Processing Unit
  npuTOPS: number;                 // Tera Operations Per Second
  costModifier: number;
}

/**
 * OS Build Configuration
 * Operating system with performance metrics
 */
export interface OSFlashConfig {
  platform: OSPlatform;
  osBuildId: OSBuildId;
  isOpenPlatform: boolean;         // Android/Windows vs Custom
  performanceScore: number;        // 0-100
  compatibilityScore: number;      // 0-100
  securityPatchLevel: string;      // YYYY-MM
  customFeatures: string[];
  costModifier: number;
}

/**
 * Logistics Packaging Configuration
 * Physical packaging specifications
 */
export interface LogisticsPackaging {
  boxWidthMM: number;              // Box dimensions
  boxHeightMM: number;
  boxThicknessMM: number;
  designThemeTier: number;         // 1-5 (Basic to Premium)
  structuralMaterial: MaterialType;
  ecoFriendly: boolean;
  accessoryIncluded: boolean;
  costModifier: number;
}

/**
 * Complete Hardware Specification Matrix
 * Aggregates all subsystem configurations
 */
export interface HardwareSpecMatrix {
  display: DisplayNode;
  optics: OpticsArray;
  biometric: BiometricSubsystem;
  silicon: SiliconMicroarch;
  osFlash: OSFlashConfig;
  packaging: LogisticsPackaging;
}

// ─── Device Product (Enhanced) ──────────────────────────────────────────────
export interface DeviceProduct {
  id: DeviceId;
  name: string;
  type: DeviceType;
  hardwareSpecs: HardwareSpecMatrix;
  qualityScore: number;            // Computed from all specs (0-100)
  manufacturingCost: number;       // Computed from all cost modifiers
  retailPrice: number;             // Set by player via pricing tool
  netProfitMargin: number;         // retailPrice - manufacturingCost
  isFinalized: boolean;            // Pricing confirmed
  totalUnitsProduced: number;
  totalUnitsSold: number;
  totalRevenue: number;
  totalProfit: number;
  isActive: boolean;
  createdAt: number;
}

// ─── Retail Store Deployment ────────────────────────────────────────────────
export interface RetailStore {
  id: StoreId;
  country: string;
  region: string;
  tier: number;
  monthlyMaintenanceFee: number;
  taxRate: number;
  salesMultiplier: number;
  constructedAt: number;
  isActive: boolean;
}

// ─── Employee Roster ────────────────────────────────────────────────────────
export interface Employee {
  id: EmployeeId;
  name: string;
  department: Department;
  tier: number;
  experienceLevel: number;
  monthlySalary: number;
  efficiencyBonus: number;
  specializations: string[];
  hiredAt: number;
  isActive: boolean;
}

// ─── Securities Portfolio ───────────────────────────────────────────────────
export interface StockHolding {
  ticker: TickerSymbol;
  companyName: string;
  totalShares: number;
  averagePurchasePrice: number;
  currentMarketPrice: number;
  totalValue: number;
  unrealizedGainLoss: number;
}

export interface SecuritiesPortfolio {
  holdings: StockHolding[];
  totalPortfolioValue: number;
  totalInvested: number;
  totalGainLoss: number;
}

// ─── Keynote Event ──────────────────────────────────────────────────────────
export interface KeynoteEvent {
  id: string;
  venueTier: VenueTier;
  venueCost: number;
  revealedDeviceIds: DeviceId[];
  fanbaseMultiplier: number;
  preOrdersGenerated: number;
  totalRevenueGenerated: number;
  executedAt: number;
}

// ─── Market Pricing ─────────────────────────────────────────────────────────
export interface MarketPricePoint {
  ticker: TickerSymbol;
  price: number;
  volume: number;
  timestamp: number;
  trend: 'up' | 'down' | 'stable';
}

// ─── Company Profile (Master Structure) ─────────────────────────────────────
export interface CompanyProfile {
  id: PlayerId;
  username: string;
  companyName: string;
  createdAt: number;
  lastActiveAt: number;

  // Module 1: Financial Ledger
  financials: FinancialLedger;

  // Module 1: Social Matrix
  social: SocialMatrix;

  // Module 3: IP Vault - Devices (with hardware specs)
  devices: DeviceProduct[];

  // Module 1: Asset Roster - Retail Stores
  retailStores: RetailStore[];

  // Module 1: Asset Roster - Employees
  employees: Employee[];

  // Module 1: Securities Portfolio
  portfolio: SecuritiesPortfolio;

  // Module 4: Keynote History
  keynoteHistory: KeynoteEvent[];

  // Game State
  month: number;
  day: number;
  totalDevicesReleased: number;
  companyValuation: number;
  marketShare: number;
}

// ─── Engine Result Types ────────────────────────────────────────────────────
export type EngineResult<T = void> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; code: ErrorCode };

export enum ErrorCode {
  // Social Errors
  SELF_ADD_BLOCKED = 'SOCIAL_SELF_ADD',
  PLAYER_NOT_FOUND = 'SOCIAL_NOT_FOUND',
  ALREADY_FRIENDS = 'SOCIAL_ALREADY_FRIENDS',
  NOT_FRIENDS = 'SOCIAL_NOT_FRIENDS',
  INSUFFICIENT_FUNDS = 'FIN_INSUFFICIENT',
  INVALID_AMOUNT = 'FIN_INVALID_AMOUNT',
  SELF_DONATION_BLOCKED = 'SOCIAL_SELF_DONATE',
  BLOCKED_PLAYER = 'SOCIAL_BLOCKED',

  // Hardware Spec Errors
  INVALID_DISPLAY_PPI = 'HW_INVALID_PPI',
  INVALID_FPS = 'HW_INVALID_FPS',
  INVALID_RESOLUTION = 'HW_INVALID_RESOLUTION',
  INVALID_SOC_CONFIG = 'HW_INVALID_SOC',
  INVALID_RAM_CONFIG = 'HW_INVALID_RAM',
  INVALID_ROM_CONFIG = 'HW_INVALID_ROM',
  INVALID_BIOMETRIC = 'HW_INVALID_BIOMETRIC',
  INVALID_PACKAGING = 'HW_INVALID_PACKAGING',

  // Pricing Errors
  PRICE_BELOW_COST = 'PRICE_BELOW_COST',
  DEVICE_NOT_FINALIZED = 'DEVICE_NOT_FINALIZED',
  DEVICE_ALREADY_FINALIZED = 'DEVICE_ALREADY_FINALIZED',
  MISSING_HARDWARE_SPECS = 'MISSING_HARDWARE',

  // Device Errors
  MISSING_SILICON = 'DEVICE_MISSING_SILICON',
  MISSING_OS = 'DEVICE_MISSING_OS',
  INSUFFICIENT_CASH = 'FIN_INSUFFICIENT',
  DEVICE_LIMIT_REACHED = 'DEVICE_LIMIT',

  // Store Errors
  STORE_EXISTS = 'STORE_DUPLICATE',
  INVALID_COUNTRY = 'STORE_INVALID_COUNTRY',
  STORE_LIMIT_REACHED = 'STORE_LIMIT',

  // Employee Errors
  EMPLOYEE_LIMIT = 'EMP_LIMIT',
  EMPLOYEE_NOT_FOUND = 'EMP_NOT_FOUND',
  INVALID_DEPARTMENT = 'EMP_INVALID_DEPT',

  // Keynote Errors
  NO_DEVICES_TO_SHOW = 'KEYNOTE_NO_DEVICES',
  INVALID_VENUE = 'KEYNOTE_INVALID_VENUE',

  // Stock Errors
  INVALID_TICKER = 'STOCK_INVALID_TICKER',
  INSUFFICIENT_SHARES = 'STOCK_INSUFFICIENT',
  INVALID_SHARE_AMOUNT = 'STOCK_INVALID_AMOUNT',

  // System Errors
  BANKRUPT = 'SYSTEM_BANKRUPT',
  GAME_NOT_STARTED = 'SYSTEM_NOT_STARTED',
  INVALID_INPUT = 'SYSTEM_INVALID_INPUT',
}

// ─── Game Configuration ─────────────────────────────────────────────────────
export interface GameConfig {
  salaryBase: Record<Department, number>;
  salaryPerTier: number;
  salaryPerExperience: number;
  maxStoresPerPlayer: number;
  storeConstructionBaseCost: number;
  maxEmployeesPerDepartment: number;
  maxDevicesPerPlayer: number;
  venueCosts: Record<VenueTier, number>;
  venueFanMultipliers: Record<VenueTier, number>;
  stockTickers: { ticker: TickerSymbol; name: string; basePrice: number }[];
  gameLoopIntervalMs: number;
  salaryDeductionDay: number;
  maintenanceDay: number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  salaryBase: { design: 3000, programming: 3500, engineering: 4000 },
  salaryPerTier: 500,
  salaryPerExperience: 10,
  maxStoresPerPlayer: 20,
  storeConstructionBaseCost: 50000,
  maxEmployeesPerDepartment: 30,
  maxDevicesPerPlayer: 50,
  venueCosts: {
    small_hall: 5000,
    theater: 25000,
    convention_center: 100000,
    stadium: 500000,
    world_arena: 2000000,
  },
  venueFanMultipliers: {
    small_hall: 1.2,
    theater: 1.8,
    convention_center: 3.0,
    stadium: 5.0,
    world_arena: 10.0,
  },
  stockTickers: [
    { ticker: 'APPL', name: 'Apple Corp', basePrice: 180 },
    { ticker: 'MSFT', name: 'Micro Systems', basePrice: 350 },
    { ticker: 'GOOG', name: 'Alphabet Inc', basePrice: 140 },
    { ticker: 'AMZN', name: 'Mega Trade', basePrice: 120 },
    { ticker: 'NVDA', name: 'NVIDIA Graphics', basePrice: 450 },
    { ticker: 'META', name: 'MetaVerse Labs', basePrice: 300 },
    { ticker: 'TSLA', name: 'Tesla Motors', basePrice: 250 },
    { ticker: 'SONY', name: 'Sony Entertainment', basePrice: 90 },
  ],
  gameLoopIntervalMs: 60000,
  salaryDeductionDay: 30,
  maintenanceDay: 1,
};
