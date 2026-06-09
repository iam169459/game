import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';

interface StockInfo {
  botId: string;
  ticker: string;
  name: string;
  logo: string;
  color: string;
}

const STOCKS: StockInfo[] = [
  { botId: 'bot-1', ticker: 'NOVA', name: 'TechNova Inc', logo: '⚡', color: 'text-blue-400 border-blue-500/20 bg-blue-500/10' },
  { botId: 'bot-2', ticker: 'PIXL', name: 'PixelCraft', logo: '🎮', color: 'text-purple-400 border-purple-500/20 bg-purple-500/10' },
  { botId: 'bot-3', ticker: 'ZNTH', name: 'Zenith Labs', logo: '🔬', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' },
  { botId: 'bot-4', ticker: 'BBOX', name: 'BudgetBox', logo: '💰', color: 'text-amber-400 border-amber-500/20 bg-amber-500/10' },
  { botId: 'bot-5', ticker: 'NEXG', name: 'NexGen', logo: '🚀', color: 'text-red-400 border-red-500/20 bg-red-500/10' },
];

// Sparkline component to draw price history using an inline SVG
function Sparkline({ history, colorClass }: { history: number[]; colorClass: string }) {
  if (history.length < 2) return null;
  const width = 120;
  const height = 40;
  const padding = 4;
  
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;

  const points = history.map((val, index) => {
    const x = padding + (index / (history.length - 1)) * (width - padding * 2);
    const y = height - (padding + ((val - min) / range) * (height - padding * 2));
    return `${x},${y}`;
  }).join(' ');

  // Determine line color from colorClass
  let strokeColor = '#3b82f6'; // fallback blue
  if (colorClass.includes('blue')) strokeColor = '#60a5fa';
  if (colorClass.includes('purple')) strokeColor = '#c084fc';
  if (colorClass.includes('emerald')) strokeColor = '#34d399';
  if (colorClass.includes('amber')) strokeColor = '#fbbf24';
  if (colorClass.includes('red')) strokeColor = '#f87171';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function StocksTab() {
  const cash = useGameStore((s) => s.cash);
  const stockPrices = useGameStore((s) => s.stockPrices) || {};
  const playerPortfolio = useGameStore((s) => s.playerPortfolio) || {};
  const buyStock = useGameStore((s) => s.buyStock);
  const sellStock = useGameStore((s) => s.sellStock);

  const [activeStock, setActiveStock] = useState<StockInfo | null>(null);
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [sharesInput, setSharesInput] = useState<string>('');

  // Calculate overall portfolio metrics
  let totalPortfolioValue = 0;
  let totalPortfolioCost = 0;

  STOCKS.forEach(({ botId }) => {
    const holding = playerPortfolio[botId] || { shares: 0, avgCost: 0 };
    const priceObj = stockPrices[botId] || { price: 0 };
    totalPortfolioValue += holding.shares * priceObj.price;
    totalPortfolioCost += holding.shares * holding.avgCost;
  });

  const totalPortfolioReturn = totalPortfolioValue - totalPortfolioCost;
  const portfolioReturnPercent = totalPortfolioCost > 0
    ? (totalPortfolioReturn / totalPortfolioCost) * 100
    : 0;

  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStock) return;
    const qty = parseInt(sharesInput, 10);
    if (isNaN(qty) || qty <= 0) return;

    let success = false;
    if (tradeMode === 'buy') {
      success = buyStock(activeStock.botId, qty);
    } else {
      success = sellStock(activeStock.botId, qty);
    }

    if (success) {
      setSharesInput('');
      setActiveStock(null);
    }
  };

  const currentPrice = activeStock ? (stockPrices[activeStock.botId]?.price ?? 0) : 0;
  const currentHolding = activeStock ? (playerPortfolio[activeStock.botId] || { shares: 0, avgCost: 0 }) : { shares: 0, avgCost: 0 };
  const estimatedTotal = (parseInt(sharesInput, 10) || 0) * currentPrice;

  return (
    <div className="space-y-5 pb-6">
      {/* Portfolio Header Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-surface-card/60 p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted">Portfolio Value</p>
          <p className="font-mono text-xl font-bold text-fg mt-1">
            ${totalPortfolioValue.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-xs font-semibold ${totalPortfolioReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalPortfolioReturn >= 0 ? '▲' : '▼'} ${Math.abs(totalPortfolioReturn).toLocaleString()}
            </span>
            <span className={`text-[10px] ${totalPortfolioReturn >= 0 ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
              ({portfolioReturnPercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface-card/60 p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted">Available Buying Power</p>
          <p className="font-mono text-xl font-bold text-accent-soft mt-1">
            ${cash.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted mt-1.5">Cash liquid balance</p>
        </div>
      </div>

      {/* Stocks List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-bold text-fg uppercase tracking-wider">Market Tickers</h2>
          <span className="text-xs text-muted">Updates monthly</span>
        </div>

        <div className="space-y-2.5">
          {STOCKS.map((stock) => {
            const priceObj = stockPrices[stock.botId] || { price: 100, history: [100], changePercent: 0 };
            const holding = playerPortfolio[stock.botId] || { shares: 0, avgCost: 0 };
            const isUp = priceObj.changePercent >= 0;

            const stockValue = holding.shares * priceObj.price;
            const stockCost = holding.shares * holding.avgCost;
            const stockReturn = stockValue - stockCost;
            const stockReturnPercent = stockCost > 0 ? (stockReturn / stockCost) * 100 : 0;

            return (
              <div
                key={stock.ticker}
                className="rounded-2xl border border-white/10 bg-surface-card/40 hover:bg-surface-card/70 transition-all p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Side: Info & Ticker */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border text-lg ${stock.color}`}>
                    {stock.logo}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-fg text-sm">{stock.ticker}</span>
                      <span className="text-xs text-muted truncate max-w-[120px]">{stock.name}</span>
                    </div>
                    {holding.shares > 0 ? (
                      <p className="text-[11px] text-muted mt-0.5">
                        {holding.shares.toLocaleString()} shares · Avg: ${holding.avgCost.toFixed(1)}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted/60 mt-0.5">No holdings</p>
                    )}
                  </div>
                </div>

                {/* Middle: Sparkline Chart */}
                <div className="flex items-center justify-start md:justify-center">
                  <Sparkline history={priceObj.history} colorClass={stock.color} />
                </div>

                {/* Right Side: Price, Return, Trade Button */}
                <div className="flex items-center justify-between md:justify-end gap-5">
                  <div className="text-right">
                    <p className="font-mono font-bold text-fg text-base">
                      ${priceObj.price}
                    </p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold mt-0.5 ${
                      isUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {isUp ? '+' : ''}{priceObj.changePercent.toFixed(2)}%
                    </span>
                  </div>

                  {holding.shares > 0 && (
                    <div className="text-right hidden sm:block">
                      <p className="font-mono text-xs font-semibold text-fg">
                        ${stockValue.toLocaleString()}
                      </p>
                      <span className={`text-[10px] font-bold ${stockReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stockReturn >= 0 ? '+' : ''}{stockReturnPercent.toFixed(1)}%
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveStock(stock);
                      setTradeMode('buy');
                      setSharesInput('');
                    }}
                    className="px-4 py-2 rounded-xl bg-accent/20 text-accent-soft hover:bg-accent/30 text-xs font-semibold transition-all"
                  >
                    Trade
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trade Modal (Overlay) */}
      {activeStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-surface-card/95 backdrop-blur-xl p-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-fg text-base">Trade {activeStock.ticker}</h3>
                <p className="text-xs text-muted">{activeStock.name} · ${currentPrice} / share</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveStock(null)}
                className="text-muted hover:text-fg text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Buy / Sell Selection Tabs */}
            <div className="flex rounded-xl bg-white/5 p-1 mb-4">
              <button
                type="button"
                onClick={() => { setTradeMode('buy'); setSharesInput(''); }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  tradeMode === 'buy' ? 'bg-emerald-500/20 text-emerald-400 shadow' : 'text-muted'
                }`}
              >
                Buy Stock
              </button>
              <button
                type="button"
                onClick={() => { setTradeMode('sell'); setSharesInput(''); }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  tradeMode === 'sell' ? 'bg-red-500/20 text-red-400 shadow' : 'text-muted'
                }`}
              >
                Sell Stock
              </button>
            </div>

            {/* Holdings & Cash status */}
            <div className="space-y-1 bg-white/5 rounded-xl p-3 mb-4 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Currently Owned:</span>
                <span className="font-mono text-fg">{currentHolding.shares.toLocaleString()} shares</span>
              </div>
              {currentHolding.shares > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">Average Cost:</span>
                  <span className="font-mono text-fg">${currentHolding.avgCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1.5">
                <span className="text-muted">{tradeMode === 'buy' ? 'Available Cash:' : 'Sellable Shares:'}</span>
                <span className="font-mono text-accent-soft">
                  {tradeMode === 'buy' ? `$${cash.toLocaleString()}` : `${currentHolding.shares.toLocaleString()} shares`}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleExecuteTrade} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                  Number of Shares
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="0"
                    value={sharesInput}
                    onChange={(e) => setSharesInput(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-fg placeholder-muted/50 focus:border-accent focus:bg-white/10 focus:outline-none text-sm"
                    required
                  />
                  <div className="absolute right-2 top-1.5 flex gap-1">
                    {/* Quick percentage helper buttons */}
                    {['25%', '50%', 'MAX'].map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          if (tradeMode === 'buy') {
                            const pct = label === '25%' ? 0.25 : label === '50%' ? 0.50 : 1;
                            const maxShares = Math.floor(cash / currentPrice);
                            setSharesInput(Math.floor(maxShares * pct).toString());
                          } else {
                            const pct = label === '25%' ? 0.25 : label === '50%' ? 0.50 : 1;
                            setSharesInput(Math.floor(currentHolding.shares * pct).toString());
                          }
                        }}
                        className="px-1.5 py-1 text-[9px] font-bold rounded bg-white/10 text-fg hover:bg-white/20 transition-all"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Estimate */}
              {estimatedTotal > 0 && (
                <div className="flex justify-between items-center text-xs bg-white/5 rounded-xl px-3 py-2 font-mono">
                  <span className="text-muted">{tradeMode === 'buy' ? 'Total Cost' : 'Total Proceeds'}</span>
                  <span className={`font-bold ${tradeMode === 'buy' ? 'text-fg' : 'text-emerald-400'}`}>
                    ${estimatedTotal.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveStock(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-muted hover:text-fg text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!sharesInput || parseInt(sharesInput) <= 0 || (tradeMode === 'buy' && estimatedTotal > cash) || (tradeMode === 'sell' && parseInt(sharesInput) > currentHolding.shares)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                    tradeMode === 'buy'
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white disabled:bg-emerald-800/20 disabled:text-emerald-500/40'
                      : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-red-800/20 disabled:text-red-500/40'
                  }`}
                >
                  Confirm {tradeMode === 'buy' ? 'Buy' : 'Sell'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
