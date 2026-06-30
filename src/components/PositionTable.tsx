import React, { useEffect, useState, useRef } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { Position, LivePrice, UserCustomization } from '../types';

interface PositionTableProps {
  positions: Position[];
  prices: Record<string, LivePrice>;
  columns?: UserCustomization['tableColumns']['positions'];
  colorTheme?: UserCustomization['colorTheme'];
}

const THEME_ACCENTS = {
  emerald: 'text-emerald-400 bg-emerald-500',
  blue: 'text-blue-400 bg-blue-500',
  amber: 'text-amber-400 bg-amber-500',
  violet: 'text-violet-400 bg-violet-500',
  rose: 'text-rose-400 bg-rose-500',
};

export default function PositionTable({ 
  positions, 
  prices, 
  columns = {
    sector: true,
    shares: true,
    costBasis: true,
    currentPrice: true,
    weight: true,
    unrealizedPL: true,
  },
  colorTheme = 'emerald'
}: PositionTableProps) {
  const [flashStates, setFlashStates] = useState<Record<string, 'up' | 'down' | null>>({});
  const prevPricesRef = useRef<Record<string, number>>({});

  const accent = THEME_ACCENTS[colorTheme] || THEME_ACCENTS.emerald;
  const accentText = accent.split(' ')[0];
  const accentBg = accent.split(' ')[1];

  useEffect(() => {
    const newFlashes: Record<string, 'up' | 'down' | null> = {};
    let hasChanges = false;

    for (const pos of positions) {
      const currentPrice = prices[pos.symbol]?.price;
      const prevPrice = prevPricesRef.current[pos.symbol];

      if (currentPrice !== undefined && prevPrice !== undefined && currentPrice !== prevPrice) {
        newFlashes[pos.symbol] = currentPrice > prevPrice ? 'up' : 'down';
        hasChanges = true;
      }
      if (currentPrice !== undefined) {
        prevPricesRef.current[pos.symbol] = currentPrice;
      }
    }

    if (hasChanges) {
      setFlashStates(prev => ({ ...prev, ...newFlashes }));
      
      const timer = setTimeout(() => {
        setFlashStates({});
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [prices, positions]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
  };

  const sortedPositions = [...positions].sort((a, b) => b.marketValue - a.marketValue);

  // Compute active column count to correctly set the table colSpan on empty state
  const colCount = 2 + 
    (columns.shares ? 1 : 0) + 
    (columns.costBasis ? 1 : 0) + 
    (columns.currentPrice ? 1 : 0) + 
    (columns.weight ? 1 : 0) + 
    (columns.unrealizedPL ? 1 : 0);

  return (
    <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6 h-full flex flex-col justify-between" id="position-table-container">
      <div>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800/80">
          <div className="flex items-center gap-2">
            <TrendingUp className={`h-5 w-5 ${accentText}`} />
            <h3 className="text-sm font-bold text-gray-100 font-display tracking-tight">Active Portfolio Holdings</h3>
          </div>
          <span className="text-xs font-mono text-gray-500 font-medium">
            {positions.length} active positions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Asset</th>
                {columns.shares && <th className="pb-3 text-right hidden sm:table-cell">Shares</th>}
                {columns.costBasis && <th className="pb-3 text-right hidden md:table-cell">Cost Basis</th>}
                {columns.currentPrice && <th className="pb-3 text-right hidden sm:table-cell">Current Price</th>}
                <th className="pb-3 text-right">Market Value</th>
                {columns.weight && <th className="pb-3 text-center hidden md:table-cell">Portfolio Weight</th>}
                {columns.unrealizedPL && <th className="pb-3 text-right pr-2">Unrealized P&L</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30 text-sm">
              {sortedPositions.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="text-center py-8 text-gray-500 font-medium text-xs">
                    No active holdings. Log transactions to build your portfolio.
                  </td>
                </tr>
              ) : (
                sortedPositions.map((pos) => {
                  const flash = flashStates[pos.symbol];
                  const plPositive = pos.plAmount >= 0;

                  return (
                    <tr 
                      key={pos.symbol} 
                      className="hover:bg-gray-800/20 transition-all group"
                      id={`pos-row-${pos.symbol}`}
                    >
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl bg-gray-950 border border-gray-800/80 flex flex-col items-center justify-center font-mono font-bold text-xs text-gray-300 group-hover:border-gray-700/60 transition-colors`}>
                            {pos.symbol}
                          </div>
                          <div className="min-w-0 max-w-[120px] sm:max-w-none">
                            <div className="font-semibold text-gray-200 text-xs md:text-sm truncate">{pos.name}</div>
                            {columns.sector && (
                              <div className="text-[10px] text-gray-500 font-semibold uppercase font-mono tracking-wider truncate">{pos.sector}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {columns.shares && (
                        <td className="py-3.5 text-right font-mono font-semibold text-gray-300 hidden sm:table-cell">
                          {pos.quantity.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                        </td>
                      )}

                      {columns.costBasis && (
                        <td className="py-3.5 text-right font-mono text-gray-400 hidden md:table-cell">
                          {formatCurrency(pos.averageBuyPrice)}
                        </td>
                      )}

                      {columns.currentPrice && (
                        <td className="py-3.5 text-right hidden sm:table-cell">
                          <span className={`inline-flex items-center justify-end font-mono font-semibold px-2.5 py-1 rounded-md transition-all duration-300 ${
                            flash === 'up' 
                              ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 scale-105 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                              : flash === 'down' 
                              ? 'text-rose-400 bg-rose-950/60 border border-rose-500/30 scale-105 shadow-[0_0_12px_rgba(244,63,94,0.15)]' 
                              : 'text-gray-300 bg-transparent border border-transparent'
                          }`}>
                            {formatCurrency(pos.currentPrice)}
                          </span>
                        </td>
                      )}

                      <td className="py-3.5 text-right font-mono font-bold text-gray-200">
                        {formatCurrency(pos.marketValue)}
                      </td>

                      {columns.weight && (
                        <td className="py-3.5 text-center hidden md:table-cell">
                          <div className="inline-flex flex-col items-center w-28">
                            <span className="text-xs font-mono font-semibold text-gray-300 mb-1">{pos.weight.toFixed(1)}%</span>
                            <div className="w-full bg-gray-950 border border-gray-800/80 rounded-full h-1 overflow-hidden">
                              <div 
                                className={`${accentBg} h-full rounded-full`} 
                                style={{ width: `${pos.weight}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                      )}

                      {columns.unrealizedPL && (
                        <td className="py-3.5 text-right pr-2">
                          <div className="inline-flex flex-col items-end">
                            <span className={`inline-flex items-center gap-0.5 font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                              plPositive 
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10' 
                                : 'bg-rose-950/40 text-rose-400 border border-rose-500/10'
                            }`}>
                              {plPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {pos.plPercentage.toFixed(2)}%
                            </span>
                            <span className={`text-[11px] font-mono font-medium mt-1 ${plPositive ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                              {plPositive ? '+' : ''}{formatCurrency(pos.plAmount)}
                            </span>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
