export function Sparkline({
  data,
  height = 48,
  className = '',
}: {
  data: number[];
  height?: number;
  className?: string;
}) {
  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-surface-raised/50 text-xs text-muted ${className}`}
        style={{ height }}
      >
        No data yet
      </div>
    );
  }

  const max = Math.max(...data.map(Math.abs), 1);
  const min = Math.min(...data);
  const range = Math.max(max - min, 1);
  const w = 100;
  const h = height - 8;
  const step = data.length > 1 ? w / (data.length - 1) : w;

  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h + 4;
      return `${x},${y}`;
    })
    .join(' ');

  const last = data[data.length - 1];
  const positive = last >= 0;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className={`w-full overflow-visible ${className}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={positive ? '#10b981' : '#ef4444'} stopOpacity="0.35" />
          <stop offset="100%" stopColor={positive ? '#10b981' : '#ef4444'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${w},${height}`} fill="url(#spark-fill)" />
      <polyline
        points={points}
        fill="none"
        stroke={positive ? '#34d399' : '#f87171'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
