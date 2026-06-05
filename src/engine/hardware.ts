// ============================================================================
// MODULE B: REFINED HARDWARE SPECIFICATION MATRIX & ASSEMBLER
// Parameterized configuration constructor with accumulated cost computation
// ============================================================================

import type {
  PlayerId,
  EngineResult,
  DeviceProduct,
  DeviceType,
  HardwareSpecMatrix,
  DisplayNode,
  OpticsArray,
  BiometricSubsystem,
  SiliconMicroarch,
  OSFlashConfig,
  LogisticsPackaging,
  SoCBrand,
  NanometerTier,
  RAMType,
  ResolutionTier,
  BiometricPlacement,
  MaterialType,
  OSPlatform,
} from './types';
import { ErrorCode, NANOMETER_TIERS, RAM_TYPES, SOC_BRANDS, DEVICE_TYPES, MATERIAL_TYPES, OS_PLATFORMS } from './types';
import { getProfile, updateProfile } from './profiles';

// ─── Constants ──────────────────────────────────────────────────────────────
const MAX_DEVICES_PER_PLAYER = 50;

// ─── Display Node Cost Modifiers ────────────────────────────────────────────
const DISPLAY_COST_TABLE = {
  panelType: {
    LCD: 0,
    OLED: 50,
    AMOLED: 75,
    'Mini-LED': 120,
    'Micro-LED': 200,
  },
  refreshRate: (hz: number) => Math.max(0, (hz - 60) * 0.5),
  brightness: (nits: number) => Math.max(0, (nits - 500) * 0.1),
  hdr: 30,
  alwaysOn: 15,
  touchSampling: (hz: number) => Math.max(0, (hz - 120) * 0.2),
};

// ─── Optics Array Cost Modifiers ────────────────────────────────────────────
const OPTICS_COST_TABLE = {
  mainSensor: (mp: number) => mp * 2,
  videoFPS: (fps: number) => (fps > 60 ? (fps - 60) * 0.5 : 0),
  slowMotion: 40,
  cinematicMode: 60,
  opticalStabilization: 35,
  periscopeZoom: 100,
  nightMode: 25,
  aiEnhancement: 45,
  resolutionTier: {
    '720p': 0,
    '1080p': 20,
    '1440p': 40,
    '4k': 80,
    '8k': 150,
  },
};

// ─── Biometric Cost Modifiers ───────────────────────────────────────────────
const BIOMETRIC_COST_TABLE = {
  fingerprint: 25,
  placement: {
    side: 0,
    behind: 5,
    under_display: 40,
    face: 0,
  },
  faceRecognition: 60,
  irisScanning: 120,
  ultrasonicSensor: 80,
};

// ─── Silicon Micro-architecture Cost Modifiers ──────────────────────────────
const SILICON_COST_TABLE = {
  socBrand: {
    qualcomm: 50,
    apple: 80,
    samsung: 45,
    mediatek: 30,
    google: 55,
    custom: 150,
  },
  clockSpeed: (mhz: number) => (mhz - 1800) * 0.05,
  coreCount: (cores: number) => cores * 8,
  lithography: {
    14: 0,
    10: 20,
    7: 50,
    5: 100,
    3: 200,
    2: 350,
    1.4: 500,
    1: 800,
  },
  l2Cache: (kb: number) => kb * 0.01,
  gpu: {
    base: 40,
    rayTracing: 80,
    variableRateShading: 30,
  },
  ram: (gb: number, type: RAMType) => {
    const typeMultiplier: Record<RAMType, number> = {
      DDR4: 1,
      DDR5: 1.3,
      LPDDR4X: 1.1,
      LPDDR5: 1.4,
      LPDDR5X: 1.6,
      HBM3: 3,
    };
    return gb * 15 * (typeMultiplier[type] || 1);
  },
  rom: (gb: number, type: string) => {
    const typeMultiplier: Record<string, number> = {
      UFS_2_2: 1,
      UFS_3_1: 1.2,
      UFS_4_0: 1.5,
      NVMe: 2,
    };
    return gb * 8 * (typeMultiplier[type] || 1);
  },
  microSD: (maxGB: number) => maxGB * 0.5,
  npu: (tops: number) => tops * 20,
};

