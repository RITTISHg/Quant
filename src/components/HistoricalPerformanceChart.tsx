import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AreaChart as ChartIcon, Calendar } from 'lucide-react';
import { HistoricalPerformance } from '../types';

interface HistoricalPerformanceChartProps {
  data: HistoricalPerformance[];
  colorTheme?: 'emerald' | 'blue' | 'amber' | 'violet' | 'rose';
  chartStyle?: 'area' | 'line' | 'bar';
}

const PALETTE = {
  emerald: { primary: '#10b981', secondary: '#3b82f6', textClass: 'text-emerald-400' },
  blue: { primary: '#3b82f6', secondary: '#a855f7', textClass: 'text-blue-400' },
  amber: { primary: '#f59e0b', secondary: '#f43f5e', textClass: 'text-amber-400' },
  violet: { primary: '#8b5cf6', secondary: '#10b981', textClass: 'text-violet-400' },
  rose: { primary: '#f43f5e', secondary: '#06b6d4', textClass: 'text-rose-400' },
};

export default function HistoricalPerformanceChart({ 
  data, 
  colorTheme = 'emerald', 
  chartStyle = 'area' 
}: HistoricalPerformanceChartProps) {
  
  const colors = PALETTE[colorTheme] || PALETTE.emerald;

  const formatCurrency = (val: any) => {
    if (typeof val !== 'number') return val;
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const pl = payload[1]?.value || 0;
      const isPositive = pl >= 0;

      return (
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 shadow-xl font-mono text-xs text-gray-300">
          <div className="font-bold border-b border-gray-800 pb-1.5 mb-1.5 text-gray-200 flex items-center gap-1">
            <Calendar className={`h-3.5 w-3.5 ${colors.textClass}`} />
            {label}
          </div>
          <div className="space-y-1">
            <div className="text-gray-400">
              Total NAV: <span className="text-gray-100 font-bold">{formatCurrency(value)}</span>
            </div>
            <div className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
              Cumulative P&L:{' '}
              <span className="font-bold">
                {isPositive ? '+' : ''}
                {formatCurrency(pl)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (chartStyle === 'line') {
      return (
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
          <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
          <YAxis 
            stroke="#6b7280" 
            fontSize={10} 
            tickLine={false} 
            domain={['auto', 'auto']}
            tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Line name="Portfolio NAV" type="monotone" dataKey="value" stroke={colors.primary} strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
          <Line name="Total P&L" type="monotone" dataKey="pl" stroke={colors.secondary} strokeWidth={1.5} dot={{ r: 2 }} />
        </LineChart>
      );
    }

    if (chartStyle === 'bar') {
      return (
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
          <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
          <YAxis 
            stroke="#6b7280" 
            fontSize={10} 
            tickLine={false} 
            domain={['auto', 'auto']}
            tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar name="Portfolio NAV" dataKey="value" fill={colors.primary} radius={[4, 4, 0, 0]} maxBarSize={30} />
          <Bar name="Total P&L" dataKey="pl" fill={colors.secondary} radius={[2, 2, 0, 0]} maxBarSize={20} />
        </BarChart>
      );
    }

    // Default: 'area'
    return (
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.primary} stopOpacity={0.25} />
            <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.secondary} stopOpacity={0.15} />
            <stop offset="95%" stopColor={colors.secondary} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
        <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
        <YAxis 
          stroke="#6b7280" 
          fontSize={10} 
          tickLine={false}
          domain={['auto', 'auto']}
          tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area name="Portfolio NAV" type="monotone" dataKey="value" stroke={colors.primary} strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
        <Area name="Total P&L" type="monotone" dataKey="pl" stroke={colors.secondary} strokeWidth={1.5} fillOpacity={1} fill="url(#colorPL)" />
      </AreaChart>
    );
  };

  return (
    <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6" id="historical-chart-section">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800/80">
        <div className="flex items-center gap-2">
          <ChartIcon className={`h-4.5 w-4.5 ${colors.textClass}`} />
          <h3 className="text-sm font-bold text-gray-100 font-display tracking-tight">Historical Net Asset Value (NAV)</h3>
        </div>
        <span className="text-xs font-mono text-gray-500 font-medium">
          Trailing 15 trading periods
        </span>
      </div>

      <div className="w-full h-[280px]">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium text-xs">
            No historical data. Log trades to begin tracking performance.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
