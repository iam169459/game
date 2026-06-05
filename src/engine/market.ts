// ============================================================================
// MODULE C: MARKET REVENUE, KEYNOTE HYPE & AUTOMATION
// Handles keynote events, stock trading, and the central game loop
// ============================================================================

import type {
  PlayerId,
  EngineResult,
  KeynoteEvent,
  VenueTier,
  DeviceId,
  TickerSymbol,
  StockHolding,
  MarketPricePoint,
  RetailStore,
  Employee,
  GameConfig,
} from './types';
import { ErrorCode, VENUE_TIERS, DEFAULT_GAME_CONFIG } from './types';
import { getProfile, updateProfile, getAllProfiles } from './profiles';

// ─── Configuration ──────────────────────────────────────────────────────────
let gameConfig: GameConfig = { ...DEFAULT_GAME_CONFIG };

export function setGameConfig(config: Partial<GameConfig>): void {
  gameConfig = { ...gameConfig, ...config };
}

export function getGameConfig(): GameConfig {
  return { ...gameConfig };
}

// ─── Input Validation Helpers ───────────────────────────────────────────────

function validateVenueTier(tier: unknown): EngineResult<VenueTier> {
  if (!VENUE_TIERS.includes(tier as VenueTier)) {
    return {
      success: false,
      error: `Invalid venue tier. Valid options: ${VENUE_TIERS.join(', ')}`,
      code: ErrorCode.INVALID_VENUE,
    };
  }
  return { success: true, data: tier as VenueTier, message: 'Valid' };
}

function validateTickerSymbol(ticker: unknown): EngineResult<TickerSymbol> {
  if (typeof ticker !== 'string' || ticker.trim().length === 0) {
    return {
      success: false,
      error: 'Invalid ticker symbol',
      code: ErrorCode.INVALID_TICKER,
    };
  }

  const validTicker = gameConfig.stockTickers.find(
    (st) => st.ticker.toUpperCase() === ticker.toUpperCase()
  );

  if (!validTicker) {
    return {
      success: false,
      error: `Invalid ticker. Available: ${gameConfig.stockTickers.map((st) => st.ticker).join(', ')}`,
      code: ErrorCode.INVALID_TICKER,
    };
  }

  return { success: true, data: validTicker.ticker, message: 'Valid' };
}

function validateShareAmount(amount: unknown): EngineResult<number> {
  const num = Number(amount);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num <= 0) {
    return {
      success: false,
      error: 'Share amount must be a positive integer',
      code: ErrorCode.INVALID_SHARE_AMOUNT,
    };
  }
  return { success: true, data: num, message: 'Valid' };
}

// ─── Keynote Event System ───────────────────────────────────────────────────

/**
 * Execute a keynote presentation event.
 *
 * Keynotes generate massive fanbase growth and pre-orders based on
 * venue size and the quality of devices being showcased.
 *
 * @param playerId - The player hosting the keynote
 * @param venueTier - Size of the venue
 * @param deviceIds - List of device IDs to showcase
 */