// ─── OS Flash Cost Modifiers ────────────────────────────────────────────────
const OS_COST_TABLE = {
  openPlatform: 0,
  customOS: 200,
  performanceScore: (score: number) => score * 0.5,
  compatibilityScore: (score: number) => score * 0.3,
};

// ─── Packaging Cost Modifiers ───────────────────────────────────────────────
const PACKAGING_COST_TABLE = {
  dimensions: (w: number, h: number, t: number) => (w * h * t) / 10000,
  designTheme: (tier: number) => tier * 20,
  material: {
    plastic: 0,
    aluminum: 30,
    titanium: 80,
    carbon_fiber: 100,
    glass: 40,
    ceramic: 60,
  },
  ecoFriendly: 15,
  accessoryIncluded: 25,
};

// ─── Input Validation Helpers ───────────────────────────────────────────────

function validatePlayerId(id: PlayerId): EngineResult {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return { success: false, error: 'Invalid player ID', code: ErrorCode.INVALID_INPUT };
  }
  return { success: true, data: undefined as unknown as void, message: 'Valid' };
}

function validateDisplayConfig(config: Partial<DisplayNode>): EngineResult<DisplayNode> {
  if (!config || typeof config !== 'object') {
    return { success: false, error: 'Display configuration is required', code: ErrorCode.INVALID_DISPLAY_PPI };
  }

  const ppi = Number(config.screenDensityPPI);
  if (!Number.isFinite(ppi) || ppi < 100 || ppi > 1000) {
    return { success: false, error: 'Screen density PPI must be between 100 and 1000', code: ErrorCode.INVALID_DISPLAY_PPI };
  }

  const refreshRate = Number(config.refreshRateHz);
  if (!Number.isFinite(refreshRate) || ![60, 90, 120, 144, 240].includes(refreshRate)) {
    return { success: false, error: 'Refresh rate must be 60, 90, 120, 144, or 240 Hz', code: ErrorCode.INVALID_DISPLAY_PPI };
  }

  const validPanelTypes = ['LCD', 'OLED', 'AMOLED', 'Mini-LED', 'Micro-LED'];
  if (!validPanelTypes.includes(config.panelType as string)) {
    return { success: false, error: `Invalid panel type. Valid: ${validPanelTypes.join(', ')}`, code: ErrorCode.INVALID_DISPLAY_PPI };
  }

  const display: DisplayNode = {
    hdrEnabled: Boolean(config.hdrEnabled),
    screenDensityPPI: ppi,
    refreshRateHz: refreshRate,
    brightnessNits: Number(config.brightnessNits) || 1000,
    panelType: config.panelType as DisplayNode['panelType'],
    colorGamutPercent: Math.min(100, Math.max(0, Number(config.colorGamutPercent) || 100)),
    touchSamplingHz: Number(config.touchSamplingHz) || 240,
    alwaysOnDisplay: Boolean(config.alwaysOnDisplay),
    costModifier: 0,
  };

  // Calculate cost modifier
  display.costModifier = DISPLAY_COST_TABLE.panelType[display.panelType]
    + DISPLAY_COST_TABLE.refreshRate(display.refreshRateHz)
    + DISPLAY_COST_TABLE.brightness(display.brightnessNits)
    + (display.hdrEnabled ? DISPLAY_COST_TABLE.hdr : 0)
    + (display.alwaysOnDisplay ? DISPLAY_COST_TABLE.alwaysOn : 0)
    + DISPLAY_COST_TABLE.touchSampling(display.touchSamplingHz);

  return { success: true, data: display, message: 'Display configuration valid' };
}

