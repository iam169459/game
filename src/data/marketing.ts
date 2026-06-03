import type { MarketTrend } from '../types';

export const CAMPAIGNS = [
  { id: 'social', name: 'Social Buzz', dailyCost: 400, appealBoost: 8, description: 'Social media presence' },
  { id: 'influencer', name: 'Influencer Pack', dailyCost: 1000, appealBoost: 18, description: 'Partner with influencers' },
  { id: 'tv', name: 'TV Spots', dailyCost: 2800, appealBoost: 32, description: 'Television advertising' },
  { id: 'launch', name: 'Launch Event', dailyCost: 6500, appealBoost: 50, description: 'Major product launch' },
  { id: 'content', name: 'Content Marketing', dailyCost: 300, appealBoost: 6, description: 'Blog & video content' },
  { id: 'email', name: 'Email Campaign', dailyCost: 200, appealBoost: 4, description: 'Direct email marketing' },
  { id: 'partnership', name: 'Brand Partnership', dailyCost: 1500, appealBoost: 22, description: 'Co-brand with other companies' },
  { id: 'billboard', name: 'Billboard Ads', dailyCost: 800, appealBoost: 12, description: 'Outdoor advertising' },
  { id: 'podcast', name: 'Podcast Sponsorship', dailyCost: 600, appealBoost: 10, description: 'Sponsor popular podcasts' },
  { id: 'referral', name: 'Referral Program', dailyCost: 150, appealBoost: 5, description: 'Customer referral bonuses' },
] as const;

export const TREND_POOL: Omit<MarketTrend, 'id' | 'daysLeft'>[] = [
  { label: 'Remote Work Boom', category: 'laptop', demandMultiplier: 1.4, icon: '🏠' },
  { label: 'Wearable Fitness Surge', category: 'smartwatch', demandMultiplier: 1.35, icon: '🏃' },
  { label: 'Flagship Phone Season', category: 'smartphone', demandMultiplier: 1.38, icon: '📱' },
  { label: 'Budget Market', category: 'all', demandMultiplier: 0.78, icon: '💸' },
  { label: 'Tech Hype Cycle', category: 'all', demandMultiplier: 1.22, icon: '🔥' },
  { label: 'Holiday Rush', category: 'all', demandMultiplier: 1.3, icon: '🎁' },
  { label: 'Back to School', category: 'laptop', demandMultiplier: 1.35, icon: '📚' },
  { label: 'Summer Selfies', category: 'smartphone', demandMultiplier: 1.25, icon: '☀️' },
  { label: 'Health Awareness', category: 'smartwatch', demandMultiplier: 1.3, icon: '❤️' },
  { label: 'Gaming Season', category: 'smartphone', demandMultiplier: 1.2, icon: '🎮' },
  { label: 'Business Upgrade', category: 'laptop', demandMultiplier: 1.28, icon: '💼' },
  { label: 'Travel Season', category: 'smartwatch', demandMultiplier: 1.22, icon: '✈️' },
];