export async function executeKeynote(
  playerId: PlayerId,
  venueTier: unknown,
  deviceIds: DeviceId[]
): Promise<EngineResult<KeynoteEvent>> {
  // Validate inputs
  if (!playerId || typeof playerId !== 'string') {
    return { success: false, error: 'Invalid player ID', code: ErrorCode.INVALID_INPUT };
  }

  const venueValidation = validateVenueTier(venueTier);
  if (!venueValidation.success) return venueValidation as EngineResult<KeynoteEvent>;

  if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
    return {
      success: false,
      error: 'Must showcase at least one device',
      code: ErrorCode.NO_DEVICES_TO_SHOW,
    };
  }

  if (deviceIds.length > 5) {
    return {
      success: false,
      error: 'Cannot showcase more than 5 devices per keynote',
      code: ErrorCode.INVALID_INPUT,
    };
  }

  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player profile not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  if (profile.financials.isBankrupt) {
    return { success: false, error: 'Company is bankrupt', code: ErrorCode.BANKRUPT };
  }

  // Verify all devices belong to player
  const devicesToShow = profile.devices.filter((d) => deviceIds.includes(d.id));
  if (devicesToShow.length !== deviceIds.length) {
    return {
      success: false,
      error: 'One or more devices not found',
      code: ErrorCode.NO_DEVICES_TO_SHOW,
    };
  }

  const venue = venueValidation.data;
  const venueCost = gameConfig.venueCosts[venue];
  const fanMultiplier = gameConfig.venueFanMultipliers[venue];

  // Check if player can afford venue
  if (profile.financials.cash < venueCost) {
    return {
      success: false,
      error: `Insufficient funds for venue. Need $${venueCost.toLocaleString()}`,
      code: ErrorCode.INSUFFICIENT_FUNDS,
    };
  }

  // Calculate keynote impact
  const avgDeviceQuality = devicesToShow.reduce((sum, d) => sum + d.qualityScore, 0) / devicesToShow.length;
  const deviceCountBonus = 1 + (devicesToShow.length - 1) * 0.2; // 20% bonus per extra device

  // Fanbase growth: base * venue multiplier * device quality * device count
  const fanbaseGrowth = Math.round(
    1000 * fanMultiplier * (avgDeviceQuality / 100) * deviceCountBonus
  );

  // Pre-orders: based on fanbase and device quality
  const preOrderBase = profile.financials.fans * 0.1; // 10% of fans pre-order
  const preOrderMultiplier = fanMultiplier * (avgDeviceQuality / 100);
  const totalPreOrders = Math.round(preOrderBase * preOrderMultiplier);

  // Calculate revenue from pre-orders
  let totalRevenue = 0;
  const preOrdersPerDevice = Math.floor(totalPreOrders / devicesToShow.length);

  for (const device of devicesToShow) {
    const devicePreOrders = Math.min(preOrdersPerDevice, device.totalUnitsProduced || 1000);
    totalRevenue += devicePreOrders * device.retailPrice;
  }

  const now = Date.now();
  const event: KeynoteEvent = {
    id: `keynote-${playerId}-${now}`,
    venueTier: venue,
    venueCost,
    revealedDeviceIds: deviceIds,
    fanbaseMultiplier: fanMultiplier,
    preOrdersGenerated: totalPreOrders,
    totalRevenueGenerated: totalRevenue,
    executedAt: now,
  };

  // Apply changes to profile
  const result = await updateProfile(playerId, (profile) => ({
    ...profile,
    financials: {
      ...profile.financials,
      cash: profile.financials.cash - venueCost + totalRevenue,
      fans: profile.financials.fans + fanbaseGrowth,
      totalRevenue: profile.financials.totalRevenue + totalRevenue,
    },
    keynoteHistory: [...profile.keynoteHistory, event],
    devices: profile.devices.map((d) => {
      if (deviceIds.includes(d.id)) {
        const devicePreOrders = Math.floor(totalPreOrders / devicesToShow.length);
        return {
          ...d,
          totalUnitsProduced: d.totalUnitsProduced + devicePreOrders,
          totalUnitsSold: d.totalUnitsSold + devicePreOrders,
          totalRevenue: d.totalRevenue + devicePreOrders * d.retailPrice,
          totalProfit: d.totalProfit + devicePreOrders * (d.retailPrice - d.manufacturingCost),
        };
      }
      return d;
    }),
  }));

  if (!result.success) {
    return { success: false, error: result.error, code: result.code };
  }

  return {
    success: true,
    data: event,
    message: `Keynote successful! +${fanbaseGrowth.toLocaleString()} fans, ${totalPreOrders.toLocaleString()} pre-orders, $${totalRevenue.toLocaleString()} revenue`,
  };
}

/**
 * Get keynote history for a player.
 */
export function getKeynoteHistory(playerId: PlayerId): EngineResult<KeynoteEvent[]> {
  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  return {
    success: true,
    data: profile.keynoteHistory,
    message: `Found ${profile.keynoteHistory.length} keynote events`,
  };
}

// ─── Stock Market Trading Terminal ──────────────────────────────────────────

