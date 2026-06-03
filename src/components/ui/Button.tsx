import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glow';

const styles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-accent via-blue-500 to-glow text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:brightness-110',
  glow: 'bg-gradient-to-r from-glow to-pink-500 text-white shadow-lg shadow-purple-500/35 hover:shadow-purple-500/50',
  secondary:
    'border border-border bg-surface-hover/80 text-fg backdrop-blur-sm hover:border-border-bright hover:bg-surface-hover',
  ghost: 'text-muted hover:bg-surface-hover hover:text-fg',
  danger: 'border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20',
};

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
