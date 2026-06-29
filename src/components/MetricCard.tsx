import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  change?: number;
  changePercent?: number;
  icon: LucideIcon;
  iconColor: string;
  tooltip?: string;
  loading?: boolean;
}

export default function MetricCard({
  title,
  value,
  subValue,
  change,
  changePercent,
  icon: Icon,
  iconColor,
  tooltip,
  loading = false,
}: MetricCardProps) {
  const isPositive = change !== undefined ? change >= 0 : true;

  return (
    <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-5 hover:border-gray-700/60 transition-all flex flex-col justify-between relative group overflow-hidden" id={`metric-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
      {/* Decorative subtle background mesh */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-800/10 to-transparent rounded-full filter blur-xl group-hover:scale-110 transition-transform`} />

      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">{title}</span>
          <div className={`p-2 rounded-xl bg-gray-950/60 border border-gray-800 ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        {/* Main Value */}
        <div className="mt-1">
          {loading ? (
            <div className="h-8 w-2/3 bg-gray-800 rounded animate-pulse" />
          ) : (
            <span className="text-2xl font-bold font-mono text-gray-100 tracking-tight">
              {value}
            </span>
          )}
        </div>
      </div>

      {/* Sub Value / Percentage Trend */}
      <div className="mt-4 flex items-center gap-1.5 min-h-[20px]">
        {loading ? (
          <div className="h-3.5 w-1/2 bg-gray-800 rounded animate-pulse" />
        ) : change !== undefined && changePercent !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-semibold font-mono px-2 py-0.5 rounded-md ${
                isPositive 
                  ? 'bg-emerald-950/45 text-emerald-400 border border-emerald-500/10' 
                  : 'bg-rose-950/45 text-rose-400 border border-rose-500/10'
              }`}
            >
              {isPositive ? '+' : ''}
              {changePercent.toFixed(2)}%
            </span>
            <span className={`text-xs font-medium font-mono ${isPositive ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
              {isPositive ? '+' : ''}
              {typeof change === 'number' && change.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-gray-500 font-medium">TODAY</span>
          </div>
        ) : subValue ? (
          <span className="text-xs font-semibold font-mono text-gray-400 flex items-center gap-1">
            {subValue}
          </span>
        ) : null}
      </div>

      {/* Interactive Tooltip helper */}
      {tooltip && (
        <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-300">
          <span className="text-[9px] font-mono text-gray-500 bg-gray-950/80 px-1.5 py-0.5 rounded border border-gray-800/50">
            {tooltip}
          </span>
        </div>
      )}
    </div>
  );
}
