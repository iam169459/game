import { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { COMPONENTS, CATEGORY_META, SLOTS_BY_CATEGORY } from '../data/components';
import { useGameStore } from '../store/useGameStore';
import type { DeviceCategory, ComponentSlot } from '../types';

const SLOT_META: Record<ComponentSlot, { label: string; icon: string }> = {
  screen:       { label: 'Screen',       icon: '🖥️' },
  cpu:          { label: 'CPU',          icon: '⚡' },
  ram:          { label: 'RAM',          icon: '🧩' },
  storage:      { label: 'Storage',      icon: '💾' },
  camera:       { label: 'Camera',       icon: '📷' },
  battery:      { label: 'Battery',      icon: '🔋' },
  chassis:      { label: 'Chassis',      icon: '📐' },
  audio:        { label: 'Audio',        icon: '🎧' },
  connectivity: { label: 'Connectivity', icon: '📡' },
};

const TIER_COLORS: Record<number, string> = {
  1: 'bg-surface-hover text-muted',
  2: 'bg-blue-500/15 text-blue-400',
  3: 'bg-purple-500/15 text-purple-400',
  4: 'bg-amber-500/15 text-amber-400',
  5: 'bg-pink-500/15 text-pink-400',
};

export function BlueprintsTab() {
  const unlockedTech = useGameStore((s) => s.unlockedTech);
  const designs = useGameStore((s) => s.designs);
  const setScreen = useGameStore((s) => s.setScreen);
  const draft = useGameStore((s) => s.draft);
  const setDraftCategory = useGameStore((s) => s.setDraftCategory);
  const setDraftName = useGameStore((s) => s.setDraftName);
  const setDraftComponent = useGameStore((s) => s.setDraftComponent);
  const setDraftSellPrice = useGameStore((s) => s.setDraftSellPrice);
  const releaseDevice = useGameStore((s) => s.releaseDevice);

  const [activeCategory, setActiveCategory] = useState<DeviceCategory>(draft.category);


  const availableBySlot = useMemo(() => {
    const map: Partial<Record<ComponentSlot, typeof COMPONENTS[0][]>> = {};
    for (const slot of SLOTS_BY_CATEGORY[activeCategory]) {
      map[slot] = COMPONENTS.filter(
        (c) => c.slot === slot && c.categories.includes(activeCategory) && (!c.unlockTech || unlockedTech.includes(c.unlockTech))
      );
    }
    return map;
  }, [activeCategory, unlockedTech]);

  const totalStats = useMemo(() => {
    const stats = { performance: 20, display: 20, camera: 15, battery: 25, build: 25, appeal: 20 };
    for (const id of Object.values(draft.components)) {
      if (!id) continue;
      const c = COMPONENTS.find((comp) => comp.id === id);
      if (!c) continue;
      for (const [k, v] of Object.entries(c.stats)) {
        if (v !== undefined) stats[k as keyof typeof stats] += v;
      }
    }
    return stats;
  }, [draft.components]);

  const avgScore = Object.values(totalStats).reduce((a, b) => a + b, 0) / 6;

  return (
    <div className="space-y-4">
      {/* Category Selector */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {(['smartphone', 'laptop', 'smartwatch', 'tablet', 'earbuds', 'smarttv'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setActiveCategory(cat);
              setDraftCategory(cat);
            }}
            className={`rounded-xl border p-2 text-center transition flex flex-col items-center justify-center ${
              activeCategory === cat
                ? 'border-accent/50 bg-accent/10 text-accent-soft shadow-lg shadow-accent/10'
                : 'border-border/40 bg-surface-card/60 text-muted hover:border-border-bright'
            }`}
          >
            <span className="text-xl">{CATEGORY_META[cat].icon}</span>
            <p className="mt-0.5 text-[10px] font-medium leading-tight">{CATEGORY_META[cat].label}</p>
          </button>
        ))}
      </div>

      {/* Draft Name */}
      <div className="rounded-xl border border-border/40 bg-surface-card/60 p-4">
        <label className="text-[10px] uppercase tracking-wider text-muted">Device Name</label>
        <input
          value={draft.name}
          onChange={(e) => setDraftName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-fg outline-none focus:border-accent"
          placeholder="Enter device name..."
        />
      </div>

      {/* Score Preview */}
      <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-accent/5 p-4">
        <div>
          <p className="text-[10px] uppercase text-muted">Design Score</p>
          <p className="font-mono text-2xl font-bold text-accent-soft">{avgScore.toFixed(1)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase text-muted">Components</p>
          <p className="font-mono text-sm text-fg">
            {Object.values(draft.components).filter(Boolean).length} / {SLOTS_BY_CATEGORY[activeCategory].length}
          </p>
        </div>
      </div>

      {/* Component Slots */}
      <div className="space-y-3">
        {SLOTS_BY_CATEGORY[activeCategory].map((slot) => {
          const meta = SLOT_META[slot];
          const options = availableBySlot[slot] ?? [];
          const selected = draft.components[slot];
          return (
            <div key={slot} className="rounded-xl border border-border/40 bg-surface-card/60 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{meta.icon}</span>
                <span className="text-xs font-medium text-fg">{meta.label}</span>
                {selected && (
                  <span className="ml-auto rounded bg-success/15 px-1.5 py-0.5 text-[9px] font-medium text-success">
                    Selected
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {options.map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => setDraftComponent(slot, comp.id)}
                    className={`rounded-xl border px-3 py-2 text-[10px] font-medium transition flex flex-col items-start gap-0.5 min-w-[125px] ${
                      selected === comp.id
                        ? 'border-accent bg-accent/15 text-accent-soft'
                        : 'border-border/40 bg-surface-hover/60 text-muted hover:border-border-bright hover:text-fg'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="font-semibold text-fg">{comp.name}</span>
                      <span className={`rounded px-1 py-0.2 text-[8px] font-bold ${TIER_COLORS[comp.tier]}`}>
                        T{comp.tier}
                      </span>
                    </div>
                    <div className="flex justify-between w-full text-[9px] text-muted/80 mt-0.5">
                      <span>Cost: ${comp.cost}</span>
                      <span className="font-mono text-[8px] text-accent-soft/90 ml-2">
                        {Object.entries(comp.stats)
                          .map(([k, v]) => `${k.slice(0, 3)}:${v! > 0 ? '+' : ''}${v}`)
                          .join(' ')}
                      </span>
                    </div>
                  </button>
                ))}
                {options.length === 0 && (
                  <p className="text-[10px] text-muted italic">Research tech to unlock components</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Price & Release */}
      <div className="rounded-xl border border-border/40 bg-surface-card/60 p-4">
        <label className="text-[10px] uppercase tracking-wider text-muted">Sell Price ($)</label>
        <input
          type="number"
          value={draft.sellPrice}
          onChange={(e) => setDraftSellPrice(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
        <p className="mt-1 text-[10px] text-muted">
          Unit cost: ${Object.values(draft.components).reduce((sum, id) => {
            const c = COMPONENTS.find((comp) => comp.id === id);
            return sum + (c?.cost ?? 0);
          }, 8).toFixed(0)}
        </p>
      </div>

      <Button
        variant="glow"
        className="w-full py-3"
        disabled={Object.values(draft.components).filter(Boolean).length < SLOTS_BY_CATEGORY[activeCategory].length}
        onClick={() => {
          const ok = releaseDevice();
          if (ok) setScreen('devices');
        }}
      >
        Release Device
      </Button>

      {/* Saved Designs */}
      {designs.length > 0 && (
        <div className="border-t border-border/40 pt-4">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-muted">Saved Designs ({designs.length})</p>
          <div className="space-y-2">
            {designs.slice(-3).map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-surface-card/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span>{CATEGORY_META[d.category].icon}</span>
                  <span className="text-xs font-medium text-fg">{d.name}</span>
                </div>
                <span className="font-mono text-xs text-success">${d.sellPrice}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
