import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useGameStore } from '../store/useGameStore';
import { TECH_TREE } from '../data/techTree';

const FLOATING_DEVICES = [
  { icon: '📱', className: 'left-[8%] top-[18%] animate-float', delay: '0s' },
  { icon: '💻', className: 'right-[10%] top-[22%] animate-float', delay: '1s' },
  { icon: '⌚', className: 'left-[15%] bottom-[28%] animate-float', delay: '2s' },
  { icon: '🎧', className: 'right-[18%] bottom-[24%] animate-float text-3xl opacity-40', delay: '0.5s' },
];

const RANKS = [
  { min: 0,         label: 'Garage Starter',   icon: '🔧' },
  { min: 50000,     label: 'Indie Maker',       icon: '🛠️' },
  { min: 150000,    label: 'Startup Pro',       icon: '🚀' },
  { min: 500000,    label: 'Tech Contender',    icon: '⚡' },
  { min: 1500000,   label: 'Market Disruptor',  icon: '💎' },
  { min: 5000000,   label: 'Industry Titan',    icon: '👑' },
  { min: 20000000,  label: 'Global Tech Giant', icon: '🌍' },
];

function getRank(valuation: number) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (valuation >= r.min) rank = r;
  }
  return rank;
}

export function MainMenu() {
  const [name, setName] = useState('Garage Labs');
  const startGame = useGameStore((s) => s.startGame);
  const continueGame = useGameStore((s) => s.continueGame);
  const gameStarted = useGameStore((s) => s.gameStarted);
  const companyName = useGameStore((s) => s.companyName);

  // Stats to display
  const companyValuation = useGameStore((s) => s.companyValuation);
  const cash = useGameStore((s) => s.cash);
  const releasedDevices = useGameStore((s) => s.releasedDevices);
  const totalUnitsSold = useGameStore((s) => s.totalUnitsSold);
  const achievements = useGameStore((s) => s.achievements);
  const unlockedTech = useGameStore((s) => s.unlockedTech);

  const rank = getRank(companyValuation);
  const rankIndex = RANKS.indexOf(rank) + 1;
  const unlockedAchievementsCount = achievements.filter((a) => a.unlockedMonth !== null).length;

  const formatCash = (n: number) =>
    n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M`
    : n >= 1000 ? `$${(n / 1000).toFixed(1)}K`
    : `$${n}`;

  const bestSeller = releasedDevices.length > 0
    ? releasedDevices.reduce((max, d) => d.totalSold > max.totalSold ? d : max, releasedDevices[0])
    : null;

  return (
    <div className="bg-mesh relative flex min-h-screen flex-col overflow-hidden">
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />

      {FLOATING_DEVICES.map((d) => (
        <span
          key={d.icon + d.className}
          className={`pointer-events-none absolute text-5xl opacity-20 sm:text-6xl sm:opacity-30 ${d.className}`}
          style={{ animationDelay: d.delay }}
        >
          {d.icon}
        </span>
      ))}

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 w-full max-w-5xl mx-auto">
        <div className="animate-fade-up mb-10 text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow" />
            Tech tycoon simulator
          </p>
          <h1 className="text-gradient text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Devices Tycoon
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-muted sm:text-lg">
            Design flagship tech. Run your garage empire. Out-innovate the giants.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full items-stretch justify-center max-w-4xl">
          {/* Launch / Continue Card */}
          <Card className="animate-fade-up stagger-2 w-full md:w-[420px] opacity-0 flex flex-col justify-between" glow shine>
            <div>
              <div className="mb-6 flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-glow text-xl shadow-lg shadow-accent/30">
                  🏢
                </div>
                <div>
                  <h2 className="text-lg font-bold">Launch Studio</h2>
                  <p className="text-xs text-muted">$50,000 seed · Garage HQ · Tier-1 parts</p>
                </div>
              </div>

              <label className="mb-5 block text-sm">
                <span className="font-medium text-muted">Company name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={28}
                  placeholder="Garage Labs"
                  className="mt-2 w-full rounded-xl border border-border bg-black/40 px-4 py-3 text-fg outline-none ring-accent/0 transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </label>
            </div>

            <div className="space-y-3 mt-4">
              <Button variant="glow" className="w-full py-3 text-base" onClick={() => startGame(name)}>
                Start New Company
              </Button>

              {gameStarted && (
                <Button variant="secondary" className="w-full py-3" onClick={() => continueGame()}>
                  Continue as {companyName} →
                </Button>
              )}
            </div>
          </Card>

          {/* Company Legacy Stats Card */}
          {gameStarted && (
            <Card className="animate-fade-up stagger-3 w-full md:w-[420px] opacity-0" glow shine>
              <div className="mb-6 flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-success/20 to-emerald-500/20 text-xl border border-success/30 shadow-lg text-emerald-400">
                  {rank.icon}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{companyName}</h2>
                  <p className="text-xs text-muted">Rank #{rankIndex} · {rank.label}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Company Legacy</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/40 bg-black/30 p-3">
                    <p className="text-[10px] text-muted uppercase">Valuation</p>
                    <p className="font-mono text-sm font-bold text-success mt-0.5">{formatCash(companyValuation)}</p>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-black/30 p-3">
                    <p className="text-[10px] text-muted uppercase">Cash Balance</p>
                    <p className="font-mono text-sm font-bold text-emerald-300 mt-0.5">{formatCash(cash)}</p>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-black/30 p-3">
                    <p className="text-[10px] text-muted uppercase">Devices Released</p>
                    <p className="font-mono text-sm font-bold text-fg mt-0.5">{releasedDevices.length}</p>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-black/30 p-3">
                    <p className="text-[10px] text-muted uppercase">Total Units Sold</p>
                    <p className="font-mono text-sm font-bold text-accent-soft mt-0.5">{totalUnitsSold.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-black/30 p-3">
                    <p className="text-[10px] text-muted uppercase">R&D Progress</p>
                    <p className="font-mono text-sm font-bold text-fg mt-0.5">
                      {unlockedTech.length} / {TECH_TREE.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-black/30 p-3">
                    <p className="text-[10px] text-muted uppercase">Achievements</p>
                    <p className="font-mono text-sm font-bold text-warning mt-0.5">
                      {unlockedAchievementsCount} / {achievements.length}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-3">
                  <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Best Seller</p>
                  {bestSeller ? (
                    <div className="mt-1 flex items-center justify-between rounded-lg bg-surface-raised/50 px-3 py-2 border border-border/30">
                      <div>
                        <p className="text-xs font-semibold text-fg truncate">{bestSeller.name}</p>
                        <p className="text-[9px] text-muted capitalize">{bestSeller.category}</p>
                      </div>
                      <p className="font-mono text-xs font-bold text-accent-soft">
                        {bestSeller.totalSold.toLocaleString()} sold
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted mt-1 italic">No devices released yet</p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        <p className="animate-fade-up stagger-4 mt-8 text-center text-xs text-muted opacity-0">
          Smartphones · Laptops · Smartwatches · Tablets · Earbuds · Smart TVs
        </p>
      </div>

      <footer className="relative z-10 border-t border-white/5 py-4 text-center text-[10px] uppercase tracking-[0.2em] text-muted/60">
        Devices Tycoon
      </footer>
    </div>
  );
}