function validateOpticsConfig(config: Partial<OpticsArray>): EngineResult<OpticsArray> {
  if (!config || typeof config !== 'object') {
    return { success: false, error: 'Optics configuration is required', code: ErrorCode.INVALID_FPS };
  }

  const mainMP = Number(config.mainSensorMP);
  if (!Number.isFinite(mainMP) || mainMP < 1 || mainMP > 200) {
    return { success: false, error: 'Main sensor MP must be between 1 and 200', code: ErrorCode.INVALID_FPS };
  }

  const videoFPS = Number(config.videoMaxFPS);
  if (!Number.isFinite(videoFPS) || ![30, 60, 120, 240, 480, 960].includes(videoFPS)) {
    return { success: false, error: 'Video FPS must be 30, 60, 120, 240, 480, or 960', code: ErrorCode.INVALID_FPS };
  }

  const validResolutions = ['720p', '1080p', '1440p', '4k', '8k'];
  if (!validResolutions.includes(config.resolutionTier as string)) {
    return { success: false, error: `Invalid resolution. Valid: ${validResolutions.join(', ')}`, code: ErrorCode.INVALID_RESOLUTION };
  }

  const optics: OpticsArray = {
    mainSensorMP: mainMP,
    videoMaxFPS: videoFPS,
    slowMotionCapable: Boolean(config.slowMotionCapable),
    slowMotionMaxFPS: Number(config.slowMotionMaxFPS) || 240,
    resolutionTier: config.resolutionTier as ResolutionTier,
    cinematicMode: Boolean(config.cinematicMode),
    opticalStabilization: Boolean(config.opticalStabilization),
    periscopeZoom: Boolean(config.periscopeZoom),
    zoomMultiplier: Number(config.zoomMultiplier) || 1,
    nightMode: Boolean(config.nightMode),
    aiEnhancement: Boolean(config.aiEnhancement),
    costModifier: 0,
  };

  // Calculate cost modifier
  optics.costModifier = OPTICS_COST_TABLE.mainSensor(optics.mainSensorMP)
    + OPTICS_COST_TABLE.videoFPS(optics.videoMaxFPS)
    + (optics.slowMotionCapable ? OPTICS_COST_TABLE.slowMotion : 0)
    + (optics.cinematicMode ? OPTICS_COST_TABLE.cinematicMode : 0)
    + (optics.opticalStabilization ? OPTICS_COST_TABLE.opticalStabilization : 0)
    + (optics.periscopeZoom ? OPTICS_COST_TABLE.periscopeZoom : 0)
    + (optics.nightMode ? OPTICS_COST_TABLE.nightMode : 0)
    + (optics.aiEnhancement ? OPTICS_COST_TABLE.aiEnhancement : 0)
    + OPTICS_COST_TABLE.resolutionTier[optics.resolutionTier];

  return { success: true, data: optics, message: 'Optics configuration valid' };
}

function validateBiometricConfig(config: Partial<BiometricSubsystem>): EngineResult<BiometricSubsystem> {
  if (!config || typeof config !== 'object') {
    return { success: false, error: 'Biometric configuration is required', code: ErrorCode.INVALID_BIOMETRIC };
  }

  const validPlacements = ['side', 'behind', 'under_display', 'face'];
  if (config.fingerprintEnabled && !validPlacements.includes(config.fingerprintPlacement as string)) {
    return { success: false, error: `Invalid fingerprint placement. Valid: ${validPlacements.join(', ')}`, code: ErrorCode.INVALID_BIOMETRIC };
  }

  const biometric: BiometricSubsystem = {
    fingerprintEnabled: Boolean(config.fingerprintEnabled),
    fingerprintPlacement: (config.fingerprintEnabled ? config.fingerprintPlacement : 'side') as BiometricPlacement,
    fingerprintStyleID: String(config.fingerprintStyleID || 'default'),
    fingerprintColorTag: String(config.fingerprintColorTag || '#000000'),
    faceRecognition: Boolean(config.faceRecognition),
    irisScanning: Boolean(config.irisScanning),
    ultrasonicSensor: Boolean(config.ultrasonicSensor),
    costModifier: 0,
  };

  // Calculate cost modifier
  biometric.costModifier = (biometric.fingerprintEnabled ? BIOMETRIC_COST_TABLE.fingerprint : 0)
    + (biometric.fingerprintEnabled ? BIOMETRIC_COST_TABLE.placement[biometric.fingerprintPlacement] : 0)
    + (biometric.faceRecognition ? BIOMETRIC_COST_TABLE.faceRecognition : 0)
    + (biometric.irisScanning ? BIOMETRIC_COST_TABLE.irisScanning : 0)
    + (biometric.ultrasonicSensor ? BIOMETRIC_COST_TABLE.ultrasonicSensor : 0);

  return { success: true, data: biometric, message: 'Biometric configuration valid' };
}

