export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'danger' | 'accent';
}) {
  const tones = {
    neutral: 'bg-surface-hover/80 text-muted border-border',
    success: 'bg-success/15 text-emerald-400 border-emerald-500/30',
    danger: 'bg-danger/15 text-red-400 border-red-500/30',
    accent: 'bg-accent/15 text-accent-soft border-accent/40',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
