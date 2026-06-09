import { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { TECH_TREE } from '../data/techTree';
import { useGameStore } from '../store/useGameStore';

type TechCategory = 'all' | 'hardware' | 'software' | 'manufacturing' | 'marketing' | 'research';

const CATEGORY_LABELS: Record<TechCategory, { label: string; icon: string; color: string }> = {
  all:           { label: 'All Tech',       icon: '🌐', color: 'from-blue-500 to-indigo-500' },
  hardware:      { label: 'Hardware',       icon: '⚡', color: 'from-violet-500 to-purple-500' },
  software:      { label: 'Software',       icon: '💿', color: 'from-emerald-500 to-teal-500' },
  manufacturing: { label: 'Manufacturing',  icon: '🏭', color: 'from-amber-500 to-orange-500' },
  marketing:     { label: 'Marketing',      icon: '📣', color: 'from-pink-500 to-rose-500' },
  research:      { label: 'Research Lab',   icon: '🔬', color: 'from-sky-500 to-blue-500' },
};

export function Research() {
  const cash = useGameStore((s) => s.cash);
  const unlockedTech = useGameStore((s) => s.unlockedTech);
  const researching = useGameStore((s) => s.researching);
  const startResearch = useGameStore((s) => s.startResearch);

  const [activeCategory, setActiveCategory] = useState<TechCategory>('all');

  const canStart = (id: string) => {
    const tech = TECH_TREE.find((t) => t.id === id);
    if (!tech || unlockedTech.includes(id) || researching) return false;
    return tech.prerequisites.every((p) => unlockedTech.includes(p)) && cash >= tech.cost;
  };

  const filteredTech = useMemo(() => {
    if (activeCategory === 'all') return TECH_TREE;
    return TECH_TREE.filter((t) => t.category === activeCategory);
  }, [activeCategory]);

  const progressCount = useMemo(() => {
    return TECH_TREE.filter((t) => unlockedTech.includes(t.id)).length;
  }, [unlockedTech]);

  const progressPercent = Math.round((progressCount / TECH_TREE.length) * 100);

  const activeTechDetails = researching
    ? TECH_TREE.find((t) => t.id === researching.techId)
    : null;

  return (
    <div className="space-y-6">
      {/* Header and Progress Tracker */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Research & Development</h1>
          <p className="text-xs text-muted">Unlock next-generation parts and corporate bonuses</p>
        </div>

        <div className="w-full sm:w-64 rounded-xl border border-border/60 bg-surface-card/60 p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-muted">R&D Completion</span>
            <span className="font-mono text-accent-soft font-bold">{progressCount} / {TECH_TREE.length} ({progressPercent}%)</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-glow transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Active Research Banner */}
      {researching && activeTechDetails && (
        <Card className="relative overflow-hidden border-warning/30 bg-warning/5" glow>
          {/* Neon side strip */}
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-warning" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pl-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-warning font-semibold">Active Research Project</p>
              <h3 className="text-base font-bold text-fg mt-0.5">🔬 {activeTechDetails.name}</h3>
              <p className="text-xs text-muted mt-1">{activeTechDetails.description}</p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
              <span className="font-mono text-sm font-bold text-warning">{researching.daysLeft} days remaining</span>
              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-surface-hover">
                <div
                  className="h-full rounded-full bg-warning transition-all"
                  style={{
                    width: `${Math.max(8, (1 - researching.daysLeft / activeTechDetails.researchDays) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Category Tabs */}
      <div className="flex gap-1.5 rounded-xl bg-surface-raised/60 p-1 overflow-x-auto scrollbar-none">
        {(Object.keys(CATEGORY_LABELS) as TechCategory[]).map((cat) => {
          const catMeta = CATEGORY_LABELS[cat];
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold shrink-0 transition-all ${
                active
                  ? 'bg-accent/10 border border-accent/25 text-accent-soft'
                  : 'border border-transparent text-muted hover:text-fg hover:bg-surface-hover/30'
              }`}
            >
              <span>{catMeta.icon}</span>
              <span>{catMeta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tech Tree Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTech.map((tech) => {
          const unlocked = unlockedTech.includes(tech.id);
          const active = researching?.techId === tech.id;
          const needsList = tech.prerequisites.map((p) => TECH_TREE.find((t) => t.id === p));
          const hasPrereqs = tech.prerequisites.every((p) => unlockedTech.includes(p));
          const hasCash = cash >= tech.cost;
          const isCategoryMeta = CATEGORY_LABELS[tech.category] || CATEGORY_LABELS.all;

          return (
            <Card
              key={tech.id}
              className={`relative flex flex-col justify-between transition-all border duration-300 ${
                unlocked
                  ? 'border-success/30 bg-success/3'
                  : active
                  ? 'border-warning/40 bg-warning/3'
                  : !hasPrereqs
                  ? 'border-border/40 opacity-60 bg-black/20'
                  : 'border-border/50 bg-surface-card/60 hover:border-border-bright hover:bg-surface-hover'
              }`}
              glow={active}
            >
              <div>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-fg text-sm">{tech.name}</h3>
                    <p className="text-[9px] uppercase tracking-wider text-muted font-semibold mt-0.5">
                      {isCategoryMeta.icon} {isCategoryMeta.label}
                    </p>
                  </div>
                  {unlocked ? (
                    <Badge tone="success">Research Completed</Badge>
                  ) : active ? (
                    <Badge tone="warning">In Progress</Badge>
                  ) : !hasPrereqs ? (
                    <Badge tone="neutral">🔒 Locked</Badge>
                  ) : (
                    <Badge tone="accent">Available</Badge>
                  )}
                </div>

                <p className="text-xs text-muted leading-relaxed mt-2">{tech.description}</p>

                {/* Prerequisites list */}
                {needsList.length > 0 && (
                  <div className="mt-3 text-[10px] text-muted">
                    <span className="font-semibold text-fg/75">Prerequisites:</span>{' '}
                    {needsList.map((p, idx) => (
                      <span
                        key={p?.id}
                        className={
                          p && unlockedTech.includes(p.id) ? 'text-success font-medium' : 'text-danger font-medium'
                        }
                      >
                        {p?.name}
                        {idx < needsList.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Research Action Button / Info */}
              <div className="mt-4 border-t border-border/30 pt-3">
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] text-muted">
                  <span>Funding: <span className="font-bold text-fg">${tech.cost.toLocaleString()}</span></span>
                  <span>Duration: <span className="font-bold text-fg">{tech.researchDays} days</span></span>
                </div>

                {!unlocked && !active && (
                  <Button
                    className="w-full py-2.5 text-xs"
                    variant={hasPrereqs && hasCash ? 'primary' : 'secondary'}
                    disabled={!canStart(tech.id)}
                    onClick={() => startResearch(tech.id)}
                  >
                    {!hasPrereqs
                      ? 'Unlock Prerequisites'
                      : !hasCash
                      ? 'Insufficient Cash'
                      : '🔬 Initiate Project'}
                  </Button>
                )}

                {active && (
                  <div className="w-full text-center py-2 text-xs font-semibold text-warning animate-pulse">
                    🔬 Researching...
                  </div>
                )}

                {unlocked && (
                  <div className="w-full text-center py-2 text-xs font-semibold text-success flex items-center justify-center gap-1.5">
                    ✓ Tech Unlocked
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