function validateSiliconConfig(config: Partial<SiliconMicroarch>): EngineResult<SiliconMicroarch> {
  if (!config || typeof config !== 'object') {
    return { success: false, error: 'Silicon configuration is required', code: ErrorCode.INVALID_SOC_CONFIG };
  }

  if (!SOC_BRANDS.includes(config.socBrand as SoCBrand)) {
    return { success: false, error: `Invalid SoC brand. Valid: ${SOC_BRANDS.join(', ')}`, code: ErrorCode.INVALID_SOC_CONFIG };
  }

  const clockMHz = Number(config.cpuClockSpeedMHz);
  if (!Number.isFinite(clockMHz) || clockMHz < 1000 || clockMHz > 5000) {
    return { success: false, error: 'CPU clock speed must be between 1000 and 5000 MHz', code: ErrorCode.INVALID_SOC_CONFIG };
  }

  const cores = Number(config.cpuCoreCount);
  if (!Number.isInteger(cores) || cores < 2 || cores > 16) {
    return { success: false, error: 'CPU core count must be between 2 and 16', code: ErrorCode.INVALID_SOC_CONFIG };
  }

  if (!NANOMETER_TIERS.includes(config.lithographyNodeNm as NanometerTier)) {
    return { success: false, error: `Invalid lithography node. Valid: ${NANOMETER_TIERS.join(', ')} nm`, code: ErrorCode.INVALID_SOC_CONFIG };
  }

  const ramGB = Number(config.ramCapacityGB);
  if (!Number.isFinite(ramGB) || ramGB < 1 || ramGB > 64) {
    return { success: false, error: 'RAM capacity must be between 1 and 64 GB', code: ErrorCode.INVALID_RAM_CONFIG };
  }

  if (!RAM_TYPES.includes(config.ramType as RAMType)) {
    return { success: false, error: `Invalid RAM type. Valid: ${RAM_TYPES.join(', ')}`, code: ErrorCode.INVALID_RAM_CONFIG };
  }

  const romGB = Number(config.romCapacityGB);
  if (!Number.isInteger(romGB) || romGB < 8 || romGB > 2048) {
    return { success: false, error: 'ROM capacity must be between 8 and 2048 GB', code: ErrorCode.INVALID_ROM_CONFIG };
  }

  const validROMTypes = ['UFS_2_2', 'UFS_3_1', 'UFS_4_0', 'NVMe'];
  if (!validROMTypes.includes(config.romType as string)) {
    return { success: false, error: `Invalid ROM type. Valid: ${validROMTypes.join(', ')}`, code: ErrorCode.INVALID_ROM_CONFIG };
  }

  const silicon: SiliconMicroarch = {
    socBrand: config.socBrand as SoCBrand,
    socSeries: String(config.socSeries || 'Unknown'),
    cpuClockSpeedMHz: clockMHz,
    cpuCoreCount: cores,
    lithographyNodeNm: config.lithographyNodeNm as NanometerTier,
    l2CacheKB: Number(config.l2CacheKB) || 1024,
    gpu: {
      brand: String(config.gpu?.brand || 'Adreno'),
      cores: Number(config.gpu?.cores) || 4,
      clockSpeedMHz: Number(config.gpu?.clockSpeedMHz) || 800,
      rayTracing: Boolean(config.gpu?.rayTracing),
      variableRateShading: Boolean(config.gpu?.variableRateShading),
      costModifier: 0,
    },
    ramCapacityGB: ramGB,
    ramType: config.ramType as RAMType,
    ramBandwidthGBs: Number(config.ramBandwidthGBs) || 50,
    romCapacityGB: romGB,
    romType: config.romType as SiliconMicroarch['romType'],
    microSDExpandable: Boolean(config.microSDExpandable),
    microSDMaxGB: Number(config.microSDMaxGB) || 0,
    npuEnabled: Boolean(config.npuEnabled),
    npuTOPS: Number(config.npuTOPS) || 0,
    costModifier: 0,
  };

  // Calculate GPU cost modifier
  silicon.gpu.costModifier = SILICON_COST_TABLE.gpu.base
    + (silicon.gpu.rayTracing ? SILICON_COST_TABLE.gpu.rayTracing : 0)
    + (silicon.gpu.variableRateShading ? SILICON_COST_TABLE.gpu.variableRateShading : 0);

  // Calculate total silicon cost modifier
  silicon.costModifier = SILICON_COST_TABLE.socBrand[silicon.socBrand]
    + SILICON_COST_TABLE.clockSpeed(silicon.cpuClockSpeedMHz)
    + SILICON_COST_TABLE.coreCount(silicon.cpuCoreCount)
    + SILICON_COST_TABLE.lithography[silicon.lithographyNodeNm]
    + SILICON_COST_TABLE.l2Cache(silicon.l2CacheKB)
    + silicon.gpu.costModifier
    + SILICON_COST_TABLE.ram(silicon.ramCapacityGB, silicon.ramType)
    + SILICON_COST_TABLE.rom(silicon.romCapacityGB, silicon.romType)
    + (silicon.microSDExpandable ? SILICON_COST_TABLE.microSD(silicon.microSDMaxGB) : 0)
    + (silicon.npuEnabled ? SILICON_COST_TABLE.npu(silicon.npuTOPS) : 0);

  return { success: true, data: silicon, message: 'Silicon configuration valid' };
}

