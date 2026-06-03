import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CATEGORY_META } from '../data/components';
import { useGameStore } from '../store/useGameStore';

export function Factory() {
  const factories = useGameStore((s) => s.factories);
  const designs = useGameStore((s) => s.designs);
  const inventory = useGameStore((s) => s.inventory);
  const cash = useGameStore((s) => s.cash);
  const employees = useGameStore((s) => s.employees);
  const assignProduct = useGameStore((s) => s.assignProduct);
  const upgradeFactory = useGameStore((s) => s.upgradeFactory);
  const buyFactory = useGameStore((s) => s.buyFactory);

  const newLineCost = 32000 + factories.length * 15000;
  const totalCapacity = factories.reduce((sum, f) => sum + f.capacity, 0);
  const assignedEmployees = factories.filter((f) => f.assignedEmployeeId).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Factory & Production</h1>
          <p className="text-muted">Assign designs to lines · advance days to manufacture</p>
        </div>
        <Button variant="secondary" disabled={cash < newLineCost} onClick={() => buyFactory()}>
          + New line (${newLineCost.toLocaleString()})
        </Button>
      </div>

      {/* Factory Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted">Production Lines</p>
          <p className="font-mono text-xl font-bold">{factories.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted">Total Capacity</p>
          <p className="font-mono text-xl font-bold">{totalCapacity}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted">Active Lines</p>
          <p className="font-mono text-xl font-bold text-success">{factories.filter((f) => f.assignedProductId).length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted">Workers Assigned</p>
          <p className="font-mono text-xl font-bold text-accent">{assignedEmployees}</p>
        </Card>
      </div>

      <div className="grid gap-4">
        {factories.map((f) => {
          const design = designs.find((d) => d.id === f.assignedProductId);
          const upgradeCost = 18000 * f.level;
          const assignedEmp = f.assignedEmployeeId ? employees.find((e) => e.id === f.assignedEmployeeId) : null;
          const efficiency = assignedEmp ? 100 + assignedEmp.skill * 0.5 : 100;
          const nextLevelCapacity = f.capacity + 5;

          return (
            <Card key={f.id}>
              <div className="mb-4 flex flex-wrap justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">🏭 {f.name}</h3>
                    <Badge tone="accent">Lv {f.level}</Badge>
                  </div>
                  <p className="text-sm text-muted">
                    {f.capacity} cap/day · {assignedEmp ? `Worker: ${assignedEmp.name}` : 'No worker'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {assignedEmp && (
                    <Badge tone="success">{Math.round(efficiency)}% efficiency</Badge>
                  )}
                  <Button variant="ghost" disabled={cash < upgradeCost} onClick={() => upgradeFactory(f.id)}>
                    Upgrade Lv{f.level + 1} (${upgradeCost.toLocaleString()})
                  </Button>
                </div>
              </div>

              <label className="block text-sm">
                <span className="text-muted">Assigned product</span>
                <select
                  value={f.assignedProductId ?? ''}
                  onChange={(e) => assignProduct(f.id, e.target.value || null)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 outline-none focus:border-accent"
                >
                  <option value="">— Idle —</option>
                  {designs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {CATEGORY_META[d.category].icon} {d.name}
                    </option>
                  ))}
                </select>
              </label>

              {design && (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>Production progress</span>
                    <span className="font-mono">{Math.min(100, Math.round(f.progress))}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${Math.min(100, f.progress)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-muted">Warehouse: <span className="font-mono text-fg">{inventory[design.id] ?? 0}</span> units</span>
                    <span className="text-muted">Next level: <span className="font-mono text-fg">{nextLevelCapacity}</span> cap</span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {designs.length === 0 && (
        <Card>
          <p className="text-center text-sm text-muted">Create a design first, then assign it here.</p>
        </Card>
      )}
    </div>
  );
}
