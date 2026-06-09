import { useGameStore } from '../store/useGameStore';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

export function QuarterlyReportModal() {
  const activeReport = useGameStore((s) => s.activeQuarterlyReport);
  const closeReport = useGameStore((s) => s.closeQuarterlyReport);

  if (!activeReport) return null;

  const formatCash = (n: number) => {
    const isNegative = n < 0;
    const abs = Math.abs(n);
    const formatted =
      abs >= 1000000 ? `$${(abs / 1000000).toFixed(2)}M`
      : abs >= 1000 ? `$${(abs / 1000).toFixed(1)}K`
      : `$${abs}`;
    return isNegative ? `-${formatted}` : formatted;
  };

  // Sort competitors by revenue or profit
  const sortedCompetitors = [...activeReport.competitorSummaries].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface/80 p-4 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <Card
        className="relative w-full max-w-2xl border border-border-bright/50 bg-surface-card/95 p-6 shadow-2xl shadow-black/80 sm:p-8 animate-fade-up max-h-[90vh] overflow-y-auto custom-scrollbar"
        glow
        shine
      >
        {/* Glow Effects */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-glow/20 blur-3xl" />

        {/* Header */}
        <div className="relative mb-6 border-b border-border/80 pb-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-glow text-2xl shadow-lg shadow-accent/20">
            📊
          </div>
          <h2 className="text-gradient text-2xl font-bold tracking-wider sm:text-3xl">
            QUARTERLY REPORT
          </h2>
          <p className="mt-1 text-xs text-muted uppercase tracking-widest">
            Year {activeReport.year} · Month {activeReport.month} · Quarter {activeReport.quarter}
          </p>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border/50 bg-black/40 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted">Q-Revenue</p>
            <p className="mt-1 font-mono text-sm font-bold text-emerald-400">
              {formatCash(activeReport.playerRevenue)}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-black/40 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted">Q-Net Profit</p>
            <p
              className={`mt-1 font-mono text-sm font-bold ${
                activeReport.playerProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {formatCash(activeReport.playerProfit)}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-black/40 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted">Cash Balance</p>
            <p className="mt-1 font-mono text-sm font-bold text-fg">
              {formatCash(activeReport.playerCash)}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-black/40 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted">Market Share</p>
            <p className="mt-1 font-mono text-sm font-bold text-accent-soft">
              {activeReport.marketShare.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Quarter Events & Highlights */}
        <div className="mt-6">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
            Highlights & Analysis
          </h3>
          <div className="rounded-xl border border-border/40 bg-surface-raised/40 p-4">
            {activeReport.highlights.length > 0 ? (
              <ul className="space-y-2.5">
                {activeReport.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-fg/90">
                    <span className="text-accent-soft">✦</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-xs text-muted">
                Steady and consistent operational results this quarter. No major anomalies reported.
              </p>
            )}
          </div>
        </div>

        {/* Competitor Overview */}
        <div className="mt-6">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
            Global Competition
          </h3>
          <div className="overflow-hidden rounded-xl border border-border/50 bg-black/20">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-raised/60 text-[10px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-2">Company</th>
                  <th className="px-4 py-2 text-right">Revenue</th>
                  <th className="px-4 py-2 text-right">Reputation</th>
                  <th className="px-4 py-2 text-center">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {/* Player Row */}
                <tr className="bg-accent/5 font-semibold text-accent-soft">
                  <td className="px-4 py-2.5 flex items-center gap-2">
                    <span className="text-base">🚀</span>
                    <span>You (Player)</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {formatCash(activeReport.playerRevenue)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {Math.round(useGameStore.getState().reputation)}
                  </td>
                  <td className="px-4 py-2.5 text-center text-emerald-400">
                    ↑
                  </td>
                </tr>

                {/* Bot Rows */}
                {sortedCompetitors.map((comp) => (
                  <tr key={comp.name} className="hover:bg-white/2">
                    <td className="px-4 py-2.5 flex items-center gap-2 text-fg/80">
                      <span className="text-base">🏢</span>
                      <span>{comp.name}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted">
                      {formatCash(comp.revenue)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted">
                      {Math.round(comp.reputation)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge
                        tone={
                          comp.trend === 'up'
                            ? 'success'
                            : comp.trend === 'down'
                            ? 'danger'
                            : 'neutral'
                        }
                      >
                        {comp.trend === 'up' ? '↑' : comp.trend === 'down' ? '↓' : '→'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Action */}
        <div className="mt-8 flex justify-center border-t border-border/60 pt-4">
          <Button variant="primary" className="px-8 py-3 text-sm" onClick={closeReport}>
            Close Report & Resume
          </Button>
        </div>
      </Card>
    </div>
  );
}
