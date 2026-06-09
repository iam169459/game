import { useGameStore } from '../store/useGameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export function BankruptcyScreen() {
  const companyName = useGameStore((s) => s.companyName);
  const cash = useGameStore((s) => s.cash);
  const companyValuation = useGameStore((s) => s.companyValuation);
  const day = useGameStore((s) => s.day);
  const month = useGameStore((s) => s.month);
  const totalUnitsSold = useGameStore((s) => s.totalUnitsSold);
  const releasedDevices = useGameStore((s) => s.releasedDevices);
  const resetGame = useGameStore((s) => s.resetGame);

  const formatCash = (n: number) => {
    const isNeg = n < 0;
    const abs = Math.abs(n);
    const formatted = abs >= 1000000 ? `${(abs / 1000000).toFixed(1)}M`
      : abs >= 1000 ? `${(abs / 1000).toFixed(1)}K`
      : `${abs}`;
    return `${isNeg ? '-' : ''}$${formatted}`;
  };

  const bestSeller = releasedDevices.length > 0
    ? releasedDevices.reduce((max, d) => d.totalSold > max.totalSold ? d : max, releasedDevices[0])
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <Card className="w-full max-w-lg border-red-500/30 bg-surface-card/90 p-6 shadow-2xl text-center relative overflow-hidden" glow>
        {/* Red warning light background indicator */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/20 rounded-full blur-3xl" />

        {/* Warning Icon */}
        <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-500/30 bg-red-500/10 text-4xl text-red-500 shadow-lg shadow-red-500/20 animate-pulse">
          🚨
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-red-500 uppercase">
          Bankruptcy Declared
        </h1>
        <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
          {companyName} has run out of operating capital. Corporate debt has exceeded the safe threshold of <span className="font-semibold text-red-400">-$10,000,000</span>.
        </p>

        {/* Financial alert banner */}
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 py-3 px-4 text-sm font-semibold text-red-400 font-mono">
          Final Cash Balance: {formatCash(cash)}
        </div>

        {/* Statistics Grid */}
        <div className="mt-6 space-y-4 text-left">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted border-b border-white/5 pb-1.5">
            Company Legacy Report
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/5 bg-black/40 p-3">
              <p className="text-[10px] text-muted uppercase">Duration Survived</p>
              <p className="font-mono text-sm font-bold text-fg mt-0.5">
                Year {Math.floor((month - 1) / 12) + 1} (Month {month}, Day {day})
              </p>
            </div>
            
            <div className="rounded-xl border border-white/5 bg-black/40 p-3">
              <p className="text-[10px] text-muted uppercase">Peak Valuation</p>
              <p className="font-mono text-sm font-bold text-emerald-400 mt-0.5">
                {formatCash(companyValuation)}
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/40 p-3">
              <p className="text-[10px] text-muted uppercase">Total Units Sold</p>
              <p className="font-mono text-sm font-bold text-fg mt-0.5">
                {totalUnitsSold.toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/40 p-3">
              <p className="text-[10px] text-muted uppercase">Devices Released</p>
              <p className="font-mono text-sm font-bold text-fg mt-0.5">
                {releasedDevices.length}
              </p>
            </div>
          </div>

          {bestSeller && (
            <div className="rounded-xl border border-white/5 bg-black/40 p-3">
              <p className="text-[10px] text-muted uppercase">Top Product line</p>
              <div className="mt-1 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-fg">{bestSeller.name}</p>
                  <p className="text-[9px] text-muted capitalize">{bestSeller.category}</p>
                </div>
                <p className="font-mono text-xs font-bold text-accent-soft">
                  {bestSeller.totalSold.toLocaleString()} units
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-8">
          <Button
            variant="glow"
            className="w-full py-3 text-base bg-red-600/25 border-red-500/40 text-red-300 hover:bg-red-600/35 hover:text-red-200 shadow-lg shadow-red-600/10"
            onClick={() => resetGame()}
          >
            Restart & Liquidate Company
          </Button>
        </div>
      </Card>
    </div>
  );
}
