import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

const TYPING_LINES = [
  '> QUANTUM MFG SYS v4.2.1',
  '> CONNECTING TO ORBITAL RELAY...',
  '> ENCRYPTED TUNNEL ESTABLISHED',
  '> AUTHENTICATION REQUIRED',
  '',
];

export function AccessLogin({ onAccess }: { onAccess: (name: string) => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [input, setInput] = useState('Garage Labs');
  const [phase, setPhase] = useState<'boot' | 'input' | 'grant' | 'deny'>('boot');
  const [cursorVisible, setCursorVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const gameStarted = useGameStore((s) => s.gameStarted);
  const companyName = useGameStore((s) => s.companyName);
  const continueGame = useGameStore((s) => s.continueGame);

  // Typing effect for boot messages
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < TYPING_LINES.length) {
        setLines((prev) => [...prev, TYPING_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setPhase('input'), 300);
      }
    }, 350);
    return () => clearInterval(interval);
  }, []);

  // Cursor blink
  useEffect(() => {
    const t = setInterval(() => setCursorVisible((c) => !c), 530);
    return () => clearInterval(t);
  }, []);

  // Focus input when ready
  useEffect(() => {
    if (phase === 'input') inputRef.current?.focus();
  }, [phase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = input.trim();
    if (!name) return;

    setPhase('grant');
    setLines((prev) => [...prev, `> IDENT: "${name}"`, '> ACCESS GRANTED', '> LAUNCHING STUDIO...']);

    setTimeout(() => onAccess(name), 1500);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a12]">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-cyan-400/30"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            animation: `float ${4 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      {/* Corner brackets */}
      <div className="absolute left-6 top-6 h-12 w-12 border-l border-t border-cyan-500/30" />
      <div className="absolute right-6 top-6 h-12 w-12 border-r border-t border-cyan-500/30" />
      <div className="absolute bottom-6 left-6 h-12 w-12 border-b border-l border-cyan-500/30" />
      <div className="absolute bottom-6 right-6 h-12 w-12 border-b border-r border-cyan-500/30" />

      {/* Terminal card */}
      <div className="relative z-10 w-full max-w-lg">
        {/* Glow */}
        <div className="absolute -inset-1 rounded-2xl bg-cyan-500/5 blur-xl" />

        <div className="relative rounded-2xl border border-cyan-500/20 bg-[#0d1117]/90 shadow-[0_0_60px_rgba(0,212,255,0.08)] backdrop-blur-xl">
          {/* Terminal header */}
          <div className="flex items-center gap-2 border-b border-cyan-500/10 px-5 py-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
              <div className="h-25 h-2.5 w-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="ml-2 font-mono text-[10px] tracking-widest text-cyan-600/50">
              SYS://AUTHENTICATION_TERMINAL
            </span>
          </div>

          {/* Terminal body */}
          <div className="p-6">
            {/* Boot lines */}
            <div className="mb-6 space-y-1 font-mono text-xs">
              {lines.map((line, i) => (
                <div
                  key={`${i}-${line}`}
                  className={`${
                    line.includes('GRANTED')
                      ? 'text-green-400'
                      : line.includes('DENIED')
                        ? 'text-red-400'
                        : line.includes('IDENT')
                          ? 'text-cyan-300'
                          : 'text-cyan-600/50'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>

            {/* Input phase */}
            {phase === 'input' && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Continue button if game exists */}
                {gameStarted && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhase('grant');
                      setLines((prev) => [...prev, `> RESUMING: "${companyName}"`, '> ACCESS GRANTED']);
                      setTimeout(() => continueGame(), 1200);
                    }}
                    className="group flex w-full items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 transition hover:border-cyan-400/40 hover:bg-cyan-500/10"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-lg">
                      ⚡
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-cyan-300">Continue as {companyName}</p>
                      <p className="text-[10px] text-cyan-600/50">Resume previous session</p>
                    </div>
                    <span className="ml-auto text-cyan-500/40 transition group-hover:text-cyan-400">→</span>
                  </button>
                )}

                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-cyan-600/50">
                    ENTER OPERATOR IDENT
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-black/40 px-4 py-3 transition focus-within:border-cyan-400/50 focus-within:shadow-[0_0_20px_rgba(0,212,255,0.1)]">
                    <span className="font-mono text-cyan-500/50">{'>'}</span>
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      maxLength={28}
                      placeholder="Company Name"
                      className="flex-1 bg-transparent font-mono text-sm text-cyan-300 outline-none placeholder:text-cyan-700/30"
                    />
                    <span className={`h-4 w-0.5 bg-cyan-400 ${cursorVisible ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
                  </div>
                </div>

                <button
                  type="submit"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-3 font-mono text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 hover:shadow-[0_0_30px_rgba(0,212,255,0.15)]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  INITIALIZE STUDIO
                </button>

                <p className="text-center font-mono text-[9px] text-cyan-700/30">
                  SEED CAPITAL: $50,000 · GARAGE HQ · TIER-1 COMPONENTS
                </p>
              </form>
            )}

            {/* Grant/deny phase */}
            {(phase === 'grant' || phase === 'deny') && (
              <div className="flex items-center gap-3 py-2">
                <div className={`h-2 w-2 rounded-full ${phase === 'grant' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className={`font-mono text-xs ${phase === 'grant' ? 'text-green-400' : 'text-red-400'}`}>
                  {phase === 'grant' ? 'INITIALIZING STUDIO...' : 'ACCESS DENIED'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
