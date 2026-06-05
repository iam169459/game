import { useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MetricCard } from '../components/ui/MetricCard';
import { Sparkline } from '../components/ui/Sparkline';
import { CATEGORY_META } from '../data/components';
import { useGameStore } from '../store/useGameStore';
import { calcMarketShares } from '../lib/botAI';

const QUICK = [
  { screen: 'blueprints' as const, label: 'Design Device', desc: 'Build your next hit', icon: '🎨', gradient: 'from-blue-600/30 to-violet-600/20' },
  { screen: 'devices' as const, label: 'Production', desc: 'Manufacture stock', icon: '🏭', gradient: 'from-amber-600/30 to-orange-600/20' },
  { screen: 'devices' as const, label: 'Marketing', desc: 'Boost sales', icon: '📣', gradient: 'from-pink-600/30 to-rose-600/20' },
  { screen: 'blueprints' as const, label: 'R&D Lab', desc: 'Unlock tech', icon: '🔬', gradient: 'from-emerald-600/30 to-teal-600/20' },
];

export function Dashboard() {
  const companyName = useGameStore((s) => s.companyName);
  const cash = useGameStore((s) => s.cash);
  const fans = useGameStore((s) => s.fans);
  const reputation = useGameStore((s) => s.reputation);
  const month = useGameStore((s) => s.month);
  const day = useGameStore((s) => s.day);
  const marketTrends = useGameStore((s) => s.marketTrends);
  const lastFinance = useGameStore((s) => s.lastDayFinance);
  const profitHistory = useGameStore((s) => s.profitHistory);
  const researching = useGameStore((s) => s.researching);
  const releasedDevices = useGameStore((s) => s.releasedDevices);
  const salesHistory = useGameStore((s) => s.salesHistory);
  const botCompanies = useGameStore((s) => s.botCompanies);
  const marketShare = useGameStore((s) => s.marketShare);
  const companyValuation = useGameStore((s) => s.companyValuation);
  const employees = useGameStore((s) => s.employees);
  const totalUnitsSold = useGameStore((s) => s.totalUnitsSold);
  const setScreen = useGameStore((s) => s.setScreen);
  const advanceMonth = useGameStore((s) => s.advanceMonth);

  const costs = lastFinance.productionCost + lastFinance.marketingCost + lastFinance.upkeep;
  const lastMonthRevenue = salesHistory[salesHistory.length - 1]?.revenue ?? 0;
  const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);

  // Calculate live market shares (memoized)
  const shares = useMemo(
    () => calcMarketShares(botCompanies, lastMonthRevenue, reputation, fans),
    [botCompanies, lastMonthRevenue, reputation, fans],
  );

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="animate-fade-up relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-surface-card via-surface-raised to-surface-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-glow/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/80 bg-black/30 px-3 py-1 text-xs font-medium text-muted backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              Garage HQ · Live
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{companyName}</h1>
            <p className="mt-2 max-w-lg text-muted">
              Month <span className="font-mono text-fg">{month}</span> · Day{' '}
              <span className="font-mono text-fg">{day}</span>
              {researching && (
                <span className="ml-2 text-glow">
                  · 🔬 Research {researching.daysLeft}d left
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="glow" onClick={() => setScreen('blueprints')}>
              Open Designer
            </Button>
            <Button variant="secondary" onClick={() => setScreen('devices')}>
              Marketing
            </Button>
            <Button variant="secondary" onClick={() => setScreen('devices')}>
              📈 Market ({releasedDevices.length})
            </Button>
            <Button variant="secondary" onClick={advanceMonth}>
              ▶ Next Month
            </Button>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricCard
          className="animate-fade-up stagger-1 opacity-0"
          label="Cash"
          value={`$${cash.toLocaleString()}`}
          sub={lastFinance.profit >= 0 ? `+${lastFinance.profit.toLocaleString()} yesterday` : `${lastFinance.profit.toLocaleString()} yesterday`}
          icon="💰"
          accent="cash"
        />
        <MetricCard
          className="animate-fade-up stagger-2 opacity-0"
          label="Fans"
          value={fans.toLocaleString()}
          sub="Brand reach"
          icon="❤️"
          accent="fans"
        />
        <MetricCard
          className="animate-fade-up stagger-3 opacity-0"
          label="Reputation"
          value={String(Math.round(reputation))}
          sub="Out of 100"
          icon="⭐"
          accent="rep"
        />
        <MetricCard
          className="animate-fade-up stagger-4 opacity-0"
          label="Revenue"
          value={`$${lastMonthRevenue.toLocaleString()}`}
          sub={`${releasedDevices.length} devices on market`}
          icon="📈"
          accent="sales"
        />
      </section>

      {/* Market Share & Competition */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Market Share Bar */}
        <Card className="lg:col-span-2" shine>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Market Share</h3>
              <p className="text-xs text-muted">Live competitive landscape</p>
            </div>
            <Badge tone={marketShare > 20 ? 'success' : marketShare > 10 ? 'accent' : 'danger'}>
              {marketShare}% your share
            </Badge>
          </div>
          <div className="space-y-3">
            {shares.map((sh) => (
              <div key={sh.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span>{sh.logo}</span>
                    <span className={sh.id === 'player' ? 'font-bold text-accent-soft' : 'text-fg'}>{sh.name}</span>
                  </span>
                  <span className="font-mono text-muted">{sh.share}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${sh.share}%`,
                      backgroundColor: sh.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Company Stats */}
        <Card shine>
          <h3 className="mb-4 font-semibold">Company Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between rounded-xl bg-surface-raised/80 px-3 py-2">
              <span className="text-xs text-muted">Valuation</span>
              <span className="font-mono text-sm font-bold text-success">${companyValuation.toLocaleString()}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-surface-raised/80 px-3 py-2">
              <span className="text-xs text-muted">Team Size</span>
              <span className="font-mono text-sm font-bold">{employees.length}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-surface-raised/80 px-3 py-2">
              <span className="text-xs text-muted">Monthly Payroll</span>
              <span className="font-mono text-sm font-bold text-warning">${totalSalary.toLocaleString()}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-surface-raised/80 px-3 py-2">
              <span className="text-xs text-muted">Devices Launched</span>
              <span className="font-mono text-sm font-bold">{releasedDevices.length}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-surface-raised/80 px-3 py-2">
              <span className="text-xs text-muted">Total Units Sold</span>
              <span className="font-mono text-sm font-bold">{totalUnitsSold.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </section>

      {/* Competitor Devices */}
      <Card shine>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Competitor Activity</h3>
            <p className="text-xs text-muted">Recent device launches from rivals</p>
          </div>
          <Button variant="secondary" onClick={() => setScreen('devices')}>
            View Full Market
          </Button>
        </div>
        <div className="space-y-2">
          {botCompanies.map((bot) => {
            const latestDevice = bot.releasedDevices[bot.releasedDevices.length - 1];
            return (
              <div
                key={bot.id}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface-raised/60 px-4 py-3 transition hover:border-border-bright"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                  style={{ backgroundColor: `${bot.color}20` }}
                >
                  {bot.logo}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{bot.name}</p>
                    <Badge tone={bot.trend === 'up' ? 'success' : bot.trend === 'down' ? 'danger' : 'neutral'}>
                      {bot.trend === 'up' ? '↑' : bot.trend === 'down' ? '↓' : '→'}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted">
                    {latestDevice
                      ? `Latest: ${latestDevice.name} (${latestDevice.category}) · Rep: ${Math.round(bot.reputation)}`
                      : `No devices yet · Rep: ${Math.round(bot.reputation)}`
                    }
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-success">${bot.monthlyRevenue.toLocaleString()}/mo</p>
                  <p className="text-[10px] text-muted">{bot.employees} employees</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUICK.map((q) => (
          <button
            key={q.screen}
            type="button"
            onClick={() => setScreen(q.screen)}
            className={`group rounded-2xl border border-border/60 bg-gradient-to-br ${q.gradient} p-4 text-left transition hover:scale-[1.02] hover:border-border-bright hover:shadow-lg`}
          >
            <span className="text-2xl">{q.icon}</span>
            <p className="mt-2 font-semibold">{q.label}</p>
            <p className="text-xs text-muted group-hover:text-fg/80">{q.desc}</p>
          </button>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Profit chart */}
        <Card className="xl:col-span-2" shine>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">Performance</h3>
              <p className="text-xs text-muted">Daily profit trend</p>
            </div>
            <span
              className={`font-mono text-lg font-bold ${lastFinance.profit >= 0 ? 'text-success' : 'text-danger'}`}
            >
              {lastFinance.profit >= 0 ? '+' : ''}${lastFinance.profit.toLocaleString()}
            </span>
          </div>
          <Sparkline data={profitHistory} height={80} />
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/60 pt-4 text-center text-xs">
            <div>
              <p className="text-muted">Revenue</p>
              <p className="font-mono font-semibold text-success">+${lastFinance.revenue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted">Costs</p>
              <p className="font-mono font-semibold text-danger">-${costs.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted">Margin</p>
              <p className="font-mono font-semibold">
                {lastFinance.revenue > 0
                  ? `${Math.round((lastFinance.profit / lastFinance.revenue) * 100)}%`
                  : '—'}
              </p>
            </div>
          </div>
        </Card>

        {/* Trends */}
        <Card shine>
          <h3 className="mb-1 font-semibold">Market Pulse</h3>
          <p className="mb-4 text-xs text-muted">Active demand modifiers</p>
          {marketTrends.length === 0 ? (
            <p className="rounded-xl bg-surface-raised/80 p-4 text-center text-sm text-muted">No trends — check tomorrow</p>
          ) : (
            <ul className="space-y-2">
              {marketTrends.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface-raised/60 px-3 py-2.5 transition hover:border-border-bright"
                >
                  <span className="text-xl">{t.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.label}</p>
                    <p className="text-[10px] text-muted">{t.daysLeft} days left</p>
                  </div>
                  <Badge tone={t.demandMultiplier >= 1 ? 'success' : 'danger'}>
                    {t.demandMultiplier >= 1 ? '+' : ''}
                    {Math.round((t.demandMultiplier - 1) * 100)}%
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Product lineup */}
      <Card shine>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Product Lineup</h3>
            <p className="text-sm text-muted">{releasedDevices.length} devices on market</p>
          </div>
          <Button variant="secondary" onClick={() => setScreen('blueprints')}>
            + New Design
          </Button>
        </div>

        {releasedDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-surface-raised/40 py-14 text-center">
            <span className="mb-3 text-5xl opacity-60">📱</span>
            <p className="font-medium">No devices released</p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Design a device and click "Release Device" to bring it to market.
            </p>
            <Button className="mt-5" variant="glow" onClick={() => setScreen('blueprints')}>
              Start Designing
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {releasedDevices.slice(0, 6).map((d) => {
              const meta = CATEGORY_META[d.category];
              const lastSales = d.monthlySales[d.monthlySales.length - 1] ?? 0;
              return (
                <div
                  key={d.id}
                  className="group rounded-2xl border border-border/60 bg-gradient-to-br from-surface-raised/80 to-surface-card p-4 transition hover:border-accent/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/30 text-2xl backdrop-blur-sm">
                      {meta.icon}
                    </div>
                    <Badge tone="accent">{meta.label}</Badge>
                  </div>
                  <h4 className="mt-3 font-semibold">{d.name}</h4>
                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-muted">
                        <span>Total Sold</span>
                        <span>{d.totalSold.toLocaleString()}</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-surface-hover">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent to-glow"
                          style={{ width: `${Math.min((d.totalSold / 100) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-muted">{lastSales}/mo</span>
                      <span className="text-success">${d.sellPrice}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
