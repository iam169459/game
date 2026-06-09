import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { STORE_REGIONS, STORE_TIER_ICONS, STORE_TIER_NAMES } from '../data/stores';
import type { StoreRegion } from '../types';

const REGION_COLORS: Record<StoreRegion, string> = {
  north_america: 'from-blue-900/40 to-blue-950/20 border-blue-500/20',
  europe:        'from-purple-900/40 to-purple-950/20 border-purple-500/20',
  asia:          'from-red-900/40 to-red-950/20 border-red-500/20',
  south_america: 'from-green-900/40 to-green-950/20 border-green-500/20',
  middle_east:   'from-amber-900/40 to-amber-950/20 border-amber-500/20',
  africa:        'from-orange-900/40 to-orange-950/20 border-orange-500/20',
};

export function StoresTab() {
  const cash = useGameStore((s) => s.cash);
  const retailStores = useGameStore((s) => s.retailStores);
  const loans = useGameStore((s) => s.loans);
  const purchaseStore = useGameStore((s) => s.purchaseStore);
  const upgradeStore = useGameStore((s) => s.upgradeStore);
  const sellStore = useGameStore((s) => s.sellStore);
  const takeLoan = useGameStore((s) => s.takeLoan);
  const repayLoan = useGameStore((s) => s.repayLoan);
  const [view, setView] = useState<'stores' | 'loans'>('stores');
  const [selectedTier, setSelectedTier] = useState<Record<StoreRegion, 1 | 2 | 3>>({} as Record<StoreRegion, 1 | 2 | 3>);

  const totalMaintenance = retailStores.reduce((s, st) => s + st.monthlyMaintenance, 0);
  const totalSalesBonus = retailStores.reduce((s, st) => s + st.demandBonus, 0);
  const totalDebt = loans.reduce((s, l) => s + l.remaining, 0);
  const monthlyLoanPayments = loans.reduce((s, l) => s + l.monthlyPayment, 0);

  const getTierForRegion = (region: StoreRegion): 1 | 2 | 3 => selectedTier[region] ?? 1;

  const LOAN_AMOUNTS = [10000000, 25000000, 50000000, 100000000];

  return (
    <div className="space-y-5 pb-6">
      {/* Tab Toggle */}
      <div className="flex rounded-xl bg-white/5 p-1">
        {(['stores', 'loans'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setView(tab)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
              view === tab
                ? 'bg-accent/20 text-accent-soft shadow'
                : 'text-muted hover:text-fg'
            }`}
          >
            {tab === 'stores' ? '🏪 Retail Stores' : '🏦 Financing'}
          </button>
        ))}
      </div>

      {view === 'stores' && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-surface-card/60 p-3 text-center">
              <p className="text-[9px] uppercase tracking-widest text-muted">Stores</p>
              <p className="font-mono text-2xl font-bold text-fg">{retailStores.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-surface-card/60 p-3 text-center">
              <p className="text-[9px] uppercase tracking-widest text-red-300/70">Maintenance</p>
              <p className="font-mono text-lg font-bold text-red-300">${totalMaintenance.toLocaleString()}/mo</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-surface-card/60 p-3 text-center">
              <p className="text-[9px] uppercase tracking-widest text-emerald-300/70">Demand+</p>
              <p className="font-mono text-2xl font-bold text-emerald-300">+{totalSalesBonus}</p>
            </div>
          </div>

          {/* Owned Stores */}
          {retailStores.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted mb-3">Your Stores</p>
              <div className="space-y-2">
                {retailStores.map((store) => {
                  const template = STORE_REGIONS.find((r) => r.region === store.region);
                  const gradient = REGION_COLORS[store.region];
                  return (
                    <div
                      key={store.id}
                      className={`rounded-2xl border bg-gradient-to-br p-4 ${gradient}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{STORE_TIER_ICONS[store.tier]}</span>
                            <p className="font-semibold text-fg text-sm">{store.name}</p>
                          </div>
                          <p className="text-xs text-muted mt-1">
                            {template?.flag} {STORE_TIER_NAMES[store.tier]} · ${store.monthlyMaintenance.toLocaleString()}/mo
                          </p>
                          <p className="text-xs text-emerald-300 mt-0.5">+{store.demandBonus} demand bonus</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {store.tier < 3 && (
                            <button
                              type="button"
                              onClick={() => upgradeStore(store.id)}
                              className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-500/30 transition"
                            >
                              Upgrade ↑
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => sellStore(store.id)}
                            className="rounded-lg bg-red-500/10 px-2.5 py-1 text-[10px] text-red-400 hover:bg-red-500/20 transition"
                          >
                            Sell
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Regions */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted mb-3">Open New Store</p>
            <div className="space-y-3">
              {STORE_REGIONS.map((region) => {
                const storesInRegion = retailStores.filter((s) => s.region === region.region);
                const maxed = storesInRegion.length >= 3;
                const tier = getTierForRegion(region.region);
                const costKey = `tier${tier}Cost` as keyof typeof region;
                const cost = region[costKey] as number;
                const canAfford = cash >= cost;

                return (
                  <div
                    key={region.region}
                    className={`rounded-2xl border bg-gradient-to-br p-4 ${REGION_COLORS[region.region]}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{region.flag}</span>
                          <p className="font-semibold text-fg">{region.name}</p>
                          {maxed && (
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-bold text-muted">FULL</span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted mt-0.5">{region.description}</p>
                      </div>
                      <div className="text-right text-[10px] text-muted">
                        <p>{storesInRegion.length}/3 stores</p>
                      </div>
                    </div>

                    {/* Tier Selector */}
                    <div className="flex gap-1.5 mb-3">
                      {([1, 2, 3] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedTier((prev) => ({ ...prev, [region.region]: t }))}
                          className={`flex-1 rounded-lg border py-1.5 text-[10px] font-bold transition ${
                            tier === t
                              ? 'border-white/30 bg-white/15 text-fg'
                              : 'border-white/10 text-muted hover:text-fg'
                          }`}
                        >
                          {STORE_TIER_ICONS[t]} {STORE_TIER_NAMES[t]}
                        </button>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="rounded-lg bg-black/20 p-2 text-center">
                        <p className="text-[8px] text-muted">Cost</p>
                        <p className="font-mono text-xs font-bold text-fg">${(cost / 1000).toFixed(0)}K</p>
                      </div>
                      <div className="rounded-lg bg-black/20 p-2 text-center">
                        <p className="text-[8px] text-muted">Monthly</p>
                        <p className="font-mono text-xs font-bold text-red-300">${(region.maintenanceBase * tier).toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg bg-black/20 p-2 text-center">
                        <p className="text-[8px] text-muted">Demand</p>
                        <p className="font-mono text-xs font-bold text-emerald-300">+{region.demandBonus * tier}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford || maxed}
                      onClick={() => purchaseStore(region.region, tier)}
                      className={`w-full rounded-xl py-2.5 text-sm font-bold transition ${
                        canAfford && !maxed
                          ? 'bg-accent/20 text-accent-soft hover:bg-accent/30'
                          : 'bg-white/5 text-muted cursor-not-allowed opacity-50'
                      }`}
                    >
                      {maxed ? 'Region Full' : `Open ${STORE_TIER_NAMES[tier]} — $${cost.toLocaleString()}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {view === 'loans' && (
        <>
          {/* Loan Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-red-500/20 bg-red-900/10 p-4 text-center">
              <p className="text-[9px] uppercase text-red-300/70">Total Debt</p>
              <p className="font-mono text-xl font-bold text-red-300">${totalDebt.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-900/10 p-4 text-center">
              <p className="text-[9px] uppercase text-amber-300/70">Monthly Payments</p>
              <p className="font-mono text-xl font-bold text-amber-300">${monthlyLoanPayments.toLocaleString()}</p>
            </div>
          </div>

          {/* Active Loans */}
          {loans.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted mb-3">Active Loans</p>
              <div className="space-y-2">
                {loans.map((loan) => {
                  const pct = Math.round(((loan.principal - loan.remaining) / loan.principal) * 100);
                  return (
                    <div key={loan.id} className="rounded-2xl border border-red-500/15 bg-red-900/10 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-fg">${loan.principal.toLocaleString()} Loan</p>
                          <p className="text-[10px] text-muted">{loan.interestRate * 100}% annual · ${loan.monthlyPayment}/mo</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-red-300">${loan.remaining.toLocaleString()} left</p>
                          <p className="text-[10px] text-muted">Due month {loan.dueMonth}</p>
                        </div>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-emerald-500/60 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-[9px] text-muted">
                        <span>Paid: {pct}%</span>
                        <button
                          type="button"
                          disabled={cash < loan.remaining}
                          onClick={() => repayLoan(loan.id)}
                          className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300 hover:bg-emerald-500/30 transition disabled:opacity-40"
                        >
                          Repay Full
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Take New Loan */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted mb-3">Borrow Capital</p>
            <p className="text-xs text-muted mb-3">5% annual interest, repaid over 12 months. Max total debt: $200,000,000</p>
            <div className="grid grid-cols-2 gap-3">
              {LOAN_AMOUNTS.map((amount) => {
                const monthlyPayment = Math.round((amount * 1.05) / 12);
                const remaining = 200000000 - totalDebt;
                const available = amount <= remaining;
                return (
                  <button
                    key={amount}
                    type="button"
                    disabled={!available}
                    onClick={() => takeLoan(amount)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      available
                        ? 'border-blue-500/30 bg-blue-900/10 hover:bg-blue-900/20'
                        : 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <p className="font-mono text-lg font-bold text-blue-300">${(amount / 1000000).toFixed(0)}M</p>
                    <p className="text-[10px] text-muted mt-0.5">${monthlyPayment}/month</p>
                    <p className="text-[9px] text-muted">for 12 months</p>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
