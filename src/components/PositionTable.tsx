import React, { useEffect, useState, useRef } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign } from 'lucide-react';
import { Position, LivePrice } from '../types';

interface PositionTableProps {
  positions: Position[];
  prices: Record<string, LivePrice>;
}

export default function PositionTable({ positions, prices }: PositionTableProps) {
  // Track which symbols recently updated to flash them
  const [flashStates, setFlashStates] = useState<Record<string, 'up' | 'down' | null>>({});
  const prevPricesRef = useRef<Record<string, number>>({});

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
      
      // Clear flashes after 1.2 seconds
      const timer = setTimeout(() => {
        setFlashStates({});
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [prices, positions]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  };

  const sortedPositions = [...positions].sort((a, b) => b.marketValue - a.marketValue);

  return (
    <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6" id="position-table-container">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800/80">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
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
              <th className="pb-3 text-right">Shares</th>
              <th className="pb-3 text-right">Cost Basis</th>
              <th className="pb-3 text-right">Current Price</th>
              <th className="pb-3 text-right">Market Value</th>
              <th className="pb-3 text-center">Portfolio Weight</th>
              <th className="pb-3 text-right pr-2">Unrealized P&L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/30 text-sm">
            {sortedPositions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500 font-medium text-xs">
                  No active holdings. Log transactions above to build your portfolio.
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
                    {/* Symbol / Name / Sector */}
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gray-950 border border-gray-800/80 flex flex-col items-center justify-center font-mono font-bold text-xs text-gray-300 group-hover:border-gray-700/60 transition-colors">
                          {pos.symbol}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-200 text-xs md:text-sm">{pos.name}</div>
                          <div className="text-[10px] text-gray-500 font-semibold uppercase font-mono tracking-wider">{pos.sector}</div>
                        </div>
                      </div>
                    </td>

                    {/* Shares */}
                    <td className="py-3.5 text-right font-mono font-semibold text-gray-300">
                      {pos.quantity.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                    </td>

                    {/* Average buy cost */}
                    <td className="py-3.5 text-right font-mono text-gray-400">
                      {formatCurrency(pos.averageBuyPrice)}
                    </td>

                    {/* Current Price (with live pulsing flash states!) */}
                    <td className="py-3.5 text-right">
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

                    {/* Market Value */}
                    <td className="py-3.5 text-right font-mono font-bold text-gray-200">
                      {formatCurrency(pos.marketValue)}
                    </td>

                    {/* Weight progress */}
                    <td className="py-3.5 text-center">
                      <div className="inline-flex flex-col items-center w-28">
                        <span className="text-xs font-mono font-semibold text-gray-300 mb-1">{pos.weight.toFixed(1)}%</span>
                        <div className="w-full bg-gray-950 border border-gray-800/80 rounded-full h-1 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full" 
                            style={{ width: `${pos.weight}%` }} 
                          />
                        </div>
                      </div>
                    </td>

                    {/* Unrealized P&L */}
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
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
