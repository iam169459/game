import { useCallback, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CATEGORY_META, SLOTS_BY_CATEGORY } from '../data/components';
import {
  batteryToHours,
  calcDesignStats,
  cameraToMP,
  getAvailableComponents,
  getComponent,
} from '../lib/gameLogic';
import { useGameStore } from '../store/useGameStore';
import type { ComponentDef, ComponentSlot, DeviceCategory, DeviceStats } from '../types';

const SLOT_META: Record<ComponentSlot, { label: string; icon: string; color: string; gradient: string }> = {
  screen:       { label: 'Screen',       icon: '🖥️', color: 'text-blue-400',   gradient: 'from-blue-500 to-cyan-500' },
  cpu:          { label: 'Processor',    icon: '⚡',  color: 'text-violet-400', gradient: 'from-violet-500 to-purple-500' },
  ram:          { label: 'RAM',          icon: '🧩', color: 'text-emerald-400',gradient: 'from-emerald-500 to-teal-500' },
  storage:      { label: 'Storage',      icon: '💾', color: 'text-amber-400',  gradient: 'from-amber-500 to-orange-500' },
  camera:       { label: 'Camera',       icon: '📷', color: 'text-pink-400',   gradient: 'from-pink-500 to-rose-500' },
  battery:      { label: 'Battery',      icon: '🔋', color: 'text-green-400',  gradient: 'from-green-500 to-lime-500' },
  chassis:      { label: 'Design',       icon: '📐', color: 'text-slate-300',  gradient: 'from-slate-400 to-zinc-400' },
  audio:        { label: 'Audio',        icon: '🎧', color: 'text-fuchsia-400',gradient: 'from-fuchsia-500 to-pink-500' },
  connectivity: { label: 'Connectivity', icon: '📡', color: 'text-sky-400',    gradient: 'from-sky-500 to-blue-500' },
};

const TIER_META: Record<number, { label: string; color: string; ring: string }> = {
  1: { label: 'Basic', color: 'bg-surface-hover text-muted', ring: 'ring-border' },
  2: { label: 'Mid-range', color: 'bg-blue-500/15 text-blue-400', ring: 'ring-blue-500/30' },
  3: { label: 'Premium', color: 'bg-purple-500/15 text-purple-400', ring: 'ring-purple-500/30' },
  4: { label: 'Flagship', color: 'bg-amber-500/15 text-amber-400', ring: 'ring-amber-500/30' },
};