function validateOSConfig(config: Partial<OSFlashConfig>, osBuildId: string): EngineResult<OSFlashConfig> {
  if (!config || typeof config !== 'object') {
    return { success: false, error: 'OS configuration is required', code: ErrorCode.MISSING_OS };
  }

  if (!OS_PLATFORMS.includes(config.platform as OSPlatform)) {
    return { success: false, error: `Invalid OS platform. Valid: ${OS_PLATFORMS.join(', ')}`, code: ErrorCode.MISSING_OS };
  }

  const performanceScore = Number(config.performanceScore);
  if (!Number.isFinite(performanceScore) || performanceScore < 0 || performanceScore > 100) {
    return { success: false, error: 'Performance score must be between 0 and 100', code: ErrorCode.MISSING_OS };
  }

  const compatibilityScore = Number(config.compatibilityScore);
  if (!Number.isFinite(compatibilityScore) || compatibilityScore < 0 || compatibilityScore > 100) {
    return { success: false, error: 'Compatibility score must be between 0 and 100', code: ErrorCode.MISSING_OS };
  }

  const osConfig: OSFlashConfig = {
    platform: config.platform as OSPlatform,
    osBuildId: osBuildId,
    isOpenPlatform: ['android', 'ios', 'windows', 'linux'].includes(config.platform as string),
    performanceScore,
    compatibilityScore,
    securityPatchLevel: String(config.securityPatchLevel || '2024-01'),
    customFeatures: Array.isArray(config.customFeatures) ? config.customFeatures : [],
    costModifier: 0,
  };

  // Calculate cost modifier
  osConfig.costModifier = (osConfig.isOpenPlatform ? OS_COST_TABLE.openPlatform : OS_COST_TABLE.customOS)
    + OS_COST_TABLE.performanceScore(osConfig.performanceScore)
    + OS_COST_TABLE.compatibilityScore(osConfig.compatibilityScore);

  return { success: true, data: osConfig, message: 'OS configuration valid' };
}