// Simulated market prices (in production, use real market data API)
const marketPrices = new Map<TickerSymbol, MarketPricePoint>();

function initializeMarketPrices(): void {
  for (const ticker of gameConfig.stockTickers) {
    marketPrices.set(ticker.ticker, {
      ticker: ticker.ticker,
      price: ticker.basePrice,
      volume: Math.floor(Math.random() * 1000000),
      timestamp: Date.now(),
      trend: 'stable',
    });
  }
}

// Initialize on module load
initializeMarketPrices();

/**
 * Get current market price for a ticker.
 */
export function getMarketPrice(ticker: TickerSymbol): EngineResult<MarketPricePoint> {
  const validation = validateTickerSymbol(ticker);
  if (!validation.success) return validation as EngineResult<MarketPricePoint>;

  const price = marketPrices.get(validation.data);
  if (!price) {
    return { success: false, error: 'Market data not available', code: ErrorCode.INVALID_TICKER };
  }

  return { success: true, data: price, message: `${ticker}: $${price.price}` };
}

/**
 * Get all market prices.
 */
export function getAllMarketPrices(): EngineResult<MarketPricePoint[]> {
  return {
    success: true,
    data: Array.from(marketPrices.values()),
    message: `Found ${marketPrices.size} tickers`,
  };
}

/**
 * Simulate market price movement (called by game loop).
 */
export function simulateMarketMovement(): void {
  for (const [ticker, point] of marketPrices) {
    // Random walk with mean reversion
    const volatility = 0.02; // 2% daily volatility
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const meanReversion = (gameConfig.stockTickers.find((t) => t.ticker === ticker)?.basePrice ?? point.price) * 0.001;

    let newPrice = point.price * (1 + randomChange) + meanReversion;
    newPrice = Math.max(1, newPrice); // Prevent negative prices

    const trend = newPrice > point.price * 1.01 ? 'up' : newPrice < point.price * 0.99 ? 'down' : 'stable';

    marketPrices.set(ticker, {
      ...point,
      price: Math.round(newPrice * 100) / 100,
      volume: Math.floor(Math.random() * 1000000),
      timestamp: Date.now(),
      trend,
    });
  }
}

/**
 * Buy company shares.
 *
 * @param playerId - The player buying shares
 * @param ticker - Stock ticker symbol
 * @param amount - Number of shares to buy
 */
