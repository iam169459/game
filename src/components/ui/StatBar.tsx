const COLORS: Record<string, string> = {
  performance: 'bg-accent',
  display: 'bg-glow',
  camera: 'bg-pink-400',
  battery: 'bg-success',
  build: 'bg-warning',
  appeal: 'bg-cyan-400',
};

export function StatBar({ label, value }: { label: string; value: number }) {
  const color = COLORS[label.toLowerCase()] ?? 'bg-accent';
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="capitalize text-muted">{label}</span>
        <span className="font-mono font-semibold">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
