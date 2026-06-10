import { useGameStore } from '../store/useGameStore';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { CATEGORY_META } from '../data/components';

export function DeviceReviewModal() {
  const activeReview = useGameStore((s) => s.activeDeviceReview);
  const closeReview = useGameStore((s) => s.closeDeviceReview);
  const setScreen = useGameStore((s) => s.setScreen);

  if (!activeReview) return null;

  const handleClose = () => {
    closeReview();
    setScreen('devices');
  };

  const score = activeReview.score;
  const categoryMeta = CATEGORY_META[activeReview.category];

  // Reviewer outlet names to simulate a real press pool
  const reviewPool = [
    { outlet: 'VergeTech', icon: '⚡' },
    { outlet: 'GizmoHub', icon: '🔌' },
    { outlet: 'CNET Reviews', icon: '🔎' },
  ];

  // Tone definitions
  const getRating = (s: number) => {
    if (s >= 90) return { label: 'Masterpiece 🏆', color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/10' };
    if (s >= 80) return { label: 'Excellent 👍', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' };
    if (s >= 65) return { label: 'Good 📈', color: 'text-blue-400', border: 'border-blue-500/40', bg: 'bg-blue-500/10' };
    if (s >= 50) return { label: 'Mediocre ⚖️', color: 'text-warning', border: 'border-warning/40', bg: 'bg-warning/10' };
    return { label: 'Subpar ⚠️', color: 'text-danger', border: 'border-danger/40', bg: 'bg-danger/10' };
  };

  const rating = getRating(score);

  // Sales impact text
  const mult = 0.3 + score / 100;
  const impactPercent = Math.round((mult - 1) * 100);
  const salesImpactText =
    impactPercent > 0
      ? `+${impactPercent}% demand boost due to positive critic reviews!`
      : impactPercent < 0
      ? `${Math.abs(impactPercent)}% demand penalty from weak critic reviews.`
      : `No significant sales impact.`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface/85 p-4 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <Card
        className="relative w-full max-w-lg border border-border-bright/50 bg-surface-card/95 p-6 shadow-2xl shadow-black/80 sm:p-8 animate-fade-up"
        glow
        shine
      >
        {/* Glowing atmospheric light behind score */}
        <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 -bottom-12 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />

        {/* Header */}
        <div className="relative mb-6 text-center">
          <Badge tone="accent">Press Review Release</Badge>
          <h2 className="text-2xl font-bold tracking-tight text-fg mt-2 truncate">
            {activeReview.name}
          </h2>
          <p className="text-xs text-muted mt-1 uppercase tracking-widest">
            {categoryMeta.icon} {categoryMeta.label}
          </p>
        </div>

        {/* Critic Score Circle / Badge */}
        <div className="relative flex flex-col items-center justify-center py-4">
          <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-dashed border-border bg-black/40 text-center shadow-inner relative">
            <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Critic Score</span>
            <span className={`text-4xl font-black font-mono leading-none ${rating.color}`}>
              {score}
            </span>
            <span className="text-[10px] text-muted font-mono mt-0.5">/ 100</span>
          </div>

          <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold ${rating.bg} ${rating.color} ${rating.border}`}>
            {rating.label}
          </div>
        </div>

        {/* Reviews Feed */}
        <div className="mt-6 space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted">
            Press Feedbacks
          </h3>
          <div className="space-y-2.5">
            {activeReview.feedbacks.map((text, idx) => {
              const reviewer = reviewPool[idx % reviewPool.length];
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border/40 bg-surface-raised/50 p-3 flex gap-3 items-start"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/30 text-lg border border-border/40">
                    {reviewer.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-accent-soft">{reviewer.outlet}</p>
                    <p className="text-xs text-fg/80 leading-normal mt-0.5">"{text}"</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales Impact Box */}
        <div className="mt-6 border-t border-border/60 pt-4">
          <div className={`rounded-xl border border-dashed p-3 text-center text-xs font-semibold ${
            impactPercent > 0 ? 'bg-success/5 border-success/30 text-emerald-400' : impactPercent < 0 ? 'bg-danger/5 border-danger/30 text-red-400' : 'bg-surface-raised border-border text-muted'
          }`}>
            📈 {salesImpactText}
          </div>
        </div>

        {/* Action */}
        <div className="mt-6 flex justify-center">
          <Button variant="glow" className="w-full py-3 text-sm" onClick={handleClose}>
            Start Product Sales
          </Button>
        </div>
      </Card>
    </div>
  );
}