export async function buyCompanyShares(
  playerId: PlayerId,
  ticker: unknown,
  amount: unknown
): Promise<EngineResult<StockHolding>> {
  // Validate inputs
  if (!playerId || typeof playerId !== 'string') {
    return { success: false, error: 'Invalid player ID', code: ErrorCode.INVALID_INPUT };
  }

  const tickerValidation = validateTickerSymbol(ticker);
  if (!tickerValidation.success) return tickerValidation as EngineResult<StockHolding>;

  const amountValidation = validateShareAmount(amount);
  if (!amountValidation.success) return amountValidation as EngineResult<StockHolding>;

  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player profile not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  if (profile.financials.isBankrupt) {
    return { success: false, error: 'Company is bankrupt', code: ErrorCode.BANKRUPT };
  }

  const validTicker = tickerValidation.data;
  const shareAmount = amountValidation.data;

  const marketPrice = marketPrices.get(validTicker);
  if (!marketPrice) {
    return { success: false, error: 'Market data not available', code: ErrorCode.INVALID_TICKER };
  }

  const totalCost = Math.round(marketPrice.price * shareAmount);

  // Check if player has enough cash
  if (profile.financials.cash < totalCost) {
    return {
      success: false,
      error: `Insufficient funds. Need $${totalCost.toLocaleString()}, have $${profile.financials.cash.toLocaleString()}`,
      code: ErrorCode.INSUFFICIENT_FUNDS,
    };
  }

  // Find existing holding or create new one
  const existingHolding = profile.portfolio.holdings.find((h) => h.ticker === validTicker);
  const tickerInfo = gameConfig.stockTickers.find((t) => t.ticker === validTicker);
  const companyName = tickerInfo?.name ?? validTicker;

  let updatedHolding: StockHolding;

  if (existingHolding) {
    // Average up/down the purchase price
    const totalShares = existingHolding.totalShares + shareAmount;
    const totalInvested = existingHolding.averagePurchasePrice * existingHolding.totalShares + totalCost;
    const avgPrice = totalInvested / totalShares;

    updatedHolding = {
      ...existingHolding,
      totalShares,
      averagePurchasePrice: Math.round(avgPrice * 100) / 100,
      currentMarketPrice: marketPrice.price,
      totalValue: Math.round(totalShares * marketPrice.price),
      unrealizedGainLoss: Math.round((marketPrice.price - avgPrice) * totalShares),
    };
  } else {
    updatedHolding = {
      ticker: validTicker,
      companyName,
      totalShares: shareAmount,
      averagePurchasePrice: marketPrice.price,
      currentMarketPrice: marketPrice.price,
      totalValue: Math.round(shareAmount * marketPrice.price),
      unrealizedGainLoss: 0,
    };
  }

  // Update portfolio
  const result = await updateProfile(playerId, (profile) => {
    const holdings = existingHolding
      ? profile.portfolio.holdings.map((h) =>
          h.ticker === validTicker ? updatedHolding : h
        )
      : [...profile.portfolio.holdings, updatedHolding];

    const totalPortfolioValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
    const totalInvested = holdings.reduce((sum, h) => sum + h.averagePurchasePrice * h.totalShares, 0);

    return {
      ...profile,
      financials: {
        ...profile.financials,
        cash: profile.financials.cash - totalCost,
      },
      portfolio: {
        holdings,
        totalPortfolioValue,
        totalInvested,
        totalGainLoss: totalPortfolioValue - totalInvested,
      },
    };
  });

  if (!result.success) {
    return { success: false, error: result.error, code: result.code };
  }

  return {
    success: true,
    data: updatedHolding,
    message: `Bought ${shareAmount} shares of ${validTicker} at $${marketPrice.price}`,
  };
}

/**
 * Sell company shares.
 *
 * @param playerId - The player selling shares
 * @param ticker - Stock ticker symbol
 * @param amount - Number of shares to sell
 */
export async function sellCompanyShares(
  playerId: PlayerId,
  ticker: unknown,
  amount: unknown
): Promise<EngineResult<{ proceeds: number; holding: StockHolding | null }>> {
  // Validate inputs
  if (!playerId || typeof playerId !== 'string') {
    return { success: false, error: 'Invalid player ID', code: ErrorCode.INVALID_INPUT };
  }

  const tickerValidation = validateTickerSymbol(ticker);
  if (!tickerValidation.success) return tickerValidation as EngineResult<{ proceeds: number; holding: StockHolding | null }>;

  const amountValidation = validateShareAmount(amount);
  if (!amountValidation.success) return amountValidation as EngineResult<{ proceeds: number; holding: StockHolding | null }>;

  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player profile not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  const validTicker = tickerValidation.data;
  const shareAmount = amountValidation.data;

  const existingHolding = profile.portfolio.holdings.find((h) => h.ticker === validTicker);
  if (!existingHolding) {
    return {
      success: false,
      error: `You don't own any shares of ${validTicker}`,
      code: ErrorCode.INSUFFICIENT_SHARES,
    };
  }

  if (existingHolding.totalShares < shareAmount) {
    return {
      success: false,
      error: `Insufficient shares. You own ${existingHolding.totalShares} shares`,
      code: ErrorCode.INSUFFICIENT_SHARES,
    };
  }

  const marketPrice = marketPrices.get(validTicker);
  if (!marketPrice) {
    return { success: false, error: 'Market data not available', code: ErrorCode.INVALID_TICKER };
  }

  const proceeds = Math.round(marketPrice.price * shareAmount);
  const remainingShares = existingHolding.totalShares - shareAmount;

  let updatedHolding: StockHolding | null = null;

  const result = await updateProfile(playerId, (profile) => {
    let holdings: StockHolding[];

    if (remainingShares === 0) {
      // Remove holding entirely
      holdings = profile.portfolio.holdings.filter((h) => h.ticker !== validTicker);
      updatedHolding = null;
    } else {
      // Update holding with fewer shares
      updatedHolding = {
        ...existingHolding,
        totalShares: remainingShares,
        currentMarketPrice: marketPrice.price,
        totalValue: Math.round(remainingShares * marketPrice.price),
        unrealizedGainLoss: Math.round((marketPrice.price - existingHolding.averagePurchasePrice) * remainingShares),
      };
      holdings = profile.portfolio.holdings.map((h) =>
        h.ticker === validTicker ? updatedHolding! : h
      );
    }

    const totalPortfolioValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
    const totalInvested = holdings.reduce((sum, h) => sum + h.averagePurchasePrice * h.totalShares, 0);

    return {
      ...profile,
      financials: {
        ...profile.financials,
        cash: profile.financials.cash + proceeds,
      },
      portfolio: {
        holdings,
        totalPortfolioValue,
        totalInvested,
        totalGainLoss: totalPortfolioValue - totalInvested,
      },
    };
  });

  if (!result.success) {
    return { success: false, error: result.error, code: result.code };
  }

  return {
    success: true,
    data: { proceeds, holding: updatedHolding },
    message: `Sold ${shareAmount} shares of ${validTicker} for $${proceeds.toLocaleString()}`,
  };
}

