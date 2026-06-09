import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { CATEGORY_META } from '../data/components';

const TIER_COLORS = ['', 'bg-blue-500/20 text-blue-300', 'bg-purple-500/20 text-purple-300', 'bg-amber-500/20 text-amber-300'];

function ProgressRing({ progress }: { progress: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(progress, 100) / 100;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke="rgba(99,179,237,0.85)" strokeWidth="6"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
    </svg>
  );
}

export function FactoryTab() {
  const cash = useGameStore((s) => s.cash);
  const factories = useGameStore((s) => s.factories);
  const designs = useGameStore((s) => s.designs);
  const inventory = useGameStore((s) => s.inventory);
  const employees = useGameStore((s) => s.employees);
  const buyFactory = useGameStore((s) => s.buyFactory);
  const upgradeFactory = useGameStore((s) => s.upgradeFactory);
  const assignProduct = useGameStore((s) => s.assignProduct);
  const assignEmployeeToLine = useGameStore((s) => s.assignEmployeeToLine);
  const [expandedLine, setExpandedLine] = useState<string | null>(null);

  const newLineCost = 32000 + factories.length * 15000;
  const totalCapacity = factories.reduce((s, f) => s + f.capacity, 0);
  const activeLines = factories.filter((f) => f.assignedProductId).length;
  const mfgEmployees = employees.filter((e) => e.department === 'manufacturing');

  return (
    <div className="space-y-5 pb-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-900/30 to-surface-card p-3 text-center">
          <p className="text-[9px] uppercase tracking-widest text-blue-300/70">Lines</p>
          <p className="font-mono text-2xl font-bold text-blue-300">{factories.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/30 to-surface-card p-3 text-center">
          <p className="text-[9px] uppercase tracking-widest text-purple-300/70">Active</p>
          <p className="font-mono text-2xl font-bold text-purple-300">{activeLines}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-900/30 to-surface-card p-3 text-center">
          <p className="text-[9px] uppercase tracking-widest text-emerald-300/70">Capacity</p>
          <p className="font-mono text-2xl font-bold text-emerald-300">{totalCapacity}</p>
        </div>
      </div>

      {/* Buy New Line */}
      <button
        type="button"
        disabled={cash < newLineCost}
        onClick={() => buyFactory()}
        className="w-full rounded-2xl border border-dashed border-white/20 bg-surface-card/40 p-4 text-center transition hover:border-blue-400/50 hover:bg-blue-500/5 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="text-2xl">🏭</span>
        <p className="mt-1 text-sm font-semibold text-fg">+ New Production Line</p>
        <p className="text-xs text-muted">${newLineCost.toLocaleString()}</p>
      </button>

      {/* Factory Lines */}
      <div className="space-y-3">
        {factories.map((line) => {
          const assigned = designs.find((d) => d.id === line.assignedProductId);
          const units = inventory[line.assignedProductId ?? ''] ?? 0;
          const assignedEmployee = employees.find((e) => e.id === line.assignedEmployeeId);
          const upgradeCost = 18000 * line.level;
          const isExpanded = expandedLine === line.id;
          const tierColor = TIER_COLORS[Math.min(line.level, 3)];

          return (
            <div
              key={line.id}
              className="rounded-2xl border border-white/10 bg-surface-card/70 backdrop-blur-sm overflow-hidden"
            >
              {/* Line Header */}
              <button
                type="button"
                className="w-full p-4 text-left"
                onClick={() => setExpandedLine(isExpanded ? null : line.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Progress Ring */}
                  <div className="relative shrink-0">
                    <ProgressRing progress={line.progress} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-mono text-xs font-bold text-blue-300">
                        {Math.round(line.progress)}%
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-fg text-sm">{line.name}</p>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${tierColor}`}>
                        Lv {line.level}
                      </span>
                    </div>
                    {assigned ? (
                      <p className="text-xs text-muted mt-0.5">
                        <span className="text-blue-300">{assigned.name}</span>
                        {' · '}{units} units ready
                      </p>
                    ) : (
                      <p className="text-xs text-muted/60 mt-0.5 italic">Idle — assign a product</p>
                    )}
                    {assignedEmployee && (
                      <p className="text-[10px] text-emerald-400 mt-0.5">👤 {assignedEmployee.name}</p>
                    )}
                  </div>

                  {/* Capacity Badge */}
                  <div className="text-right shrink-0">
                    <p className="text-[9px] text-muted uppercase">Capacity</p>
                    <p className="font-mono text-sm font-bold text-fg">{line.capacity}/day</p>
                    <p className="text-[10px] text-muted">{isExpanded ? '▲' : '▼'}</p>
                  </div>
                </div>
              </button>

              {/* Expanded Panel */}
              {isExpanded && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  {/* Assign Product */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted mb-2">Assign Product</p>
                    {designs.length === 0 ? (
                      <p className="text-xs text-muted italic">No designs saved. Create one in Blueprints.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => assignProduct(line.id, null)}
                          className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                            !line.assignedProductId
                              ? 'border-white/30 bg-white/10 text-fg'
                              : 'border-white/10 text-muted hover:border-white/20'
                          }`}
                        >
                          None (Idle)
                        </button>
                        {designs.map((d) => {
                          const meta = CATEGORY_META[d.category];
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => assignProduct(line.id, d.id)}
                              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${
                                line.assignedProductId === d.id
                                  ? 'border-blue-400/50 bg-blue-500/15 text-blue-300'
                                  : 'border-white/10 text-muted hover:border-white/20 hover:text-fg'
                              }`}
                            >
                              {meta.icon} {d.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Assign Employee */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted mb-2">Assign Worker</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (assignedEmployee) assignEmployeeToLine(assignedEmployee.id, null);
                        }}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-muted hover:text-fg transition"
                      >
                        Unassign
                      </button>
                      {mfgEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => assignEmployeeToLine(emp.id, line.id)}
                          className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                            line.assignedEmployeeId === emp.id
                              ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300'
                              : 'border-white/10 text-muted hover:border-white/20 hover:text-fg'
                          }`}
                        >
                          👤 {emp.name} (Lv{emp.level})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upgrade */}
                  <div className="flex items-center justify-between rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-fg">Upgrade Line</p>
                      <p className="text-[10px] text-muted">→ Lv{line.level + 1} (+5 capacity)</p>
                    </div>
                    <button
                      type="button"
                      disabled={cash < upgradeCost}
                      onClick={() => upgradeFactory(line.id)}
                      className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ${upgradeCost.toLocaleString()}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inventory Summary */}
      {Object.keys(inventory).some((k) => (inventory[k] ?? 0) > 0) && (
        <div className="rounded-2xl border border-white/10 bg-surface-card/60 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted mb-3">📦 Inventory</p>
          <div className="space-y-2">
            {designs
              .filter((d) => (inventory[d.id] ?? 0) > 0)
              .map((d) => {
                const meta = CATEGORY_META[d.category];
                const qty = inventory[d.id] ?? 0;
                return (
                  <div key={d.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span>{meta.icon}</span>
                      <span className="text-xs text-fg">{d.name}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-300">{qty} units</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
