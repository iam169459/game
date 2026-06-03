import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { TECH_TREE } from '../data/techTree';
import { useGameStore } from '../store/useGameStore';

export function Research() {
  const cash = useGameStore((s) => s.cash);
  const unlockedTech = useGameStore((s) => s.unlockedTech);
  const researching = useGameStore((s) => s.researching);
  const startResearch = useGameStore((s) => s.startResearch);

  const canStart = (id: string) => {
    const tech = TECH_TREE.find((t) => t.id === id);
    if (!tech || unlockedTech.includes(id) || researching) return false;
    return tech.prerequisites.every((p) => unlockedTech.includes(p)) && cash >= tech.cost;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">R&D · Tech Tree</h1>
        <p className="text-muted">Unlock components and operational bonuses</p>
      </div>

      {researching && (
        <Card glow>
          <p className="font-semibold">
            🔬 {TECH_TREE.find((t) => t.id === researching.techId)?.name}
          </p>
          <p className="text-sm text-muted">{researching.daysLeft} days remaining</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full bg-glow transition-all"
              style={{
                width: `${Math.max(8, (1 - researching.daysLeft / (TECH_TREE.find((t) => t.id === researching.techId)?.researchDays ?? 1)) * 100)}%`,
              }}
            />
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TECH_TREE.map((tech) => {
          const unlocked = unlockedTech.includes(tech.id);
          return (
            <Card key={tech.id} className={unlocked ? 'border-success/30' : ''}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-semibold">{tech.name}</h3>
                {unlocked && <Badge tone="success">Unlocked</Badge>}
              </div>
              <p className="mb-3 text-sm text-muted">{tech.description}</p>
              <p className="mb-3 text-xs text-muted">
                ${tech.cost.toLocaleString()} · {tech.researchDays} days
              </p>
              {tech.prerequisites.length > 0 && (
                <p className="mb-3 text-xs text-muted">
                  Needs: {tech.prerequisites.map((p) => TECH_TREE.find((t) => t.id === p)?.name).join(', ')}
                </p>
              )}
              {!unlocked && (
                <Button className="w-full" variant="secondary" disabled={!canStart(tech.id)} onClick={() => startResearch(tech.id)}>
                  Research
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