/**
 * Get player's portfolio summary.
 */
export function getPortfolio(playerId: PlayerId): EngineResult<{
  holdings: StockHolding[];
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
}> {
  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  // Update current prices
  const holdings = profile.portfolio.holdings.map((h) => {
    const marketPrice = marketPrices.get(h.ticker);
    if (marketPrice) {
      return {
        ...h,
        currentMarketPrice: marketPrice.price,
        totalValue: Math.round(h.totalShares * marketPrice.price),
        unrealizedGainLoss: Math.round((marketPrice.price - h.averagePurchasePrice) * h.totalShares),
      };
    }
    return h;
  });

  return {
    success: true,
    data: {
      holdings,
      totalValue: holdings.reduce((sum, h) => sum + h.totalValue, 0),
      totalInvested: holdings.reduce((sum, h) => sum + h.averagePurchasePrice * h.totalShares, 0),
      totalGainLoss: holdings.reduce((sum, h) => sum + h.unrealizedGainLoss, 0),
    },
    message: `Portfolio: ${holdings.length} holdings`,
  };
}

// ─── Retail Store Management ────────────────────────────────────────────────

/**
 * Construct a new retail store in a country.
 */
export async function constructStore(
  playerId: PlayerId,
  country: string,
  region: string,
  tier: number
): Promise<EngineResult<RetailStore>> {
  if (!playerId || typeof playerId !== 'string') {
    return { success: false, error: 'Invalid player ID', code: ErrorCode.INVALID_INPUT };
  }

  if (!country || typeof country !== 'string' || country.trim().length === 0) {
    return { success: false, error: 'Country is required', code: ErrorCode.INVALID_COUNTRY };
  }

  if (!region || typeof region !== 'string' || region.trim().length === 0) {
    return { success: false, error: 'Region is required', code: ErrorCode.INVALID_INPUT };
  }

  if (!Number.isInteger(tier) || tier < 1 || tier > 5) {
    return { success: false, error: 'Store tier must be between 1 and 5', code: ErrorCode.INVALID_INPUT };
  }

  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player profile not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  if (profile.financials.isBankrupt) {
    return { success: false, error: 'Company is bankrupt', code: ErrorCode.BANKRUPT };
  }

  // Check store limit
  if (profile.retailStores.length >= gameConfig.maxStoresPerPlayer) {
    return {
      success: false,
      error: `Maximum stores reached (${gameConfig.maxStoresPerPlayer})`,
      code: ErrorCode.STORE_LIMIT_REACHED,
    };
  }

  // Check if store already exists in this country/region
  const existingStore = profile.retailStores.find(
    (s) => s.country.toLowerCase() === country.toLowerCase() && s.region.toLowerCase() === region.toLowerCase()
  );
  if (existingStore) {
    return {
      success: false,
      error: `Store already exists in ${region}, ${country}`,
      code: ErrorCode.STORE_EXISTS,
    };
  }

  const constructionCost = gameConfig.storeConstructionBaseCost * tier;
  if (profile.financials.cash < constructionCost) {
    return {
      success: false,
      error: `Insufficient funds. Need $${constructionCost.toLocaleString()}`,
      code: ErrorCode.INSUFFICIENT_FUNDS,
    };
  }

  // Calculate store properties based on tier and location
  const salesMultiplier = 1.0 + (tier - 1) * 0.3; // 1.0 to 2.2
  const monthlyFee = 1000 * tier * tier; // Quadratic scaling
  const taxRate = 0.05 + (tier - 1) * 0.03; // 5% to 17%

  const store: RetailStore = {
    id: `store-${playerId}-${Date.now()}`,
    country: country.trim(),
    region: region.trim(),
    tier,
    monthlyMaintenanceFee: monthlyFee,
    taxRate,
    salesMultiplier,
    constructedAt: Date.now(),
    isActive: true,
  };

  const result = await updateProfile(playerId, (profile) => ({
    ...profile,
    financials: {
      ...profile.financials,
      cash: profile.financials.cash - constructionCost,
    },
    retailStores: [...profile.retailStores, store],
  }));

  if (!result.success) {
    return { success: false, error: result.error, code: result.code };
  }

  return {
    success: true,
    data: store,
    message: `Store constructed in ${region}, ${country}! Cost: $${constructionCost.toLocaleString()}`,
  };
}

