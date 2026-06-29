import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Sparkles, HelpCircle } from 'lucide-react';
import { MonteCarloPath } from '../types';

interface MonteCarloChartProps {
  paths: MonteCarloPath[];
}

export default function MonteCarloChart({ paths }: MonteCarloChartProps) {
  const formatCurrency = (val: any) => {
    if (typeof val !== 'number') return val;
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 shadow-xl font-mono text-xs text-gray-300">
          <div className="font-bold border-b border-gray-800 pb-1.5 mb-1.5 text-gray-200">Day {label} Simulation</div>
          <div className="space-y-1">
            <div className="text-emerald-400">95th Percentile (Best): {formatCurrency(payload.find((p: any) => p.dataKey === 'percentile95')?.value)}</div>
            <div className="text-white">Median Projection: {formatCurrency(payload.find((p: any) => p.dataKey === 'median')?.value)}</div>
            <div className="text-rose-400 font-bold">5th Percentile (VaR Boundary): {formatCurrency(payload.find((p: any) => p.dataKey === 'percentile5')?.value)}</div>
            
            <div className="border-t border-gray-800 pt-1.5 mt-1.5 text-[10px] text-gray-500">
              Sample Paths:
              <div className="grid grid-cols-2 gap-x-2 mt-1 font-normal">
                <div>Path 1: {formatCurrency(payload.find((p: any) => p.dataKey === 'path0')?.value)}</div>
                <div>Path 2: {formatCurrency(payload.find((p: any) => p.dataKey === 'path1')?.value)}</div>
                <div>Path 3: {formatCurrency(payload.find((p: any) => p.dataKey === 'path2')?.value)}</div>
                <div>Path 4: {formatCurrency(payload.find((p: any) => p.dataKey === 'path3')?.value)}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6" id="monte-carlo-chart-section">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800/80">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
          <h3 className="text-sm font-bold text-gray-100 font-display tracking-tight">Monte Carlo 10-Day Brownian Walks</h3>
        </div>
        <div className="flex items-center gap-1.5 group cursor-help relative">
          <HelpCircle className="h-4 w-4 text-gray-500" />
          <span className="text-xs text-gray-500 font-medium">Geometric Brownian Motion</span>
          
          <div className="absolute right-0 top-6 w-64 bg-gray-950 border border-gray-800 rounded-xl p-3 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-10 text-[10px] text-gray-400 leading-normal">
            Displays 5 randomized asset return combinations along with the calculated worst-case 5th percentile boundary over a 10-day holding horizon.
          </div>
        </div>
      </div>

      <div className="w-full h-[280px]">
        {paths.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium text-xs">
            No simulation data. Run simulation to compute paths.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={paths} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
              
              <XAxis 
                dataKey="day" 
                stroke="#6b7280" 
                fontSize={10} 
                tickLine={false} 
                tickFormatter={(val) => `Day ${val}`}
              />
              
              <YAxis 
                stroke="#6b7280" 
                fontSize={10} 
                tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconSize={10} 
                fontSize={11}
                wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
              />

              {/* Statistical Bounds */}
              <Line 
                name="Best Case (95%)" 
                type="monotone" 
                dataKey="percentile95" 
                stroke="#34d399" 
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false} 
              />
              <Line 
                name="Median Path" 
                type="monotone" 
                dataKey="median" 
                stroke="#e5e7eb" 
                strokeWidth={2}
                dot={false} 
              />
              <Line 
                name="Worst Case (5% VaR Limit)" 
                type="monotone" 
                dataKey="percentile5" 
                stroke="#f43f5e" 
                strokeWidth={2.5}
                dot={false} 
              />

              {/* Faint Sample Random Paths */}
              <Line type="monotone" dataKey="path0" stroke="#60a5fa" strokeWidth={1} opacity={0.25} dot={false} legendType="none" />
              <Line type="monotone" dataKey="path1" stroke="#a78bfa" strokeWidth={1} opacity={0.25} dot={false} legendType="none" />
              <Line type="monotone" dataKey="path2" stroke="#2dd4bf" strokeWidth={1} opacity={0.25} dot={false} legendType="none" />
              <Line type="monotone" dataKey="path3" stroke="#f59e0b" strokeWidth={1} opacity={0.25} dot={false} legendType="none" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