function validatePackagingConfig(config: Partial<LogisticsPackaging>): EngineResult<LogisticsPackaging> {
  if (!config || typeof config !== 'object') {
    return { success: false, error: 'Packaging configuration is required', code: ErrorCode.INVALID_PACKAGING };
  }

  const width = Number(config.boxWidthMM);
  const height = Number(config.boxHeightMM);
  const thickness = Number(config.boxThicknessMM);

  if (!Number.isFinite(width) || width < 50 || width > 500) {
    return { success: false, error: 'Box width must be between 50 and 500 mm', code: ErrorCode.INVALID_PACKAGING };
  }

  if (!Number.isFinite(height) || height < 50 || height > 500) {
    return { success: false, error: 'Box height must be between 50 and 500 mm', code: ErrorCode.INVALID_PACKAGING };
  }

  if (!Number.isFinite(thickness) || thickness < 10 || thickness > 200) {
    return { success: false, error: 'Box thickness must be between 10 and 200 mm', code: ErrorCode.INVALID_PACKAGING };
  }

  const tier = Number(config.designThemeTier);
  if (!Number.isInteger(tier) || tier < 1 || tier > 5) {
    return { success: false, error: 'Design theme tier must be between 1 and 5', code: ErrorCode.INVALID_PACKAGING };
  }

  if (!MATERIAL_TYPES.includes(config.structuralMaterial as MaterialType)) {
    return { success: false, error: `Invalid material. Valid: ${MATERIAL_TYPES.join(', ')}`, code: ErrorCode.INVALID_PACKAGING };
  }

  const packaging: LogisticsPackaging = {
    boxWidthMM: width,
    boxHeightMM: height,
    boxThicknessMM: thickness,
    designThemeTier: tier,
    structuralMaterial: config.structuralMaterial as MaterialType,
    ecoFriendly: Boolean(config.ecoFriendly),
    accessoryIncluded: Boolean(config.accessoryIncluded),
    costModifier: 0,
  };

  // Calculate cost modifier
  packaging.costModifier = PACKAGING_COST_TABLE.dimensions(width, height, thickness)
    + PACKAGING_COST_TABLE.designTheme(packaging.designThemeTier)
    + PACKAGING_COST_TABLE.material[packaging.structuralMaterial]
    + (packaging.ecoFriendly ? PACKAGING_COST_TABLE.ecoFriendly : 0)
    + (packaging.accessoryIncluded ? PACKAGING_COST_TABLE.accessoryIncluded : 0);

  return { success: true, data: packaging, message: 'Packaging configuration valid' };
}

// ─── Quality Score Calculation ──────────────────────────────────────────────

function calculateDeviceQualityScore(specs: HardwareSpecMatrix): number {
  // Display quality (20% weight)
  const displayScore = (
    (specs.display.hdrEnabled ? 15 : 0) +
    Math.min(25, specs.display.screenDensityPPI / 40) +
    Math.min(20, specs.display.refreshRateHz / 12) +
    (specs.display.alwaysOnDisplay ? 5 : 0)
  );

  // Optics quality (25% weight)
  const opticsScore = (
    Math.min(30, specs.optics.mainSensorMP / 7) +
    (specs.optics.opticalStabilization ? 15 : 0) +
    (specs.optics.cinematicMode ? 15 : 0) +
    (specs.optics.nightMode ? 10 : 0) +
    (specs.optics.aiEnhancement ? 10 : 0) +
    (specs.optics.periscopeZoom ? 10 : 0)
  );

  // Silicon performance (35% weight)
  const siliconScore = (
    Math.min(25, specs.silicon.cpuClockSpeedMHz / 160) +
    Math.min(20, specs.silicon.cpuCoreCount * 2) +
    (specs.silicon.lithographyNodeNm <= 5 ? 20 : specs.silicon.lithographyNodeNm <= 7 ? 15 : 10) +
    Math.min(20, specs.silicon.ramCapacityGB * 2) +
    (specs.silicon.npuEnabled ? 10 : 0) +
    (specs.silicon.gpu.rayTracing ? 10 : 0)
  );

  // Biometric quality (10% weight)
  const biometricScore = (
    (specs.biometric.fingerprintEnabled ? 30 : 0) +
    (specs.biometric.faceRecognition ? 25 : 0) +
    (specs.biometric.irisScanning ? 25 : 0) +
    (specs.biometric.ultrasonicSensor ? 20 : 0)
  );

  // OS quality (10% weight)
  const osScore = (
    specs.osFlash.performanceScore * 0.5 +
    specs.osFlash.compatibilityScore * 0.5
  );

  // Total score (0-100)
  const totalScore = displayScore + opticsScore + siliconScore + biometricScore + osScore;

  return Math.min(100, Math.round(totalScore));
}

// ─── Manufacturing Cost Calculation ─────────────────────────────────────────