// ─── Employee Management ────────────────────────────────────────────────────

/**
 * Hire an employee.
 */
export async function hireEmployee(
  playerId: PlayerId,
  name: string,
  department: string,
  tier: number
): Promise<EngineResult<Employee>> {
  if (!playerId || typeof playerId !== 'string') {
    return { success: false, error: 'Invalid player ID', code: ErrorCode.INVALID_INPUT };
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { success: false, error: 'Employee name is required', code: ErrorCode.INVALID_INPUT };
  }

  const validDepartments = ['design', 'programming', 'engineering'];
  if (!validDepartments.includes(department)) {
    return {
      success: false,
      error: `Invalid department. Valid options: ${validDepartments.join(', ')}`,
      code: ErrorCode.INVALID_DEPARTMENT,
    };
  }

  if (!Number.isInteger(tier) || tier < 1 || tier > 10) {
    return { success: false, error: 'Tier must be between 1 and 10', code: ErrorCode.INVALID_INPUT };
  }

  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player profile not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  if (profile.financials.isBankrupt) {
    return { success: false, error: 'Company is bankrupt', code: ErrorCode.BANKRUPT };
  }

  // Check department limit
  const deptEmployees = profile.employees.filter(
    (e) => e.department === department && e.isActive
  );
  if (deptEmployees.length >= gameConfig.maxEmployeesPerDepartment) {
    return {
      success: false,
      error: `Maximum employees in ${department} department reached`,
      code: ErrorCode.EMPLOYEE_LIMIT,
    };
  }

  // Calculate salary
  const baseSalary = gameConfig.salaryBase[department as keyof typeof gameConfig.salaryBase];
  const monthlySalary = baseSalary + (tier - 1) * gameConfig.salaryPerTier;
  const hiringCost = monthlySalary * 2; // 2 months upfront

  if (profile.financials.cash < hiringCost) {
    return {
      success: false,
      error: `Insufficient funds for hiring. Need $${hiringCost.toLocaleString()}`,
      code: ErrorCode.INSUFFICIENT_FUNDS,
    };
  }

  const employee: Employee = {
    id: `emp-${playerId}-${Date.now()}`,
    name: name.trim(),
    department: department as Employee['department'],
    tier,
    experienceLevel: 1,
    monthlySalary,
    efficiencyBonus: (tier - 1) * 0.03, // 3% per tier
    specializations: [],
    hiredAt: Date.now(),
    isActive: true,
  };

  const result = await updateProfile(playerId, (profile) => ({
    ...profile,
    financials: {
      ...profile.financials,
      cash: profile.financials.cash - hiringCost,
    },
    employees: [...profile.employees, employee],
  }));

  if (!result.success) {
    return { success: false, error: result.error, code: result.code };
  }

  return {
    success: true,
    data: employee,
    message: `Hired ${employee.name} in ${department}! Hiring cost: $${hiringCost.toLocaleString()}`,
  };
}

