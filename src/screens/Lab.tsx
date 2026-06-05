import { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { COMPONENTS } from '../data/components';
import { getTechEffects } from '../lib/gameLogic';
import { useGameStore } from '../store/useGameStore';
import type { ComponentDef, ComponentSlot, CraftedPart } from '../types';

const SLOT_META: Record<ComponentSlot, { label: string; icon: string; gradient: string }> = {
  screen: { label: 'Screen', icon: '🖥️', gradient: 'from-blue-500 to-cyan-500' },
  cpu: { label: 'Processor', icon: '⚡', gradient: 'from-violet-500 to-purple-500' },
  ram: { label: 'RAM', icon: '🧩', gradient: 'from-emerald-500 to-teal-500' },
  storage: { label: 'Storage', icon: '💾', gradient: 'from-amber-500 to-orange-500' },
  camera: { label: 'Camera', icon: '📷', gradient: 'from-pink-500 to-rose-500' },
  battery: { label: 'Battery', icon: '🔋', gradient: 'from-green-500 to-lime-500' },
  chassis: { label: 'Design', icon: '📐', gradient: 'from-slate-400 to-zinc-400' },
};

const TIER_META: Record<number, { label: string; color: string }> = {
  1: { label: 'Basic', color: 'bg-surface-hover text-muted' },
  2: { label: 'Mid-range', color: 'bg-blue-500/15 text-blue-400' },
  3: { label: 'Premium', color: 'bg-purple-500/15 text-purple-400' },
  4: { label: 'Flagship', color: 'bg-amber-500/15 text-amber-400' },
  5: { label: 'Legendary', color: 'bg-pink-500/15 text-pink-400' },
};

type AnyPart = ComponentDef | CraftedPart;

function PartCard({
  part,
  isSelected,
  onClick,
  showSource,
}: {
  part: AnyPart;
  isSelected: boolean;
  onClick: () => void;
  showSource?: boolean;
}) {
  const tier = TIER_META[part.tier] ?? TIER_META[1];
  const isCrafted = 'craftedFrom' in part;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-3 text-left transition-all duration-200 ${
        isSelected
          ? 'border-accent/50 bg-accent/10 shadow-[0_0_16px_rgba(59,130,246,0.12)]'
          : 'border-border/50 bg-surface-raised/60 hover:border-border-bright hover:bg-surface-hover'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-fg">{part.name}</span>
        <div className="flex items-center gap-1">
          {isCrafted && <Badge tone="accent">Crafted</Badge>}
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${tier.color}`}>
            T{part.tier}
          </span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {Object.entries(part.stats).map(([stat, val]) => (
          <span key={stat} className="inline-flex items-center gap-0.5 rounded bg-surface-hover/80 px-1.5 py-0.5 text-[10px] text-muted">
            <span className="capitalize">{stat}</span>
            <span className="font-mono text-fg">+{val}</span>
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-xs text-success">${part.cost}</span>
        {showSource && isCrafted && (
          <span className="text-[10px] text-muted/60">Crafted</span>
        )}
      </div>
    </button>
  );
}

function CombinePreview({
  part1,
  part2,
  slot,
}: {
  part1: AnyPart | null;
  part2: AnyPart | null;
  slot: ComponentSlot;
}) {
  if (!part1 || !part2) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-12 text-center">
        <span className="mb-3 text-4xl opacity-30">⚗️</span>
        <p className="text-sm text-muted">Select two parts to combine</p>
        <p className="mt-1 text-[10px] text-muted/60">Result will appear here</p>
      </div>
    );
  }

  const maxTier = Math.max(part1.tier, part2.tier);
  const bonusMultiplier = 1.2 + (maxTier * 0.1);
  const avgTier = (part1.tier + part2.tier) / 2;
  const resultTier = Math.min(5, Math.ceil(avgTier + 0.5));

  const mergedStats: Record<string, number> = {};
  const allStatKeys = new Set([...Object.keys(part1.stats), ...Object.keys(part2.stats)]);
  for (const key of allStatKeys) {
    const v1 = (part1.stats as Record<string, number>)[key] ?? 0;
    const v2 = (part2.stats as Record<string, number>)[key] ?? 0;
    mergedStats[key] = Math.round(Math.max(v1, v2) * bonusMultiplier + Math.min(v1, v2) * 0.5);
  }

  const combineCost = Math.floor((part1.cost + part2.cost) * 0.5);
  const resultCost = Math.round((part1.cost + part2.cost) * 0.7);
  const resultTierMeta = TIER_META[resultTier] ?? TIER_META[1];
  const slotMeta = SLOT_META[slot];

  const namePrefix = resultTier >= 5 ? 'Ultra' : resultTier >= 4 ? 'Pro Max' : resultTier >= 3 ? 'Enhanced' : 'Refined';

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
      <div className="mb-4 flex items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted">Part A</p>
          <p className="text-sm font-semibold text-fg">{part1.name}</p>
          <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] ${TIER_META[part1.tier]?.color ?? ''}`}>
            T{part1.tier}
          </span>
        </div>
        <span className="text-2xl text-accent">+</span>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted">Part B</p>
          <p className="text-sm font-semibold text-fg">{part2.name}</p>
          <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] ${TIER_META[part2.tier]?.color ?? ''}`}>
            T{part2.tier}
          </span>
        </div>
        <span className="text-2xl text-glow">→</span>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted">Result</p>
          <p className="text-sm font-bold text-accent-soft">{namePrefix} {slotMeta.label}</p>
          <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${resultTierMeta.color}`}>
            T{resultTier}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-raised/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted">Combine Cost</p>
          <p className="font-mono text-lg font-bold text-warning">${combineCost}</p>
        </div>
        <div className="rounded-xl bg-surface-raised/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted">Result Value</p>
          <p className="font-mono text-lg font-bold text-accent-soft">${resultCost}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[10px] uppercase tracking-wider text-muted">Projected Stats</p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(mergedStats).map(([stat, val]) => (
            <span key={stat} className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-xs text-accent-soft">
              <span className="capitalize">{stat}</span>
              <span className="font-mono font-bold">+{val}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Lab() {
  const cash = useGameStore((s) => s.cash);
  const craftedParts = useGameStore((s) => s.craftedParts);
  const combineParts = useGameStore((s) => s.combineParts);
  const deleteCraftedPart = useGameStore((s) => s.deleteCraftedPart);
  const unlockedTech = useGameStore((s) => s.unlockedTech);

  const { labUnlocked } = useMemo(() => getTechEffects(unlockedTech), [unlockedTech]);

  const [activeSlot, setActiveSlot] = useState<ComponentSlot>('cpu');
  const [selectedPart1, setSelectedPart1] = useState<AnyPart | null>(null);
  const [selectedPart2, setSelectedPart2] = useState<AnyPart | null>(null);
  const [showCrafted, setShowCrafted] = useState(false);

  if (!labUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-fg mb-2">Lab Locked</h2>
        <p className="text-muted text-center max-w-md">
          Research the <span className="text-accent font-semibold">Part Assembly Lab</span> technology to unlock the Lab for combining parts.
        </p>
        <Button 
          variant="ghost" 
          onClick={() => useGameStore.getState().setScreen('blueprints')}
          className="mt-6"
        >
          Go to Research
        </Button>
      </div>
    );
  }

  const availableParts = useMemo(() => {
    const base = COMPONENTS.filter((c) => c.slot === activeSlot);
    const crafted = craftedParts.filter((c) => c.slot === activeSlot);
    return showCrafted ? [...base, ...crafted] : base;
  }, [activeSlot, craftedParts, showCrafted]);

  const handleSelectPart = (part: AnyPart) => {
    if (!selectedPart1 || (selectedPart1 && selectedPart2)) {
      setSelectedPart1(part);
      setSelectedPart2(null);
    } else if (selectedPart1.id !== part.id) {
      setSelectedPart2(part);
    }
  };

  const handleCombine = () => {
    if (!selectedPart1 || !selectedPart2) return;
    const success = combineParts(activeSlot, selectedPart1.id, selectedPart2.id);
    if (success) {
      setSelectedPart1(null);
      setSelectedPart2(null);
    }
  };

  const combineCost = selectedPart1 && selectedPart2
    ? Math.floor((selectedPart1.cost + selectedPart2.cost) * 0.5)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">R&D Lab</h1>
          <p className="text-muted">Combine parts to craft powerful custom components</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Cash:</span>
          <span className="font-mono text-sm font-bold text-success">${cash.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-surface-raised/60 p-1">
        {(Object.keys(SLOT_META) as ComponentSlot[]).map((slot) => {
          const meta = SLOT_META[slot];
          return (
            <button
              key={slot}
              type="button"
              onClick={() => {
                setActiveSlot(slot);
                setSelectedPart1(null);
                setSelectedPart2(null);
              }}
              className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                activeSlot === slot
                  ? 'bg-accent/20 text-accent-soft shadow-sm'
                  : 'text-muted hover:text-fg'
              }`}
            >
              {meta.icon}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">{SLOT_META[activeSlot].icon} {SLOT_META[activeSlot].label} Parts</h3>
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={showCrafted}
                  onChange={(e) => setShowCrafted(e.target.checked)}
                  className="rounded border-border bg-surface-raised accent-accent"
                />
                Show crafted
              </label>
            </div>
            <div className="custom-scrollbar grid max-h-[400px] gap-2 overflow-y-auto sm:grid-cols-2">
              {availableParts.map((part) => (
                <PartCard
                  key={part.id}
                  part={part}
                  isSelected={selectedPart1?.id === part.id || selectedPart2?.id === part.id}
                  onClick={() => handleSelectPart(part)}
                />
              ))}
              {availableParts.length === 0 && (
                <div className="col-span-2 flex flex-col items-center rounded-xl border border-dashed border-border/50 py-8 text-center">
                  <span className="mb-2 text-2xl opacity-30">🔒</span>
                  <p className="text-xs text-muted">No parts available</p>
                </div>
              )}
            </div>
          </Card>

          <CombinePreview part1={selectedPart1} part2={selectedPart2} slot={activeSlot} />

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Combine Cost</p>
                <p className={`font-mono text-lg font-bold ${cash >= combineCost ? 'text-warning' : 'text-danger'}`}>
                  ${combineCost}
                </p>
              </div>
              <Button
                variant="glow"
                onClick={handleCombine}
                disabled={!selectedPart1 || !selectedPart2 || cash < combineCost}
                className="min-w-[140px]"
              >
                ⚗️ Combine Parts
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card glow>
            <h3 className="mb-4 font-semibold">Crafted Parts ({craftedParts.length})</h3>
            {craftedParts.length === 0 ? (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-border/50 py-8 text-center">
                <span className="mb-2 text-2xl opacity-30">⚗️</span>
                <p className="text-xs text-muted">No crafted parts yet</p>
                <p className="mt-1 text-[10px] text-muted/60">Combine two parts to create one</p>
              </div>
            ) : (
              <div className="custom-scrollbar max-h-[600px] space-y-2 overflow-y-auto">
                {craftedParts.map((part) => {
                  const tier = TIER_META[part.tier] ?? TIER_META[1];
                  const slotMeta = SLOT_META[part.slot];
                  return (
                    <div
                      key={part.id}
                      className="rounded-xl border border-accent/20 bg-accent/5 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${slotMeta.gradient} text-sm`}>
                            {slotMeta.icon}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-fg">{part.name}</p>
                            <p className="text-[10px] text-muted">M{part.craftedMonth}</p>
                          </div>
                        </div>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${tier.color}`}>
                          T{part.tier}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(part.stats).map(([stat, val]) => (
                          <span key={stat} className="inline-flex items-center gap-0.5 rounded bg-surface-hover/80 px-1.5 py-0.5 text-[10px] text-muted">
                            <span className="capitalize">{stat}</span>
                            <span className="font-mono text-fg">+{val}</span>
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-mono text-xs text-success">${part.cost}</span>
                        <button
                          type="button"
                          onClick={() => deleteCraftedPart(part.id)}
                          className="text-[10px] text-danger/60 hover:text-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold">How Crafting Works</h3>
            <ul className="space-y-2 text-xs text-muted">
              <li className="flex items-start gap-2">
                <span className="text-accent">1.</span>
                Select two parts of the same type from the left
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">2.</span>
                Pay a combine cost (50% of combined value)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">3.</span>
                Get a new part with boosted stats (1.2x+ multiplier)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">4.</span>
                Higher tier parts → higher tier results (up to T5 Legendary)
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