function calculateManufacturingCost(specs: HardwareSpecMatrix): number {
  const baseCost = 50; // Base manufacturing cost

  return baseCost
    + specs.display.costModifier
    + specs.optics.costModifier
    + specs.biometric.costModifier
    + specs.silicon.costModifier
    + specs.osFlash.costModifier
    + specs.packaging.costModifier;
}

// ─── Module B: Hardware Assembly Functions ───────────────────────────────────

/**
 * Configure a complete hardware specification matrix for a device.
 *
 * This is the core configuration constructor that computes exact
 * accumulation-based manufacturing cost from selected parameters.
 *
 * @param display - Display node configuration
 * @param optics - Optics array configuration
 * @param biometric - Biometric subsystem configuration
 * @param silicon - Silicon micro-architecture configuration
 * @param osFlash - OS flashing pipeline configuration
 * @param packaging - Logistics packaging configuration
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
  // Validate all subsystems
  const displayResult = validateDisplayConfig(display);
  if (!displayResult.success) return displayResult as EngineResult<HardwareSpecMatrix>;

  const opticsResult = validateOpticsConfig(optics);
  if (!opticsResult.success) return opticsResult as EngineResult<HardwareSpecMatrix>;

  const biometricResult = validateBiometricConfig(biometric);
  if (!biometricResult.success) return biometricResult as EngineResult<HardwareSpecMatrix>;

  const siliconResult = validateSiliconConfig(silicon);
  if (!siliconResult.success) return siliconResult as EngineResult<HardwareSpecMatrix>;

  const osResult = validateOSConfig(osFlash, osBuildId);
  if (!osResult.success) return osResult as EngineResult<HardwareSpecMatrix>;

  const packagingResult = validatePackagingConfig(packaging);
  if (!packagingResult.success) return packagingResult as EngineResult<HardwareSpecMatrix>;

  const specs: HardwareSpecMatrix = {
    display: displayResult.data,
    optics: opticsResult.data,
    biometric: biometricResult.data,
    silicon: siliconResult.data,
    osFlash: osResult.data,
    packaging: packagingResult.data,
  };

  return {
    success: true,
    data: specs,
    message: `Hardware specs configured. Total cost modifier: $${specs.display.costModifier + specs.optics.costModifier + specs.biometric.costModifier + specs.silicon.costModifier + specs.osFlash.costModifier + specs.packaging.costModifier}`,
  };
}

/**
 * Get a preview of manufacturing cost for given hardware specs.
 */
export function previewManufacturingCost(specs: HardwareSpecMatrix): EngineResult<{
  totalCost: number;
  breakdown: Record<string, number>;
}> {
  const breakdown = {
    base: 50,
    display: specs.display.costModifier,
    optics: specs.optics.costModifier,
    biometric: specs.biometric.costModifier,
    silicon: specs.silicon.costModifier,
    osFlash: specs.osFlash.costModifier,
    packaging: specs.packaging.costModifier,
  };

  const totalCost = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return {
    success: true,
    data: { totalCost, breakdown },
    message: `Manufacturing cost: $${totalCost}`,
  };
}

/**
 * Get a preview of quality score for given hardware specs.
 */
export function previewQualityScore(specs: HardwareSpecMatrix): EngineResult<number> {
  const score = calculateDeviceQualityScore(specs);
  return {
    success: true,
    data: score,
    message: `Quality score: ${score}/100`,
  };
}

/**
 * Assemble a new device with complete hardware specifications.
 *
 * @param playerId - The player assembling the device
 * @param name - Device product name
 * @param type - Device type
 * @param specs - Complete hardware specification matrix
 * @param retailPrice - Initial retail price (must be validated later via pricing tool)
 */
