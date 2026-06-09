import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { CAMPAIGNS } from '../data/marketing';
import { CATEGORY_META } from '../data/components';
import { useGameStore } from '../store/useGameStore';
import type { ReleasedDevice, DeviceCategory } from '../types';

function DeviceCard({ device }: { device: ReleasedDevice }) {
  const meta = CATEGORY_META[device.category];
  const overallScore = Object.values(device.stats).reduce((a, b) => a + b, 0) / 6;
  const criticScore = Math.min(10, Number((overallScore / 12).toFixed(1)));
  const lastMonthSales = device.monthlySales[device.monthlySales.length - 1] ?? 0;
  const durabilityPercent = Math.round((device.durability / device.maxDurability) * 100);
  const repairDevice = useGameStore((s) => s.repairDevice);
  const discontinueDevice = useGameStore((s) => s.discontinueDevice);
  const missingDurability = device.maxDurability - device.durability;
  const repairCost = Math.round(missingDurability * device.maintenanceCost * 0.5);
  const hype = device.hype ?? 50;

  return (
    <div className="rounded-xl border border-border/50 bg-surface-card/80 p-4 transition hover:border-border-bright">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-hover text-2xl">
            {meta.icon}
          </div>
          <div>
            <h3 className="font-semibold text-fg">{device.name}</h3>
            <p className="text-xs text-muted">
              {meta.label} {device.isDiscontinued && <span className="text-danger-soft font-semibold">(Discontinued)</span>}
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-accent/15 px-2.5 py-1 text-center">
          <p className="text-[9px] uppercase text-accent-soft">Score</p>
          <p className="font-mono text-lg font-bold text-accent-soft">{criticScore}</p>
          <p className="text-[8px] text-muted">/10</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {Object.entries(device.stats).map(([stat, val]) => (
          <div key={stat} className="rounded-lg bg-surface-hover/60 px-2 py-1.5 text-center">
            <p className="text-[8px] uppercase text-muted">{stat}</p>
            <p className="font-mono text-xs font-bold text-fg">{val}</p>
          </div>
        ))}
      </div>

      {/* Hype Level */}
      <div className="mt-3 rounded-lg bg-accent/5 p-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Device Hype</span>
          <span className="font-mono font-bold text-accent-soft">{hype}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-hover">
          <div
            className="h-full rounded-full bg-accent-soft transition-all"
            style={{ width: `${hype}%` }}
          />
        </div>
      </div>

      {/* Cash Generation */}
      <div className="mt-3 flex items-center justify-between rounded-lg bg-success/10 px-3 py-2">
        <span className="text-xs text-success">Monthly Revenue</span>
        <span className="font-mono text-sm font-bold text-success">
          ${(lastMonthSales * device.sellPrice).toLocaleString()}
        </span>
      </div>

      {/* Sales Info */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>Total Sold: {device.totalSold.toLocaleString()}</span>
        <span>Price: ${device.sellPrice}</span>
      </div>

      {/* Durability */}
      <div className="mt-3 border-t border-border/40 pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Durability</span>
          <span className="font-mono">{device.durability}/{device.maxDurability}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-hover">
          <div
            className={`h-full rounded-full transition-all ${
              durabilityPercent > 70 ? 'bg-success' : durabilityPercent > 40 ? 'bg-warning' : 'bg-danger'
            }`}
            style={{ width: `${durabilityPercent}%` }}
          />
        </div>
        {missingDurability > 0 && !device.isDiscontinued && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-muted">Repair: ${repairCost.toLocaleString()}</span>
            <button
              type="button"
              onClick={() => repairDevice(device.id)}
              className="rounded-md bg-warning/15 px-2 py-1 text-[10px] font-medium text-warning transition hover:bg-warning/25"
            >
              Repair
            </button>
          </div>
        )}
      </div>

      {/* Upkeep info & Discontinue Button */}
      {!device.isDiscontinued ? (
        <div className="mt-3 border-t border-border/40 pt-3 flex items-center justify-between gap-3">
          <div className="text-[10px] text-muted">
            <p>Upkeep: <span className="font-mono text-warning font-semibold">$150,000/mo</span></p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Discontinue ${device.name}? This halts factory production and stops the monthly $150k upkeep fee.`)) {
                discontinueDevice(device.id);
              }
            }}
            className="rounded-lg bg-danger/15 px-2.5 py-1 text-[10px] font-semibold text-danger transition hover:bg-danger/25"
          >
            🛑 Discontinue
          </button>
        </div>
      ) : (
        <div className="mt-3 border-t border-border/40 pt-3 text-center text-[10px] font-medium text-muted">
          🚫 Discontinued · Liquidating remaining stock
        </div>
      )}

      {/* Sales Trend */}
      {device.monthlySales.length > 1 && (
        <div className="mt-3 flex items-end gap-0.5 h-6">
          {device.monthlySales.slice(-8).map((sales, i) => {
            const max = Math.max(...device.monthlySales, 1);
            const height = (sales / max) * 100;
            return (
              <div
                key={i}
                className="flex-1 rounded-t bg-accent/40"
                style={{ height: `${Math.max(height, 8)}%` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DevicesTab() {
  const releasedDevices = useGameStore((s) => s.releasedDevices);
  const factories = useGameStore((s) => s.factories);
  const designs = useGameStore((s) => s.designs);
  const inventory = useGameStore((s) => s.inventory);
  const cash = useGameStore((s) => s.cash);
  const activeCampaignIds = useGameStore((s) => s.activeCampaignIds);
  const toggleCampaign = useGameStore((s) => s.toggleCampaign);
  const buyFactory = useGameStore((s) => s.buyFactory);
  const setScreen = useGameStore((s) => s.setScreen);
  const [filter, setFilter] = useState<DeviceCategory | 'all'>('all');
  const [showFactory, setShowFactory] = useState(false);
  const [showMarketing, setShowMarketing] = useState(false);

  const filtered = filter === 'all' ? releasedDevices : releasedDevices.filter((d) => d.category === filter);
  const totalRevenue = releasedDevices.reduce((sum, d) => sum + d.totalRevenue, 0);
  const totalSold = releasedDevices.reduce((sum, d) => sum + d.totalSold, 0);
  const activeLines = factories.filter((f) => f.assignedProductId).length;
  const newLineCost = 32000 + factories.length * 15000;

  return (
    <div className="space-y-4">
      {/* Quick Access: Factory & Marketing */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setShowFactory(!showFactory)}
          className={`rounded-xl border p-3 text-left transition ${
            showFactory
              ? 'border-amber-500/50 bg-amber-500/10'
              : 'border-border/40 bg-surface-card/60 hover:border-border-bright'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg">🏭</span>
            <span className="text-[9px] text-muted">{factories.length} lines</span>
          </div>
          <p className="mt-1 text-xs font-medium text-fg">Factory</p>
          <p className="text-[10px] text-muted">{activeLines} active</p>
        </button>
        <button
          type="button"
          onClick={() => setShowMarketing(!showMarketing)}
          className={`rounded-xl border p-3 text-left transition ${
            showMarketing
              ? 'border-pink-500/50 bg-pink-500/10'
              : 'border-border/40 bg-surface-card/60 hover:border-border-bright'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg">📣</span>
            <span className="text-[9px] text-muted">{activeCampaignIds.length} active</span>
          </div>
          <p className="mt-1 text-xs font-medium text-fg">Marketing</p>
          <p className="text-[10px] text-muted">{CAMPAIGNS.length} available</p>
        </button>
      </div>

      {/* Factory Panel */}
      {showFactory && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-fg">🏭 Production Lines</h3>
            <Button
              variant="secondary"
              className="text-xs py-1 px-2"
              disabled={cash < newLineCost}
              onClick={() => buyFactory()}
            >
              + New (${(newLineCost / 1000).toFixed(0)}K)
            </Button>
          </div>
          <div className="space-y-2">
            {factories.map((line) => {
              const assignedDesign = designs.find((d) => d.id === line.assignedProductId);
              const units = inventory[line.assignedProductId ?? ''] ?? 0;
              return (
                <div key={line.id} className="flex items-center justify-between rounded-lg bg-surface-card/40 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-fg truncate">{line.name}</p>
                    <p className="text-[10px] text-muted">
                      {assignedDesign ? assignedDesign.name : 'Idle'} · Lv{line.level}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-muted">Cap: {line.capacity}</span>
                    <span className="font-mono text-accent-soft">{Math.round(line.progress)}%</span>
                    <span className="font-mono text-success">{units} units</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Button variant="secondary" className="w-full text-xs" onClick={() => setScreen('blueprints')}>
            Assign Products in Lab
          </Button>
        </div>
      )}

      {/* Marketing Panel */}
      {showMarketing && (
        <div className="rounded-xl border border-pink-500/30 bg-pink-500/5 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-fg">📣 Marketing Campaigns</h3>
          <div className="space-y-2">
            {CAMPAIGNS.map((campaign) => {
              const active = activeCampaignIds.includes(campaign.id);
              return (
                  <div key={campaign.id} className="flex items-center justify-between rounded-lg bg-surface-card/40 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-fg">{campaign.name}</p>
                    <p className="text-[10px] text-muted">${campaign.dailyCost}/day · +{campaign.appealBoost} appeal</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCampaign(campaign.id)}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition ${
                      active
                        ? 'bg-success/15 text-success'
                        : 'bg-surface-hover text-muted hover:text-fg'
                    }`}
                  >
                    {active ? 'Active' : 'Activate'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border/40 bg-surface-card/60 p-3 text-center">
          <p className="text-[9px] uppercase text-muted">Devices</p>
          <p className="font-mono text-xl font-bold text-fg">{releasedDevices.length}</p>
        </div>
        <div className="rounded-xl border border-border/40 bg-surface-card/60 p-3 text-center">
          <p className="text-[9px] uppercase text-muted">Total Sold</p>
          <p className="font-mono text-xl font-bold text-accent-soft">{totalSold.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border/40 bg-surface-card/60 p-3 text-center">
          <p className="text-[9px] uppercase text-muted">Revenue</p>
          <p className="font-mono text-xl font-bold text-success">${totalRevenue >= 1000000 ? `${(totalRevenue / 1000000).toFixed(1)}M` : totalRevenue >= 1000 ? `${(totalRevenue / 1000).toFixed(0)}K` : totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto">
        {(['all', 'smartphone', 'laptop', 'smartwatch'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition ${
              filter === cat
                ? 'bg-accent/20 text-accent-soft ring-1 ring-accent/30'
                : 'bg-surface-card/60 text-muted hover:text-fg'
            }`}
          >
            {cat === 'all' ? 'All Devices' : CATEGORY_META[cat].icon + ' ' + CATEGORY_META[cat].label}
          </button>
        ))}
      </div>

      {/* Device List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.filter((d) => !d.isDiscontinued).map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}

          {filtered.filter((d) => d.isDiscontinued).length > 0 && (
            <div className="mt-6 border-t border-border/20 pt-4">
              <details className="group" open={false}>
                <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold text-muted select-none hover:text-fg">
                  <span>📁 Legacy & Discontinued Devices ({filtered.filter((d) => d.isDiscontinued).length})</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <div className="mt-3 space-y-3">
                  {filtered.filter((d) => d.isDiscontinued).map((device) => (
                    <DeviceCard key={device.id} device={device} />
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-5xl opacity-40">📱</div>
          <p className="text-sm font-medium text-fg">No devices yet</p>
          <p className="mt-1 text-xs text-muted">Design your first device in the Blueprints tab</p>
          <Button variant="glow" className="mt-4" onClick={() => setScreen('blueprints')}>
            Go to Blueprints
          </Button>
        </div>
      )}
    </div>
  );
}