// ─── Central Automated Game Loop ────────────────────────────────────────────

let gameLoopTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Process daily game tick for a single player.
 * Handles salaries, maintenance, sales, and bankruptcy checks.
 */
export async function processDailyTick(playerId: PlayerId): Promise<EngineResult<{
  salaryDeduction: number;
  maintenanceDeduction: number;
  salesRevenue: number;
  netProfit: number;
  isBankrupt: boolean;
}>> {
  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  // Skip if bankrupt and frozen
  if (profile.financials.isBankrupt) {
    return {
      success: true,
      data: {
        salaryDeduction: 0,
        maintenanceDeduction: 0,
        salesRevenue: 0,
        netProfit: 0,
        isBankrupt: true,
      },
      message: 'Company is bankrupt - operations frozen',
    };
  }

  let salaryDeduction = 0;
  let maintenanceDeduction = 0;
  let salesRevenue = 0;

  // 1. Calculate employee salaries
  const activeEmployees = profile.employees.filter((e) => e.isActive);
  salaryDeduction = activeEmployees.reduce((sum, e) => sum + e.monthlySalary, 0);

  // 2. Calculate store maintenance
  const activeStores = profile.retailStores.filter((s) => s.isActive);
  maintenanceDeduction = activeStores.reduce((sum, s) => sum + s.monthlyMaintenanceFee, 0);

  // 3. Calculate sales revenue (if not bankrupt)
  const activeDevices = profile.devices.filter((d) => d.isActive);
  if (activeDevices.length > 0 && profile.financials.fans > 0) {
    for (const device of activeDevices) {
      // Daily units sold formula:
      // (Fanbase * (Quality/10) * StoreMultipliers) / (RetailPrice / 100)
      const qualityFactor = device.qualityScore / 10;
      const storeMultiplier = activeStores.reduce((sum, s) => sum + s.salesMultiplier, 1);
      const priceRatio = device.retailPrice / 100;

      const dailyUnits = Math.max(
        0,
        Math.round((profile.financials.fans * qualityFactor * storeMultiplier) / priceRatio)
      );

      // Apply random variance (+-10%)
      const variance = 0.9 + Math.random() * 0.2;
      const actualUnits = Math.round(dailyUnits * variance);

      const revenue = actualUnits * device.retailPrice;
      const cost = actualUnits * device.manufacturingCost;
      const tax = activeStores.reduce((sum, s) => sum + revenue * s.taxRate, 0);

      salesRevenue += revenue - cost - tax;

      // Update device stats
      await updateProfile(playerId, (profile) => ({
        ...profile,
        devices: profile.devices.map((d) =>
          d.id === device.id
            ? {
                ...d,
                totalUnitsProduced: d.totalUnitsProduced + actualUnits,
                totalUnitsSold: d.totalUnitsSold + actualUnits,
                totalRevenue: d.totalRevenue + revenue,
                totalProfit: d.totalProfit + revenue - cost - tax,
              }
            : d
        ),
      }));
    }
  }

  // 4. Calculate net profit
  const netProfit = salesRevenue - salaryDeduction - maintenanceDeduction;

  // 5. Update financials
  const newCash = profile.financials.cash + netProfit;
  const isBankrupt = newCash < 0;

  const result = await updateProfile(playerId, (profile) => ({
    ...profile,
    financials: {
      ...profile.financials,
      cash: newCash,
      totalRevenue: profile.financials.totalRevenue + salesRevenue,
      totalExpenses: profile.financials.totalExpenses + salaryDeduction + maintenanceDeduction,
      monthlySalaries: salaryDeduction,
      monthlyMaintenance: maintenanceDeduction,
      isBankrupt,
      bankruptcyFrozenAt: isBankrupt ? Date.now() : profile.financials.bankruptcyFrozenAt,
    },
    // If bankrupt, freeze all production
    devices: isBankrupt
      ? profile.devices.map((d) => ({ ...d, isActive: false }))
      : profile.devices,
  }));

  if (!result.success) {
    return { success: false, error: result.error, code: result.code };
  }

  return {
    success: true,
    data: {
      salaryDeduction,
      maintenanceDeduction,
      salesRevenue,
      netProfit,
      isBankrupt,
    },
    message: isBankrupt
      ? 'COMPANY BANKRUPT! All operations frozen.'
      : `Day processed: Revenue $${salesRevenue.toLocaleString()}, Expenses $${(salaryDeduction + maintenanceDeduction).toLocaleString()}`,
  };
}

