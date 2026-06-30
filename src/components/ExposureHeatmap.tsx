import React from 'react';
import { Layers, PieChart } from 'lucide-react';
import { Position } from '../types';

interface ExposureHeatmapProps {
  positions: Position[];
}

export default function ExposureHeatmap({ positions }: ExposureHeatmapProps) {
  const sectorGroupMap: Record<string, { weight: number; marketValue: number; positionsCount: number }> = {};
  let totalMarketValue = 0;

  for (const pos of positions) {
    totalMarketValue += pos.marketValue;
    if (!sectorGroupMap[pos.sector]) {
      sectorGroupMap[pos.sector] = { weight: 0, marketValue: 0, positionsCount: 0 };
    }
    const sec = sectorGroupMap[pos.sector];
    sec.marketValue += pos.marketValue;
    sec.positionsCount += 1;
  }

  const sectors = Object.keys(sectorGroupMap).map((sectorName) => {
    const data = sectorGroupMap[sectorName];
    const weight = totalMarketValue > 0 ? (data.marketValue / totalMarketValue) * 100 : 0;
    return {
      name: sectorName,
      weight,
      marketValue: data.marketValue,
      count: data.positionsCount,
    };
  }).sort((a, b) => b.weight - a.weight);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  };

  const getPLColorClass = (plPct: number) => {
    if (plPct > 15) return 'bg-emerald-950/60 border-emerald-500 hover:border-emerald-400 text-emerald-300';
    if (plPct > 4) return 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-500 text-emerald-400/95';
    if (plPct >= 0) return 'bg-gray-900 border-gray-800 hover:border-gray-700 text-gray-300';
    if (plPct > -10) return 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50 text-rose-400/90';
    return 'bg-rose-950/50 border-rose-500 hover:border-rose-400 text-rose-300';
  };

  return (
    <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6 flex flex-col md:flex-row lg:flex-col h-full justify-between gap-6 md:gap-8 lg:gap-6" id="exposure-heatmap-section">
      
      <div className="flex flex-col flex-1 w-full md:w-1/2 lg:w-full justify-between">
        <div className="mb-4">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-800/80">
            <Layers className="h-4.5 w-4.5 text-emerald-400" />
            <h3 className="text-sm font-bold text-gray-100 font-sans tracking-tight">Asset Risk Exposure Map</h3>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Sizing relative to the entire portfolio. Box size shows weight, border color matches P&L.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
          {positions.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500 font-medium text-xs">
              No active holdings to map.
            </div>
          ) : (
            positions.map((pos) => {
              const colorClass = getPLColorClass(pos.plPercentage);
              return (
                <div
                  key={pos.symbol}
                  className={`border rounded-xl p-3.5 transition-all duration-300 cursor-default group flex flex-col justify-between relative overflow-hidden hover:-translate-y-0.5 ${colorClass}`}
                  style={{ minHeight: '105px' }}
                  id={`heatmap-box-${pos.symbol}`}
                >
                  <div className="absolute -top-6 -right-6 w-12 h-12 bg-gray-800/15 rounded-full blur-md group-hover:scale-150 transition-transform" />
                  
                  <div className="flex justify-between items-start z-10">
                    <span className="text-base font-bold font-mono tracking-tight">{pos.symbol}</span>
                    <span className="text-[9px] font-mono bg-gray-950/70 border border-gray-850 text-gray-300 px-1.5 py-0.5 rounded font-bold">
                      {pos.weight.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-2.5 z-10">
                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider truncate" title={pos.name}>
                      {pos.name}
                    </div>
                    <div className="text-xs font-bold font-mono mt-0.5 text-gray-100">{formatCurrency(pos.marketValue)}</div>
                    <div className="text-[9px] font-mono font-medium mt-0.5">
                      {pos.plAmount >= 0 ? '+' : ''}{pos.plPercentage.toFixed(1)}% Return
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Responsive divider: horizontal on mobile/desktop, vertical on tablet */}
      <div className="hidden md:block lg:hidden w-px bg-gray-800/60 shrink-0 self-stretch my-2" />
      <div className="block md:hidden lg:block h-px w-full bg-gray-800/60 shrink-0 my-1" />

      <div className="flex flex-col shrink-0 w-full md:w-1/2 lg:w-full justify-between">
        <div>
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-800/80">
            <PieChart className="h-4.5 w-4.5 text-emerald-400" />
            <h3 className="text-sm font-bold text-gray-100 font-sans tracking-tight">Sector Concentration Limits</h3>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
            Aggregated sector weights compared against typical risk concentration boundaries (max 40%).
          </p>
        </div>

        <div className="space-y-3.5">
          {sectors.length === 0 ? (
            <div className="text-center py-6 text-gray-500 font-medium text-xs">
              Log assets to view sector allocation metrics.
            </div>
          ) : (
            sectors.map((sec) => {
              const isOverConcentrated = sec.weight > 40;
              return (
                <div key={sec.name} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-gray-300 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        sec.weight > 40 ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : sec.weight > 25 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                      {sec.name}
                      <span className="text-[9px] text-gray-500 font-normal">({sec.count} assets)</span>
                    </span>
                    <span className="text-gray-400 font-mono">
                      {sec.weight.toFixed(1)}% <span className="text-[10px] text-gray-500">({formatCurrency(sec.marketValue)})</span>
                    </span>
                  </div>

                  <div className="w-full bg-gray-950 border border-gray-800/80 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverConcentrated 
                          ? 'bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]' 
                          : sec.weight > 25 
                          ? 'bg-amber-400' 
                          : 'bg-emerald-500'
                      }`} 
                      style={{ width: `${Math.min(100, sec.weight)}%` }} 
                    />
                  </div>
                  {isOverConcentrated && (
                    <p className="text-[9px] text-rose-400 font-bold tracking-tight">
                      Warning: High concentration limit breached (&gt; 40%). Rebalance suggested.
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
