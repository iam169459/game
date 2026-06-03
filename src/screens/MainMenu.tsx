import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useGameStore } from '../store/useGameStore';

const FLOATING_DEVICES = [
  { icon: '📱', className: 'left-[8%] top-[18%] animate-float', delay: '0s' },
  { icon: '💻', className: 'right-[10%] top-[22%] animate-float', delay: '1s' },
  { icon: '⌚', className: 'left-[15%] bottom-[28%] animate-float', delay: '2s' },
  { icon: '🎧', className: 'right-[18%] bottom-[24%] animate-float text-3xl opacity-40', delay: '0.5s' },
];

export function MainMenu() {
  const [name, setName] = useState('Garage Labs');
  const startGame = useGameStore((s) => s.startGame);
  const continueGame = useGameStore((s) => s.continueGame);
  const gameStarted = useGameStore((s) => s.gameStarted);
  const companyName = useGameStore((s) => s.companyName);

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

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">
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

        <Card className="animate-fade-up stagger-2 w-full max-w-md opacity-0" glow shine>
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

          <Button variant="glow" className="w-full py-3 text-base" onClick={() => startGame(name)}>
            Start New Company
          </Button>

          {gameStarted && (
            <Button variant="secondary" className="mt-3 w-full" onClick={() => continueGame()}>
              Continue as {companyName} →
            </Button>
          )}
        </Card>

        <p className="animate-fade-up stagger-3 mt-8 text-center text-xs text-muted opacity-0">
          Smartphones · Laptops · Smartwatches
        </p>
      </div>

      <footer className="relative z-10 border-t border-white/5 py-4 text-center text-[10px] uppercase tracking-[0.2em] text-muted/60">
        Devices Tycoon
      </footer>
    </div>
  );
}
