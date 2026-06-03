import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  glow = false,
  shine = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  shine?: boolean;
}) {
  return (
    <div
      className={`glass rounded-2xl p-5 ${shine ? 'card-shine' : ''} ${
        glow ? 'glow-ring shadow-[0_0_48px_rgba(99,102,241,0.15)]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
