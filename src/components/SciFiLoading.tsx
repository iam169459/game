import { useState, useEffect } from 'react';

const BOOT_MESSAGES = [
  { text: 'INITIALIZING QUANTUM CORE...', delay: 0 },
  { text: 'LOADING NEURAL INTERFACE v4.2.1', delay: 400 },
  { text: 'SCANNING DEVICE TEMPLATES...', delay: 800 },
  { text: 'CALIBRATING MARKET ALGORITHMS', delay: 1200 },
  { text: 'ESTABLISHING SATELLITE LINK', delay: 1600 },
  { text: 'DECRYPTING RESEARCH DATABASE', delay: 2000 },
  { text: 'SYSTEM READY', delay: 2600 },
];

export function SciFiLoading({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_MESSAGES.forEach((msg, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleMessages(i + 1);
          if (i === 3) {
            setGlitch(true);
            setTimeout(() => setGlitch(false), 200);
          }
        }, msg.delay)
      );
    });

    timers.push(
      setTimeout(() => onComplete(), 3200)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 100));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a12]">
      {/* Hex grid background */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2300d4ff' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Scanning line */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          style={{
            animation: 'scanLine 2s linear infinite',
          }}
        />
      </div>

      {/* Corner brackets */}
      <div className="absolute left-8 top-8 h-16 w-16 border-l-2 border-t-2 border-cyan-500/40" />
      <div className="absolute right-8 top-8 h-16 w-16 border-r-2 border-t-2 border-cyan-500/40" />
      <div className="absolute bottom-8 left-8 h-16 w-16 border-b-2 border-l-2 border-cyan-500/40" />
      <div className="absolute bottom-8 right-8 h-16 w-16 border-b-2 border-r-2 border-cyan-500/40" />

      {/* Main content */}
      <div className={`relative z-10 flex flex-col items-center gap-8 ${glitch ? 'animate-glitch' : ''}`}>
        {/* Logo */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-cyan-500/10 blur-xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-cyan-500/30 bg-[#0d1117] shadow-[0_0_40px_rgba(0,212,255,0.15)]">
            <span className="text-4xl">📱</span>
            <div className="absolute inset-0 rounded-2xl border border-cyan-400/20" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="font-mono text-3xl font-bold tracking-[0.3em] text-cyan-400" style={{ textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>
            DEVICES TYCOON
          </h1>
          <p className="mt-2 font-mono text-xs tracking-widest text-cyan-600/60">
            QUANTUM MANUFACTURING SYSTEMS
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-80">
          <div className="mb-2 flex justify-between font-mono text-[10px] text-cyan-500/60">
            <span>SYS.BOOT</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="relative h-1 overflow-hidden rounded-full bg-cyan-900/30">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-200"
              style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(0,212,255,0.5)' }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              style={{ animation: 'shimmer 1.5s linear infinite', width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Boot messages */}
        <div className="w-80 space-y-1 font-mono text-[10px]">
          {BOOT_MESSAGES.slice(0, visibleMessages).map((msg, i) => (
            <div
              key={msg.text}
              className={`flex items-center gap-2 transition-opacity ${
                i === visibleMessages - 1 ? 'text-cyan-400' : 'text-cyan-600/40'
              }`}
            >
              <span className="text-cyan-500/50">{'>'}</span>
              <span>{msg.text}</span>
              {i === visibleMessages - 1 && i < BOOT_MESSAGES.length - 1 && (
                <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 1px); }
          40% { transform: translate(2px, -1px); }
          60% { transform: translate(-1px, 2px); }
          80% { transform: translate(1px, -2px); }
        }
        .animate-glitch { animation: glitch 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}