export async function assembleDevice(
  playerId: PlayerId,
  name: string,
  type: unknown,
  specs: HardwareSpecMatrix,
  retailPrice: number
): Promise<EngineResult<DeviceProduct>> {
  // Validate inputs
  const idValidation = validatePlayerId(playerId);
  if (!idValidation.success) return idValidation as EngineResult<DeviceProduct>;

  if (!DEVICE_TYPES.includes(type as DeviceType)) {
    return {
      success: false,
      error: `Invalid device type. Valid: ${DEVICE_TYPES.join(', ')}`,
      code: ErrorCode.INVALID_INPUT,
    };
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { success: false, error: 'Device name is required', code: ErrorCode.INVALID_INPUT };
  }

  if (!Number.isFinite(retailPrice) || retailPrice < 1) {
    return { success: false, error: 'Retail price must be a positive number', code: ErrorCode.INVALID_AMOUNT };
  }

  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player profile not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  if (profile.financials.isBankrupt) {
    return { success: false, error: 'Company is bankrupt', code: ErrorCode.BANKRUPT };
  }

  // Check device limit
  if (profile.devices.length >= MAX_DEVICES_PER_PLAYER) {
    return {
      success: false,
      error: `Maximum devices reached (${MAX_DEVICES_PER_PLAYER})`,
      code: ErrorCode.DEVICE_LIMIT_REACHED,
    };
  }

  // Calculate costs and quality
  const manufacturingCost = calculateManufacturingCost(specs);
  const qualityScore = calculateDeviceQualityScore(specs);
  const setupCost = 10000; // Fixed setup cost

  // Check if player has enough cash for setup
  if (profile.financials.cash < setupCost) {
    return {
      success: false,
      error: `Insufficient funds for device setup. Need $${setupCost.toLocaleString()}`,
      code: ErrorCode.INSUFFICIENT_CASH,
    };
  }

  const device: DeviceProduct = {
    id: `dev-${playerId}-${Date.now()}`,
    name: name.trim(),
    type: type as DeviceType,
    hardwareSpecs: specs,
    qualityScore,
    manufacturingCost,
    retailPrice,
    netProfitMargin: retailPrice - manufacturingCost,
    isFinalized: false, // Not finalized until pricing confirmed
    totalUnitsProduced: 0,
    totalUnitsSold: 0,
    totalRevenue: 0,
    totalProfit: 0,
    isActive: true,
    createdAt: Date.now(),
  };

  const result = await updateProfile(playerId, (profile) => ({
    ...profile,
    financials: {
      ...profile.financials,
      cash: profile.financials.cash - setupCost,
    },
    devices: [...profile.devices, device],
    totalDevicesReleased: profile.totalDevicesReleased + 1,
  }));

  if (!result.success) {
    return { success: false, error: result.error, code: result.code };
  }

  return {
    success: true,
    data: device,
    message: `Device "${device.name}" assembled! Quality: ${qualityScore}/100, Unit Cost: $${manufacturingCost.toFixed(2)}`,
  };
}

/**
 * Get all devices for a player.
 */
export function getDevices(playerId: PlayerId): EngineResult<DeviceProduct[]> {
  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  return {
    success: true,
    data: profile.devices,
    message: `Found ${profile.devices.length} devices`,
  };
}

/**
 * Get a specific device by ID.
 */
export function getDevice(playerId: PlayerId, deviceId: string): EngineResult<DeviceProduct> {
  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  const device = profile.devices.find((d) => d.id === deviceId);
  if (!device) {
    return { success: false, error: 'Device not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  return { success: true, data: device, message: 'Device retrieved' };
}

/**
 * Update hardware specifications for an existing (non-finalized) device.
 */
export async function updateDeviceHardware(
  playerId: PlayerId,
  deviceId: string,
  specs: HardwareSpecMatrix
): Promise<EngineResult<DeviceProduct>> {
  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  const deviceIndex = profile.devices.findIndex((d) => d.id === deviceId);
  if (deviceIndex === -1) {
    return { success: false, error: 'Device not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  const device = profile.devices[deviceIndex];
  if (device.isFinalized) {
    return {
      success: false,
      error: 'Cannot modify hardware after pricing is finalized',
      code: ErrorCode.DEVICE_ALREADY_FINALIZED,
    };
  }

  const manufacturingCost = calculateManufacturingCost(specs);
  const qualityScore = calculateDeviceQualityScore(specs);

  const updatedDevice: DeviceProduct = {
    ...device,
    hardwareSpecs: specs,
    manufacturingCost,
    qualityScore,
    netProfitMargin: device.retailPrice - manufacturingCost,
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
    message: `Hardware updated. New quality: ${qualityScore}/100, Cost: $${manufacturingCost.toFixed(2)}`,
  };
}