function ComponentTierCard({
  component,
  isSelected,
  onDragStart,
  onClick,
}: {
  component: ComponentDef;
  isSelected: boolean;
  onDragStart: (e: React.DragEvent, comp: ComponentDef) => void;
  onClick: () => void;
}) {
  const tier = TIER_META[component.tier];
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, component)}
      onClick={onClick}
      className={`group relative cursor-grab rounded-xl border p-3 transition-all duration-200 active:cursor-grabbing ${
        isSelected
          ? `border-accent/50 bg-accent/10 ring-1 ${tier.ring} shadow-[0_0_20px_rgba(59,130,246,0.12)]`
          : 'border-border/50 bg-surface-raised/60 hover:border-border-bright hover:bg-surface-hover hover:shadow-lg'
      }`}
    >
      {isSelected && (
        <div className="absolute -top-px -left-px h-2 w-2 rounded-br-lg rounded-tl-lg bg-accent" />
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-fg">{component.name}</span>
          {'craftedFrom' in component && (
            <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-purple-400">
              Crafted
            </span>
          )}
        </div>
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${tier.color}`}>
          {tier.label}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {Object.entries(component.stats).map(([stat, val]) => (
          <span key={stat} className="inline-flex items-center gap-0.5 rounded bg-surface-hover/80 px-1.5 py-0.5 text-[10px] text-muted">
            <span className="capitalize">{stat}</span>
            <span className="font-mono text-fg">+{val}</span>
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-success">${component.cost}</span>
        <span className="text-[10px] text-muted/50 opacity-0 transition group-hover:opacity-100">Drag →</span>
      </div>
    </div>
  );
}

function PhoneMockup({
  category,
  placedComponents,
  onDrop,
  onClearSlot,
  deviceName,
  stats,
}: {
  category: DeviceCategory;
  placedComponents: Partial<Record<ComponentSlot, string>>;
  onDrop: (slot: ComponentSlot, componentId: string) => void;
  onClearSlot: (slot: ComponentSlot) => void;
  deviceName: string;
  stats: DeviceStats;
}) {
  const [dragOverSlot, setDragOverSlot] = useState<ComponentSlot | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent, slot: ComponentSlot) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slot);
  }, []);

  const handleDragLeave = useCallback(() => setDragOverSlot(null), []);

  const handleDrop = useCallback(
    (e: React.DragEvent, slot: ComponentSlot) => {
      e.preventDefault();
      const componentId = e.dataTransfer.getData('component-id');
      if (componentId) onDrop(slot, componentId);
      setDragOverSlot(null);
    },
    [onDrop],
  );

  const slots = SLOTS_BY_CATEGORY[category];
  const overallScore = Math.round(
    (stats.performance + stats.display + stats.camera + stats.battery + stats.build + stats.appeal) / 6,
  );

  return (
    <div className="relative mx-auto w-56 sm:w-64">
      {/* Phone Frame */}
      <div className="relative rounded-[2.8rem] border-[3px] border-border-bright/40 bg-gradient-to-b from-[#1a1f2e] via-[#0f1219] to-[#0a0d12] p-[10px] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.03)_inset]">
        {/* Screen Bezel */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-surface to-[#06080c]">
          {/* Notch */}
          <div className="relative z-10 flex items-center justify-center bg-black/40 py-1.5 backdrop-blur-sm">
            <div className="h-1 w-10 rounded-full bg-border-bright/50" />
            <div className="ml-2 h-1 w-1 rounded-full bg-border-bright/40" />
          </div>

          {/* Screen Content */}
          <div className="relative min-h-[28rem] px-3 pb-4 pt-2">
            {/* Status Bar */}
            <div className="mb-3 flex items-center justify-between px-1 text-[9px] text-muted/70">
              <span className="font-mono">9:41</span>
              <span className="font-semibold">Device Tycoon</span>
              <span>100%</span>
            </div>

            {/* Device Name */}
            <div className="mb-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted/50">Device</p>
              <p className="truncate text-lg font-bold text-fg drop-shadow-lg">{deviceName}</p>
              <div className="mx-auto mt-1 h-0.5 w-8 rounded-full bg-gradient-to-r from-accent to-glow" />
            </div>

            {/* Score Badge */}
            <div className="mx-auto mb-4 flex w-16 items-center justify-center">
              <div className="relative">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-surface-hover"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray={`${overallScore}, 100`}
                    className="text-accent transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-fg">{overallScore}</span>
                  <span className="text-[7px] text-muted/60">SCORE</span>
                </div>
              </div>
            </div>

            {/* Component Slots */}
            <div className="space-y-1.5">
              {slots.map((slot) => {
                const comp = placedComponents[slot] ? getComponent(placedComponents[slot]!) : null;
                const meta = SLOT_META[slot];
                const isOver = dragOverSlot === slot;
                return (
                  <div
                    key={slot}
                    onDragOver={(e) => handleDragOver(e, slot)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, slot)}
                    className={`group flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-all duration-200 ${
                      comp
                        ? 'border-accent/30 bg-accent/8 shadow-[0_0_12px_rgba(59,130,246,0.06)]'
                        : isOver
                          ? 'border-accent border-dashed bg-accent/15 scale-[1.02] shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                          : 'border-border/40 border-dashed hover:border-border-bright/60 hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${meta.gradient} text-sm shadow-md`}>
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-medium uppercase tracking-wider text-muted/60">{meta.label}</p>
                      {comp ? (
                        <p className="truncate text-xs font-medium text-fg">{comp.name}</p>
                      ) : (
                        <p className="text-[10px] text-muted/40">Drop component</p>
                      )}
                    </div>
                    {comp && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearSlot(slot);
                        }}
                        className="hidden h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/20 text-[9px] text-danger hover:bg-danger/30 group-hover:flex"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Home Indicator */}
            <div className="mt-4 flex justify-center">
              <div className="h-1 w-20 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Glow Effect */}
      <div className="pointer-events-none absolute -inset-4 rounded-[3rem] bg-gradient-to-b from-accent/5 via-transparent to-glow/5 blur-2xl" />
    </div>
  );
}

function AccordionCategory({
  slot,
  isOpen,
  onToggle,
  components,
  selectedId,
  onSelect,
  onDragStart,
}: {
  slot: ComponentSlot;
  isOpen: boolean;
  onToggle: () => void;
  components: ComponentDef[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onDragStart: (e: React.DragEvent, comp: ComponentDef) => void;
}) {
  const meta = SLOT_META[slot];
  const hasSelection = !!selectedId;

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-surface-raised/40">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-all ${
          isOpen
            ? 'bg-surface-hover/60 border-b border-border/40'
            : 'hover:bg-surface-hover/40'
        }`}
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${meta.gradient} text-lg shadow-lg`}>
          {meta.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">{meta.label}</p>
          <p className="text-[10px] text-muted/60">{components.length} options</p>
        </div>
        <div className="flex items-center gap-2">
          {hasSelection && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-[10px] text-accent-soft">✓</span>
          )}
          <span className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </div>
      </button>
      {isOpen && (
        <div className="space-y-2 p-3">
          {components.map((comp) => (
            <ComponentTierCard
              key={comp.id}
              component={comp}
              isSelected={selectedId === comp.id}
              onDragStart={onDragStart}
              onClick={() => onSelect(comp.id)}
            />
          ))}
          {components.length === 0 && (
            <div className="flex flex-col items-center rounded-lg border border-dashed border-border/50 py-6 text-center">
              <span className="mb-1 text-xl opacity-30">🔒</span>
              <p className="text-[11px] text-muted/60">Research to unlock</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Designer() {
  const draft = useGameStore((s) => s.draft);
  const unlockedTech = useGameStore((s) => s.unlockedTech);
  const craftedParts = useGameStore((s) => s.craftedParts);
  const setDraftCategory = useGameStore((s) => s.setDraftCategory);
  const setDraftName = useGameStore((s) => s.setDraftName);
  const setDraftComponent = useGameStore((s) => s.setDraftComponent);
  const setDraftSellPrice = useGameStore((s) => s.setDraftSellPrice);
  const resetDraft = useGameStore((s) => s.resetDraft);
  const saveDesign = useGameStore((s) => s.saveDesign);
  const releaseDevice = useGameStore((s) => s.releaseDevice);

  const [openCategory, setOpenCategory] = useState<ComponentSlot>('screen');
  const [isReleasing, setIsReleasing] = useState(false);

  const { stats, unitCost } = calcDesignStats(draft.category, draft.components);
  const margin = draft.sellPrice - unitCost;

  const componentsBySlot = useMemo(() => {
    const map: Record<ComponentSlot, ComponentDef[]> = {} as Record<ComponentSlot, ComponentDef[]>;
    for (const slot of SLOTS_BY_CATEGORY[draft.category]) {
      map[slot] = getAvailableComponents(slot, draft.category, unlockedTech, craftedParts);
    }
    return map;
  }, [draft.category, unlockedTech, craftedParts]);

  const totalSlots = SLOTS_BY_CATEGORY[draft.category].length;
  const filledSlots = SLOTS_BY_CATEGORY[draft.category].filter((s) => draft.components[s]).length;

  const handleDragStart = useCallback((e: React.DragEvent, comp: ComponentDef) => {
    e.dataTransfer.setData('component-id', comp.id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDrop = useCallback(
    (slot: ComponentSlot, componentId: string) => {
      const comp = getComponent(componentId);
      if (comp && comp.slot === slot) {
        setDraftComponent(slot, componentId);
        setOpenCategory(slot);
      }
    },
    [setDraftComponent],
  );

  const handleClearSlot = useCallback(
    (slot: ComponentSlot) => {
      const first = getAvailableComponents(slot, draft.category, unlockedTech, craftedParts)[0];
      if (first) setDraftComponent(slot, first.id);
    },
    [draft.category, unlockedTech, craftedParts, setDraftComponent],
  );

  const handleRelease = useCallback(() => {
    if (filledSlots < totalSlots) return;
    setIsReleasing(true);
    setTimeout(() => {
      releaseDevice();
      setIsReleasing(false);
    }, 800);
  }, [filledSlots, totalSlots, releaseDevice]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex min-h-0 flex-1 gap-4">
      {/* ── Left Sidebar: Components ── */}
      <aside className="flex w-[300px] shrink-0 flex-col gap-3">
        {/* Category Tabs */}
        <div className="flex gap-1 rounded-xl bg-surface-raised/60 p-1">
          {(Object.keys(CATEGORY_META) as DeviceCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setDraftCategory(cat)}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                draft.category === cat
                  ? 'bg-accent/20 text-accent-soft shadow-sm'
                  : 'text-muted hover:text-fg'
              }`}
            >
              {CATEGORY_META[cat].icon}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
          {SLOTS_BY_CATEGORY[draft.category].map((slot) => (
            <AccordionCategory
              key={slot}
              slot={slot}
              isOpen={openCategory === slot}
              onToggle={() => setOpenCategory(openCategory === slot ? '' as ComponentSlot : slot)}
              components={componentsBySlot[slot]}
              selectedId={draft.components[slot]}
              onSelect={(id) => setDraftComponent(slot, id)}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      </aside>

      {/* ── Center: Device Preview ── */}
      <main className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Device Designer</h2>
          <Button
            variant="secondary"
            onClick={() => {
              resetDraft();
              setOpenCategory('screen');
            }}
          >
            + New Device
          </Button>
        </div>
        <Card className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4">
            {/* Editable Name */}
            <div className="text-center">
              <input
                value={draft.name}
                onChange={(e) => setDraftName(e.target.value)}
                className="bg-transparent text-center text-3xl font-bold tracking-tight text-fg outline-none placeholder:text-muted/30 focus:text-accent-soft"
                placeholder="Device Name"
              />
              <p className="mt-1 text-xs text-muted">{CATEGORY_META[draft.category].label} · {filledSlots}/{totalSlots} slots filled</p>
              {filledSlots < totalSlots && (
                <p className="mt-1 text-[10px] text-warning">
                  Missing: {SLOTS_BY_CATEGORY[draft.category]
                    .filter((s) => !draft.components[s])
                    .map((s) => SLOT_META[s].label)
                    .join(', ')}
                </p>
              )}
            </div>

            {/* Phone Mockup */}
            <PhoneMockup
              category={draft.category}
              placedComponents={draft.components}
              onDrop={handleDrop}
              onClearSlot={handleClearSlot}
              deviceName={draft.name}
              stats={stats}
            />
          </div>
        </Card>
      </main>

      {/* ── Right Sidebar: Stats ── */}
      <aside className="custom-scrollbar flex w-[320px] shrink-0 flex-col gap-3 overflow-y-auto">
        {/* Performance Scores */}
        <Card glow>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Performance Scores</h3>
          <div className="space-y-3">
            {[
              { label: 'Performance', value: stats.performance, max: 100, icon: '⚡', color: 'bg-accent', display: `${stats.performance}/100` },
              { label: 'Battery Life', value: stats.battery, max: 100, icon: '🔋', color: 'bg-success', display: `${batteryToHours(stats.battery)} hours` },
              { label: 'Camera', value: stats.camera, max: 100, icon: '📷', color: 'bg-pink-400', display: `${cameraToMP(stats.camera)} MP` },
              { label: 'Design Appeal', value: stats.build, max: 100, icon: '🎨', color: 'bg-glow', display: `${stats.build}/100` },
              { label: 'Market Appeal', value: stats.appeal, max: 100, icon: '❤️', color: 'bg-cyan-400', display: `${stats.appeal}/100` },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-muted">
                    <span>{stat.icon}</span> {stat.label}
                  </span>
                  <span className="font-mono text-sm font-bold text-fg">{stat.display}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${stat.color}`}
                    style={{ width: `${stat.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Financial Breakdown */}
        <Card>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Financial Breakdown</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-surface-raised/80 px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted/60">Cost to Produce</p>
                <p className="font-mono text-lg font-bold text-warning">${unitCost.toFixed(2)}</p>
              </div>
              <span className="text-xl opacity-40">🏭</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-raised/80 px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted/60">Suggested Price</p>
                <p className="font-mono text-lg font-bold text-accent-soft">${draft.sellPrice.toFixed(2)}</p>
              </div>
              <span className="text-xl opacity-40">🏷️</span>
            </div>
            <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${
              margin >= 0 ? 'bg-success/10' : 'bg-danger/10'
            }`}>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted/60">Expected Profit</p>
                <p className={`font-mono text-lg font-bold ${margin >= 0 ? 'text-success' : 'text-danger'}`}>
                  ${margin.toFixed(2)}
                </p>
              </div>
              <span className="text-xl opacity-40">💰</span>
            </div>
          </div>
        </Card>

        {/* Overall Rating */}
        <Card className="flex-1">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Overall Rating</h3>
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-surface-hover"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${stats.appeal}, 100`}
                  className="text-accent transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-fg">{stats.appeal}</span>
                <span className="text-[9px] text-muted/60">/100</span>
              </div>
            </div>
            <p className="text-center text-sm font-semibold text-fg">
              {stats.appeal >= 80 ? '🔥 Flagship Killer' : stats.appeal >= 60 ? '⭐ Strong Contender' : stats.appeal >= 40 ? '👍 Solid Device' : '📦 Budget Option'}
            </p>
            <p className="mt-1 text-center text-[11px] text-muted/60">
              {stats.appeal >= 80
                ? 'Ready to dominate the market'
                : stats.appeal >= 60
                  ? 'Competitive with top sellers'
                  : stats.appeal >= 40
                    ? 'Good value proposition'
                    : 'Entry-level pricing expected'}
            </p>
          </div>
        </Card>
      </aside>
    </div>

    {/* ── Action Bar (full-width footer) ── */}
    <Card className="mt-3 shrink-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Cost</p>
            <p className="font-mono text-xl font-bold text-warning">${unitCost.toFixed(0)}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Price</p>
            <p className="font-mono text-xl font-bold text-accent-soft">${draft.sellPrice.toFixed(0)}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Profit</p>
            <p className={`font-mono text-xl font-bold ${margin >= 0 ? 'text-success' : 'text-danger'}`}>
              ${margin.toFixed(0)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            Set Price
            <input
              type="number"
              min={unitCost}
              step={5}
              value={draft.sellPrice}
              onChange={(e) => setDraftSellPrice(Number(e.target.value))}
              className="w-20 rounded-lg border border-border bg-surface-raised px-2 py-1.5 font-mono text-sm text-fg outline-none focus:border-accent"
            />
          </label>
          <Button
            variant="secondary"
            onClick={() => saveDesign()}
            className="min-w-[120px] text-sm"
          >
            💾 Save Draft
          </Button>
          <Button
            variant="glow"
            onClick={handleRelease}
            disabled={filledSlots < totalSlots || isReleasing}
            className="min-w-[160px] text-sm"
          >
            {isReleasing ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Releasing...
              </span>
            ) : (
              <>🚀 Release</>
            )}
          </Button>
        </div>
      </div>
    </Card>
    </div>
  );
}
