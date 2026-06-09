import type { MarketTrend } from '../types';

export const CAMPAIGNS = [
  { id: 'social',        name: 'Social Buzz',         dailyCost: 400000,   appealBoost: 8,  description: 'Social media presence' },
  { id: 'influencer',    name: 'Influencer Pack',      dailyCost: 1000000,  appealBoost: 18, description: 'Partner with influencers' },
  { id: 'tv',            name: 'TV Spots',             dailyCost: 2800000,  appealBoost: 32, description: 'Television advertising' },
  { id: 'launch',        name: 'Launch Event',         dailyCost: 6500000,  appealBoost: 50, description: 'Major product launch' },
  { id: 'content',       name: 'Content Marketing',    dailyCost: 300000,   appealBoost: 6,  description: 'Blog & video content' },
  { id: 'email',         name: 'Email Campaign',       dailyCost: 200000,   appealBoost: 4,  description: 'Direct email marketing' },
  { id: 'partnership',   name: 'Brand Partnership',    dailyCost: 1500000,  appealBoost: 22, description: 'Co-brand with other companies' },
  { id: 'billboard',     name: 'Billboard Ads',        dailyCost: 800000,   appealBoost: 12, description: 'Outdoor advertising' },
  { id: 'podcast',       name: 'Podcast Sponsorship',  dailyCost: 600000,   appealBoost: 10, description: 'Sponsor popular podcasts' },
  { id: 'referral',      name: 'Referral Program',     dailyCost: 150000,   appealBoost: 5,  description: 'Customer referral bonuses' },
  { id: 'streaming',     name: 'Streaming Ads',        dailyCost: 900000,   appealBoost: 14, description: 'Ads on streaming platforms' },
  { id: 'esports',       name: 'Esports Sponsorship',  dailyCost: 3500000,  appealBoost: 40, description: 'Sponsor gaming events' },
] as const;

export const TREND_POOL: Omit<MarketTrend, 'id' | 'daysLeft'>[] = [
  { label: 'Remote Work Boom',       category: 'laptop',      demandMultiplier: 1.40, icon: '🏠' },
  { label: 'Wearable Fitness Surge', category: 'smartwatch',  demandMultiplier: 1.35, icon: '🏃' },
  { label: 'Flagship Phone Season',  category: 'smartphone',  demandMultiplier: 1.38, icon: '📱' },
  { label: 'Budget Market Squeeze',  category: 'all',         demandMultiplier: 0.78, icon: '💸' },
  { label: 'Tech Hype Cycle',        category: 'all',         demandMultiplier: 1.22, icon: '🔥' },
  { label: 'Holiday Rush',           category: 'all',         demandMultiplier: 1.30, icon: '🎁' },
  { label: 'Back to School',         category: 'laptop',      demandMultiplier: 1.35, icon: '📚' },
  { label: 'Summer Selfies',         category: 'smartphone',  demandMultiplier: 1.25, icon: '☀️' },
  { label: 'Health Awareness',       category: 'smartwatch',  demandMultiplier: 1.30, icon: '❤️' },
  { label: 'Gaming Season',          category: 'smartphone',  demandMultiplier: 1.20, icon: '🎮' },
  { label: 'Business Upgrade Cycle', category: 'laptop',      demandMultiplier: 1.28, icon: '💼' },
  { label: 'Travel Season',          category: 'smartwatch',  demandMultiplier: 1.22, icon: '✈️' },
  { label: 'Tablet Surge',           category: 'tablet',      demandMultiplier: 1.35, icon: '🖥️' },
  { label: 'Music Festival Season',  category: 'earbuds',     demandMultiplier: 1.45, icon: '🎵' },
  { label: 'Binge Watching Trend',   category: 'smarttv',     demandMultiplier: 1.40, icon: '📺' },
  { label: 'Work from Home Boost',   category: 'tablet',      demandMultiplier: 1.30, icon: '🏡' },
  { label: 'Audiophile Craze',       category: 'earbuds',     demandMultiplier: 1.38, icon: '🎧' },
  { label: 'Sports Season',          category: 'smarttv',     demandMultiplier: 1.32, icon: '⚽' },
  { label: 'Student Discount Drive', category: 'all',         demandMultiplier: 1.18, icon: '🎓' },
  { label: 'Recession Pressure',     category: 'all',         demandMultiplier: 0.72, icon: '📉' },
];
