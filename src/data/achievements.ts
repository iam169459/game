import type { Achievement } from '../types';

export const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlockedMonth'>[] = [
  // ── SALES ─────────────────────────────────────────────────────────────────
  { id: 'first-sale',       name: 'First Sale!',          description: 'Sell your very first device unit',          icon: '🛒', category: 'sales',    reward: 500000 },
  { id: 'sales-100',        name: 'Century Club',         description: 'Sell 100,000 units total',                      icon: '💯', category: 'sales',    reward: 2000000 },
  { id: 'sales-1k',         name: 'Thousand Strong',      description: 'Sell 1,000,000 units total',                    icon: '🏆', category: 'sales',    reward: 8000000 },
  { id: 'sales-10k',        name: 'Ten Thousand!',        description: 'Sell 10,000,000 units total',                   icon: '🌟', category: 'sales',    reward: 40000000 },
  { id: 'sales-100k',       name: 'Mass Market',          description: 'Sell 100,000,000 units total',                  icon: '🌍', category: 'sales',    reward: 200000000 },
  { id: 'revenue-100k',     name: '$100K Revenue',        description: 'Earn $100,000,000 in total revenue',            icon: '💵', category: 'sales',    reward: 5000000 },
  { id: 'revenue-1m',       name: 'Millionaire',          description: 'Earn $1,000,000,000 in total revenue',          icon: '💰', category: 'sales',    reward: 30000000 },
  { id: 'revenue-10m',      name: 'Ten Million Club',     description: 'Earn $10,000,000,000 in total revenue',         icon: '💎', category: 'sales',    reward: 150000000 },

  // ── DEVICES ───────────────────────────────────────────────────────────────
  { id: 'first-device',     name: 'Inventor',             description: 'Release your first device',                 icon: '📱', category: 'devices',  reward: 1000000 },
  { id: 'devices-3',        name: 'Product Line',         description: 'Release 3 different devices',              icon: '🎯', category: 'devices',  reward: 4000000 },
  { id: 'devices-10',       name: 'Prolific Designer',    description: 'Release 10 devices',                       icon: '🏭', category: 'devices',  reward: 15000000 },
  { id: 'all-categories',   name: 'Full Catalog',         description: 'Release at least one of every device type', icon: '📦', category: 'devices',  reward: 50000000 },
  { id: 'flagship',         name: 'Flagship Quality',     description: 'Release a device with 80+ average score',   icon: '⭐', category: 'devices',  reward: 10000000 },
  { id: 'perfect-device',   name: 'Perfection',           description: 'Release a device with 95+ average score',   icon: '🔥', category: 'devices',  reward: 40000000 },

  // ── FINANCE ───────────────────────────────────────────────────────────────
  { id: 'cash-50k',         name: 'First Fortune',        description: 'Have $50,000,000 cash',                         icon: '🤑', category: 'finance',  reward: 2000000 },
  { id: 'cash-500k',        name: 'Half a Million',       description: 'Have $500,000,000 cash',                        icon: '🏦', category: 'finance',  reward: 10000000 },
  { id: 'cash-5m',          name: 'Five Million',         description: 'Have $5,000,000,000 cash',                      icon: '💳', category: 'finance',  reward: 50000000 },
  { id: 'valuation-1m',     name: 'Unicorn Club',         description: 'Reach $1B company valuation',               icon: '🦄', category: 'finance',  reward: 20000000 },
  { id: 'profitable',       name: 'In the Black',         description: 'Achieve a profitable month',                icon: '📈', category: 'finance',  reward: 3000000 },

  // ── RESEARCH ──────────────────────────────────────────────────────────────
  { id: 'first-tech',       name: 'Curious Mind',         description: 'Unlock your first technology',              icon: '🔬', category: 'research', reward: 500000 },
  { id: 'tech-5',           name: 'Tech Visionary',       description: 'Unlock 5 technologies',                     icon: '🧪', category: 'research', reward: 5000000 },
  { id: 'tech-15',          name: 'Innovation Lab',       description: 'Unlock 15 technologies',                    icon: '⚡', category: 'research', reward: 20000000 },
  { id: 'tech-all-hw',      name: 'Hardware Master',      description: 'Unlock all hardware technologies',          icon: '🔧', category: 'research', reward: 60000000 },

  // ── EMPIRE ────────────────────────────────────────────────────────────────
  { id: 'first-store',      name: 'Retail Presence',      description: 'Open your first retail store',              icon: '🏪', category: 'empire',   reward: 3000000 },
  { id: 'stores-5',         name: 'Chain Reaction',       description: 'Own 5 retail stores',                       icon: '🌐', category: 'empire',   reward: 15000000 },
  { id: 'stores-10',        name: 'Global Retailer',      description: 'Own 10 retail stores',                      icon: '🌍', category: 'empire',   reward: 50000000 },
  { id: 'first-employee',   name: 'First Hire',           description: 'Hire your first employee',                  icon: '👤', category: 'empire',   reward: 1000000 },
  { id: 'employees-10',     name: 'Growing Team',         description: 'Have 10 employees',                         icon: '👥', category: 'empire',   reward: 8000000 },
  { id: 'employees-30',     name: 'Corporate',            description: 'Have 30 employees',                         icon: '🏢', category: 'empire',   reward: 30000000 },
  { id: 'market-leader',    name: 'Market Leader',        description: 'Achieve 25%+ market share',                 icon: '👑', category: 'empire',   reward: 100000000 },
  { id: 'factories-5',      name: 'Industrial',           description: 'Own 5 production lines',                    icon: '🏭', category: 'empire',   reward: 12000000 },
  { id: 'survived-1yr',     name: 'Year One Survivor',    description: 'Survive 12 months in business',             icon: '🗓️', category: 'empire',   reward: 25000000 },
  { id: 'survived-3yr',     name: 'Three Year Veteran',   description: 'Survive 36 months in business',             icon: '🏅', category: 'empire',   reward: 80000000 },
];
