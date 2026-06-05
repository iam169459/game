import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CAMPAIGNS } from '../data/marketing';
import { CATEGORY_META } from '../data/components';
import { useGameStore } from '../store/useGameStore';
import type { ReleasedDevice } from '../types';

type Tab = 'products' | 'trends' | 'overview';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'products', label: 'My Products', icon: '📱' },
  { id: 'trends', label: 'Market Trends', icon: '📈' },
  { id: 'overview', label: 'Sales Overview', icon: '📊' },
];

function ProductCard({ device }: { device: ReleasedDevice }) {
  const meta = CATEGORY_META[device.category];
  const overallScore = Math.round(
    Object.values(device.stats).reduce((a, b) => a + b, 0) / 6
  );
  const lastMonthSales = device.monthlySales[device.monthlySales.length - 1] ?? 0;
  const durabilityPercent = Math.round((device.durability / device.maxDurability) * 100);
  const repairDevice = useGameStore((s) => s.repairDevice);
  const missingDurability = device.maxDurability - device.durability;
  const repairCost = Math.round(missingDurability * device.maintenanceCost * 0.5);

  return (
    <div className="group rounded-2xl border border-border/60 bg-gradient-to-br from-surface-raised/80 to-surface-card p-5 transition hover:border-accent/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)]">
      <div className="flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-black/30 text-2xl backdrop-blur-sm">
          {meta.icon}
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="accent">{meta.label}</Badge>
          {durabilityPercent < 50 && (
            <Badge tone="danger">Needs Repair</Badge>
          )}
        </div>
      </div>

      <h4 className="mt-3 text-lg font-semibold">{device.name}</h4>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-raised/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted">Score</p>
          <p className="font-mono text-lg font-bold text-fg">{overallScore}</p>
        </div>
        <div className="rounded-xl bg-surface-raised/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted">Price</p>
          <p className="font-mono text-lg font-bold text-accent-soft">${device.sellPrice}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-border/50 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Total Sold</span>
          <span className="font-mono font-semibold">{device.totalSold.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Monthly Sales</span>
          <span className="font-mono font-semibold">{lastMonthSales}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Revenue</span>
          <span className="font-mono font-semibold text-success">${device.totalRevenue.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Profit</span>
          <span className={`font-mono font-semibold ${device.totalProfit > 0 ? 'text-success' : 'text-danger'}`}>
            ${device.totalProfit.toLocaleString()}
          </span>
        </div>
        
        {/* Durability Section */}
        <div className="mt-3 border-t border-border/50 pt-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted">Durability</span>
            <span className="font-mono font-semibold">{device.durability}/{device.maxDurability}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                durabilityPercent > 70 ? 'bg-success' : 
                durabilityPercent > 40 ? 'bg-yellow-500' : 'bg-danger'
              }`}
              style={{ width: `${durabilityPercent}%` }}
            />
          </div>
          {missingDurability > 0 && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-muted">Repair cost: ${repairCost}</span>
              <Button 
                variant="glow"
                onClick={() => repairDevice(device.id)}
              >
                Repair
              </Button>
            </div>
          )}
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Revenue</span>
          <span className="font-mono font-semibold text-success">${device.totalRevenue.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Profit</span>
          <span className={`font-mono font-semibold ${device.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
            ${device.totalProfit.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Last Month</span>
          <span className="font-mono font-semibold">{lastMonthSales} units</span>
        </div>
      </div>

      {device.monthlySales.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-muted">Monthly Sales Trend</p>
          <div className="flex items-end gap-1 h-12">
            {device.monthlySales.map((sales, i) => {
              const max = Math.max(...device.monthlySales, 1);
              const height = (sales / max) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-accent to-glow"
                  style={{ height: `${Math.max(height, 5)}%` }}
                  title={`${sales} units`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MarketTrendsTab() {
  const marketTrends = useGameStore((s) => s.marketTrends);
  const marketEvents = useGameStore((s) => s.marketEvents);
  const activeCampaignIds = useGameStore((s) => s.activeCampaignIds);
  const cash = useGameStore((s) => s.cash);
  const toggleCampaign = useGameStore((s) => s.toggleCampaign);

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 font-semibold">Active Marketing Campaigns</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {CAMPAIGNS.map((c) => {
            const active = activeCampaignIds.includes(c.id);
            return (
              <div
                key={c.id}
                className={`rounded-xl border p-4 transition ${
                  active
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-border/50 bg-surface-raised/60 hover:border-border-bright'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{c.name}</h4>
                  <Badge tone={active ? 'success' : 'neutral'}>
                    {active ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted">
                  ${c.dailyCost}/day · +{c.appealBoost} appeal
                </p>
                <Button
                  className="mt-3 w-full"
                  variant={active ? 'secondary' : 'primary'}
                  disabled={!active && cash < c.dailyCost}
                  onClick={() => toggleCampaign(c.id)}
                >
                  {active ? 'Pause' : 'Launch'}
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Live Market Trends</h3>
        {marketTrends.length === 0 ? (
          <p className="rounded-xl bg-surface-raised/80 p-4 text-center text-sm text-muted">
            No active trends — they appear randomly
          </p>
        ) : (
          <ul className="space-y-2">
            {marketTrends.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface-raised/60 px-4 py-3 transition hover:border-border-bright"
              >
                <span className="text-2xl">{t.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t.label}</p>
                  <p className="text-xs text-muted">
                    {t.category === 'all' ? 'All categories' : CATEGORY_META[t.category].label} · {t.daysLeft} days left
                  </p>
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

      {marketEvents.length > 0 && (
        <Card glow>
          <h3 className="mb-4 font-semibold">Active Events</h3>
          <ul className="space-y-2">
            {marketEvents.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3"
              >
                <span className="text-2xl">{e.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{e.label}</p>
                  <p className="text-xs text-muted">{e.description}</p>
                </div>
                <Badge tone="accent">{e.daysLeft} months left</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function SalesOverviewTab() {
  const salesHistory = useGameStore((s) => s.salesHistory);
  const competitors = useGameStore((s) => s.competitors);
  const releasedDevices = useGameStore((s) => s.releasedDevices);

  const totalRevenue = salesHistory.reduce((sum, s) => sum + s.revenue, 0);
  const totalProfit = salesHistory.reduce((sum, s) => sum + s.profit, 0);
  const totalUnits = salesHistory.reduce((sum, s) => sum + s.unitsSold, 0);

  const topDevices = [...releasedDevices]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 3);

  const maxRevenue = Math.max(...salesHistory.map((s) => s.revenue), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-[10px] uppercase tracking-wider text-muted">Total Revenue</p>
          <p className="mt-1 font-mono text-2xl font-bold text-success">${totalRevenue.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase tracking-wider text-muted">Total Profit</p>
          <p className={`mt-1 font-mono text-2xl font-bold ${totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
            ${totalProfit.toLocaleString()}
          </p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase tracking-wider text-muted">Units Sold</p>
          <p className="mt-1 font-mono text-2xl font-bold text-fg">{totalUnits.toLocaleString()}</p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 font-semibold">Monthly Revenue</h3>
        {salesHistory.length === 0 ? (
          <p className="rounded-xl bg-surface-raised/80 p-8 text-center text-sm text-muted">
            No sales data yet. Release devices and advance months to see revenue.
          </p>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {salesHistory.map((s, i) => {
              const height = (s.revenue / maxRevenue) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-[10px] font-mono text-muted">${(s.revenue / 1000).toFixed(1)}k</p>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-accent to-glow"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                  <p className="text-[10px] text-muted">M{s.month}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold">Top Selling Devices</h3>
          {topDevices.length === 0 ? (
            <p className="text-sm text-muted">No devices released yet.</p>
          ) : (
            <ul className="space-y-3">
              {topDevices.map((d, i) => {
                const meta = CATEGORY_META[d.category];
                return (
                  <li key={d.id} className="flex items-center gap-3 rounded-xl bg-surface-raised/60 px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-sm font-bold text-accent">
                      #{i + 1}
                    </span>
                    <span className="text-xl">{meta.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{d.name}</p>
                      <p className="text-xs text-muted">{d.totalSold.toLocaleString()} units</p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-success">
                      ${d.totalRevenue.toLocaleString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold">Competitor Summary</h3>
          <ul className="space-y-3">
            {competitors.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-xl bg-surface-raised/60 px-4 py-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted">Rep: {c.reputation}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">{c.monthlySales}/mo</p>
                  <p className={`text-xs ${
                    c.trend === 'up' ? 'text-success' : c.trend === 'down' ? 'text-danger' : 'text-muted'
                  }`}>
                    {c.trend === 'up' ? '↑ Rising' : c.trend === 'down' ? '↓ Falling' : '→ Stable'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export function Market() {
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const releasedDevices = useGameStore((s) => s.releasedDevices);
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Market & Sales</h1>
          <p className="text-muted">Track sales, trends, and competitors</p>
        </div>
        <Button variant="glow" onClick={() => setScreen('blueprints')}>
          + New Device
        </Button>
      </div>

      <div className="flex gap-1 rounded-xl bg-surface-raised/60 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-accent/20 text-accent-soft shadow-sm'
                : 'text-muted hover:text-fg'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'products' && (
        <>
          {releasedDevices.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="mb-4 text-6xl opacity-40">📱</span>
                <p className="text-lg font-semibold">No devices released yet</p>
                <p className="mt-2 max-w-md text-sm text-muted">
                  Design a device in the Designer, then click "Release Device" to bring it to market.
                </p>
                <Button className="mt-6" variant="glow" onClick={() => setScreen('blueprints')}>
                  Start Designing
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {releasedDevices.map((device) => (
                <ProductCard key={device.id} device={device} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'trends' && <MarketTrendsTab />}
      {activeTab === 'overview' && <SalesOverviewTab />}
    </div>
  );
}