/**
 * Process monthly tick (called on day 30).
 * Handles salary payments, market events, and valuation updates.
 */
export async function processMonthlyTick(playerId: PlayerId): Promise<EngineResult<{
  totalSalaries: number;
  totalMaintenance: number;
  valuation: number;
}>> {
  const profile = getProfile(playerId);
  if (!profile) {
    return { success: false, error: 'Player not found', code: ErrorCode.PLAYER_NOT_FOUND };
  }

  // Calculate company valuation
  const deviceValue = profile.devices.reduce((sum, d) => sum + d.totalProfit, 0);
  const storeValue = profile.retailStores.length * 50000;
  const employeeValue = profile.employees.length * 10000;
  const stockValue = profile.portfolio.totalPortfolioValue;

  const valuation = Math.round(
    profile.financials.cash +
    deviceValue * 2 +
    storeValue +
    employeeValue +
    stockValue
  );

  // Update valuation
  const result = await updateProfile(playerId, (profile) => ({
    ...profile,
    companyValuation: valuation,
    month: profile.month + 1,
    day: 1,
  }));

  if (!result.success) {
    return { success: false, error: result.error, code: result.code };
  }

  return {
    success: true,
    data: {
      totalSalaries: profile.financials.monthlySalaries,
      totalMaintenance: profile.financials.monthlyMaintenance,
      valuation,
    },
    message: `Month ${profile.month} complete. Valuation: $${valuation.toLocaleString()}`,
  };
}

/**
 * Start the central game loop.
 * Runs daily ticks for all active players.
 */
export function startGameLoop(intervalMs?: number): void {
  if (gameLoopTimer) {
    clearInterval(gameLoopTimer);
  }

  const interval = intervalMs ?? gameConfig.gameLoopIntervalMs;

  gameLoopTimer = setInterval(async () => {
    const profiles = getAllProfiles();
    const activePlayers = profiles.filter(
      (p) => Date.now() - p.lastActiveAt < 300000 // Active in last 5 minutes
    );

    for (const player of activePlayers) {
      try {
        await processDailyTick(player.id);

        // Process monthly tick on day 30
        const updatedProfile = getProfile(player.id);
        if (updatedProfile && updatedProfile.day === 30) {
          await processMonthlyTick(player.id);
        }

        // Simulate market movement
        simulateMarketMovement();
      } catch (error) {
        console.error(`Error processing tick for player ${player.id}:`, error);
      }
    }
  }, interval);

  console.log(`Game loop started with ${interval}ms interval`);
}

/**
 * Stop the game loop.
 */
export function stopGameLoop(): void {
  if (gameLoopTimer) {
    clearInterval(gameLoopTimer);
    gameLoopTimer = null;
    console.log('Game loop stopped');
  }
}

/**
 * Get game loop status.
 */
export function getGameLoopStatus(): { running: boolean; interval: number } {
  return {
    running: gameLoopTimer !== null,
    interval: gameConfig.gameLoopIntervalMs,
  };
}
