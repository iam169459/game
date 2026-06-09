import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { AchievementCategory } from '../types';

const CATEGORY_META: Record<AchievementCategory, { label: string; color: string; bg: string }> = {
  sales:    { label: 'Sales',    color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  devices:  { label: 'Devices', color: 'text-blue-300',    bg: 'bg-blue-500/10 border-blue-500/20' },
  finance:  { label: 'Finance', color: 'text-amber-300',   bg: 'bg-amber-500/10 border-amber-500/20' },
  research: { label: 'Research',color: 'text-purple-300',  bg: 'bg-purple-500/10 border-purple-500/20' },
  empire:   { label: 'Empire',  color: 'text-red-300',     bg: 'bg-red-500/10 border-red-500/20' },
  social:   { label: 'Social',  color: 'text-pink-300',    bg: 'bg-pink-500/10 border-pink-500/20' },
};

export function AchievementsTab() {
  const achievements = useGameStore((s) => s.achievements);
  const [filter, setFilter] = useState<AchievementCategory | 'all'>('all');

  const unlocked = achievements.filter((a) => a.unlockedMonth !== null);
  const filtered = filter === 'all'
    ? achievements
    : achievements.filter((a) => a.category === filter);

  const filteredUnlocked = filtered.filter((a) => a.unlockedMonth !== null);
  const filteredLocked = filtered.filter((a) => a.unlockedMonth === null);

  const totalReward = unlocked.reduce((s, a) => s + a.reward, 0);

  const categories: AchievementCategory[] = ['sales', 'devices', 'finance', 'research', 'empire'];

  return (
    <div className="space-y-5 pb-6">
      {/* Summary */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-900/20 to-surface-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-2xl">🏆</div>
          <div>
            <p className="font-bold text-fg text-lg">{unlocked.length} / {achievements.length} Unlocked</p>
            <p className="text-xs text-muted">Total rewards earned: <span className="font-mono text-amber-300">${totalReward.toLocaleString()}</span></p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
            style={{ width: `${Math.round((unlocked.length / achievements.length) * 100)}%` }}
          />
        </div>
        <p className="mt-1 text-right text-[10px] text-muted">
          {Math.round((unlocked.length / achievements.length) * 100)}% complete
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition ${
            filter === 'all' ? 'bg-accent/20 text-accent-soft ring-1 ring-accent/30' : 'bg-surface-card/60 text-muted hover:text-fg'
          }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat];
          const count = achievements.filter((a) => a.category === cat && a.unlockedMonth !== null).length;
          const total = achievements.filter((a) => a.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition ${
                filter === cat
                  ? `${meta.bg} ${meta.color} ring-1 ring-current/30`
                  : 'bg-surface-card/60 text-muted hover:text-fg'
              }`}
            >
              {meta.label} {count}/{total}
            </button>
          );
        })}
      </div>

      {/* Unlocked Achievements */}
      {filteredUnlocked.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted mb-3">✅ Unlocked ({filteredUnlocked.length})</p>
          <div className="grid grid-cols-1 gap-2">
            {filteredUnlocked.map((ach) => {
              const meta = CATEGORY_META[ach.category];
              return (
                <div
                  key={ach.id}
                  className={`flex items-center gap-3 rounded-2xl border p-4 ${meta.bg}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                    {ach.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${meta.color}`}>{ach.name}</p>
                    <p className="text-[10px] text-muted">{ach.description}</p>
                    <p className="text-[10px] text-muted">Month {ach.unlockedMonth}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-xs font-bold text-amber-300">+${ach.reward.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {filteredLocked.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted mb-3">🔒 Locked ({filteredLocked.length})</p>
          <div className="grid grid-cols-1 gap-2">
            {filteredLocked.map((ach) => (
              <div
                key={ach.id}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-surface-card/40 p-4 opacity-60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl grayscale">
                  {ach.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-muted">{ach.name}</p>
                  <p className="text-[10px] text-muted/60">{ach.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs text-muted">+${ach.reward.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="mb-4 text-5xl opacity-30">🏅</span>
          <p className="text-muted">No achievements in this category yet</p>
        </div>
      )}
    </div>
  );
}
