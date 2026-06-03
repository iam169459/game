export type ScreenId = 'menu' | 'dashboard' | 'designer' | 'market' | 'research' | 'factory' | 'lab' | 'employees' | 'settings';

export type BotStrategy = 'budget' | 'midrange' | 'flagship' | 'innovator' | 'underdog';

export interface BotCompany {
  id: string;
  name: string;
  color: string;
  logo: string;
  strategy: BotStrategy;
  cash: number;
  reputation: number;
  fans: number;
  unlockedTech: string[];
  releasedDevices: ReleasedDevice[];
  monthlyRevenue: number;
  monthlyProfit: number;
  marketShare: number;
  trend: 'up' | 'down' | 'stable';
  personality: {
    aggression: number;
    pricing: number;
    innovation: number;
    marketing: number;
  };
  lastReleaseMonth: number;
  employees: number;
  departmentBonus: {
    rd: number;
    marketing: number;
    manufacturing: number;
  };
}

export type DeviceCategory = 'smartphone' | 'laptop' | 'smartwatch';

export type ComponentSlot =
  | 'screen'
  | 'cpu'
  | 'ram'
  | 'camera'
  | 'battery'
  | 'storage'
  | 'chassis';

export interface DeviceStats {
  performance: number;
  display: number;
  camera: number;
  battery: number;
  build: number;
  appeal: number;
}

export interface ComponentDef {
  id: string;
  name: string;
  slot: ComponentSlot;
  tier: number;
  cost: number;
  stats: Partial<DeviceStats>;
  unlockTech?: string;
  categories: DeviceCategory[];
}

export interface ProductDesign {
  id: string;
  name: string;
  category: DeviceCategory;
  components: Partial<Record<ComponentSlot, string>>;
  stats: DeviceStats;
  unitCost: number;
  sellPrice: number;
  createdDay: number;
}

export interface TechNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  researchDays: number;
  prerequisites: string[];
  unlocks?: string[];
  effects?: { factorySpeed?: number; marketingBonus?: number; labUnlocked?: boolean };
}

export interface MarketTrend {
  id: string;
  label: string;
  category: DeviceCategory | 'all';
  demandMultiplier: number;
  daysLeft: number;
  icon: string;
}

export interface MarketPricing {
  basePriceMultiplier: number;
  supplyLevel: number;
  demandLevel: number;
  lastPurchaseDay: number;
  priceHistory: number[];
}

export interface ProductionLine {
  id: string;
  name: string;
  level: number;
  capacity: number;
  assignedProductId: string | null;
  assignedEmployeeId: string | null;
  progress: number;
}

export interface DayFinance {
  revenue: number;
  productionCost: number;
  marketingCost: number;
  upkeep: number;
  researchCost: number;
  profit: number;
}

export interface ReleasedDevice {
  id: string;
  name: string;
  category: DeviceCategory;
  components: Partial<Record<ComponentSlot, string>>;
  stats: DeviceStats;
  unitCost: number;
  sellPrice: number;
  releasedMonth: number;
  totalSold: number;
  totalRevenue: number;
  totalProfit: number;
  monthlySales: number[];
  durability: number;
  maxDurability: number;
  maintenanceCost: number;
}

export interface MonthlySales {
  month: number;
  revenue: number;
  unitsSold: number;
  profit: number;
  deviceSales: Record<string, number>;
}

export interface MarketEvent {
  id: string;
  label: string;
  description: string;
  icon: string;
  effect: {
    category?: DeviceCategory | 'all';
    demandMultiplier?: number;
    appealBoost?: number;
    costReduction?: number;
  };
  duration: number;
  daysLeft: number;
}

export interface Competitor {
  id: string;
  name: string;
  color: string;
  monthlySales: number;
  reputation: number;
  trend: 'up' | 'down' | 'stable';
}

export type EmployeeTrait = 'efficient' | 'expensive' | 'unstable' | 'diligent' | 'resilient' | 'lazy' | 'veteran' | 'trainee';

export interface Employee {
  id: string;
  name: string;
  department: 'rd' | 'marketing' | 'manufacturing' | 'executive';
  skill: number;
  salary: number;
  morale: number;
  hiredMonth: number;
  trait: EmployeeTrait;
  level: number;
  xp: number;
  xpToNextLevel: number;
  assignedLineId: string | null;
}

export interface Department {
  id: 'rd' | 'marketing' | 'manufacturing' | 'executive';
  name: string;
  headcount: number;
  bonus: number;
  budget: number;
}

export interface QuarterlyReport {
  quarter: number;
  year: number;
  month: number;
  playerRevenue: number;
  playerProfit: number;
  playerCash: number;
  totalMarketRevenue: number;
  marketShare: number;
  competitorSummaries: {
    name: string;
    revenue: number;
    profit: number;
    reputation: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  highlights: string[];
}

export interface DraftDesign {
  name: string;
  category: DeviceCategory;
  components: Partial<Record<ComponentSlot, string>>;
  sellPrice: number;
}

export interface CraftedPart {
  id: string;
  name: string;
  slot: ComponentSlot;
  tier: number;
  cost: number;
  stats: Partial<DeviceStats>;
  categories: DeviceCategory[];
  craftedFrom: string[];
  craftedMonth: number;
}

export interface GameSave {
  version: number;
  companyName: string;
  cash: number;
  fans: number;
  reputation: number;
  day: number;
  month: number;
  screen?: ScreenId;
  gameStarted: boolean;
  unlockedTech: string[];
  researching: { techId: string; daysLeft: number } | null;
  designs: ProductDesign[];
  inventory: Record<string, number>;
  factories: ProductionLine[];
  marketTrends: MarketTrend[];
  activeCampaignIds: string[];
  totalUnitsSold: number;
  lastDayFinance: DayFinance;
  profitHistory?: number[];
  draft?: DraftDesign;
  releasedDevices?: ReleasedDevice[];
  salesHistory?: MonthlySales[];
  marketEvents?: MarketEvent[];
  competitors?: Competitor[];
  currentMonth?: number;
  craftedParts?: CraftedPart[];
  employees?: Employee[];
  departments?: Department[];
  companyValuation?: number;
  quarterlyReports?: QuarterlyReport[];
  marketShare?: number;
  botCompanies?: BotCompany[];
  devicePricing?: Record<string, MarketPricing>;
  totalRepairCosts?: number;
  totalMaintenanceSpent?: number;
}
