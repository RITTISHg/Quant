import React, { useState } from 'react';
import { Play, TrendingDown, Cpu, Sparkles } from 'lucide-react';
import { RiskMetrics } from '../types';

interface RiskMetricsPanelProps {
  metrics: RiskMetrics;
  onRunSimulation: (config: { confidenceLevel: number; numSimulations: number; days: number }) => Promise<any>;
}

export default function RiskMetricsPanel({ metrics, onRunSimulation }: RiskMetricsPanelProps) {
  const [confidence, setConfidence] = useState(0.95);
  const [days, setDays] = useState(10);
  const [sims, setSims] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [customResult, setCustomResult] = useState<{ varAmount: number; days: number; confidenceLevel: number } | null>(null);

  const handleCustomSimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await onRunSimulation({
        confidenceLevel: confidence,
        numSimulations: sims,
        days: days,
      });
      setCustomResult({
        varAmount: res.varAmount,
        days: res.days,
        confidenceLevel: res.confidenceLevel,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  };

  const hist95Percent = metrics.portfolioValue > 0 ? (metrics.historicalVaR95 / metrics.portfolioValue) * 100 : 0;
  const hist99Percent = metrics.portfolioValue > 0 ? (metrics.historicalVaR99 / metrics.portfolioValue) * 100 : 0;
  const mc95Percent = metrics.portfolioValue > 0 ? (metrics.monteCarloVaR95 / metrics.portfolioValue) * 100 : 0;
  const mc99Percent = metrics.portfolioValue > 0 ? (metrics.monteCarloVaR99 / metrics.portfolioValue) * 100 : 0;

  const getRiskColor = (pct: number) => {
    if (pct < 3.5) return 'bg-emerald-500';
    if (pct < 8.5) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6 flex flex-col justify-between" id="risk-metrics-panel">
      <div>
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Cpu className="h-4.5 w-4.5 text-emerald-400" />
            <h3 className="text-sm font-bold text-gray-100 font-display tracking-tight">Quantitative VaR Analysis</h3>
          </div>
          <span className="text-[10px] bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded font-mono font-medium">
            LIVE COMPILING
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div className="bg-gray-950/50 border border-gray-800/60 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-gray-300 tracking-wider uppercase">Historical Simulation</h4>
                <TrendingDown className="h-4 w-4 text-emerald-500/80" />
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
                Examines actual daily return distributions of your current assets over the past 90 days. Replays historical events directly to find empirical loss thresholds.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400 font-medium">1-Day VaR (95%)</span>
                  <span className="font-mono font-bold text-gray-200">{formatCurrency(metrics.historicalVaR95)}</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full ${getRiskColor(hist95Percent)} rounded-full`} style={{ width: `${Math.min(100, hist95Percent * 5)}%` }} />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-gray-500 mt-1">
                  <span>Exposure: {hist95Percent.toFixed(2)}%</span>
                  <span>Low Risk &lt; 3.5%</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400 font-medium">1-Day VaR (99%)</span>
                  <span className="font-mono font-bold text-gray-200">{formatCurrency(metrics.historicalVaR99)}</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full ${getRiskColor(hist99Percent)} rounded-full`} style={{ width: `${Math.min(100, hist99Percent * 5)}%` }} />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-gray-500 mt-1">
                  <span>Exposure: {hist99Percent.toFixed(2)}%</span>
                  <span>Extreme Limit</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-950/50 border border-gray-800/60 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-gray-300 tracking-wider uppercase">Monte Carlo Method</h4>
                <Sparkles className="h-4 w-4 text-amber-400/80" />
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
                Models future paths using Geometric Brownian Motion. Generates correlated multi-asset return simulations utilizing Cholesky Decomposition of the historical covariance.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400 font-medium">10-Day VaR (95%)</span>
                  <span className="font-mono font-bold text-gray-200">{formatCurrency(metrics.monteCarloVaR95)}</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full ${getRiskColor(mc95Percent)} rounded-full`} style={{ width: `${Math.min(100, mc95Percent * 3)}%` }} />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-gray-500 mt-1">
                  <span>Exposure: {mc95Percent.toFixed(2)}%</span>
                  <span>10d Holding</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400 font-medium">10-Day VaR (99%)</span>
                  <span className="font-mono font-bold text-gray-200">{formatCurrency(metrics.monteCarloVaR99)}</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full ${getRiskColor(mc99Percent)} rounded-full`} style={{ width: `${Math.min(100, mc99Percent * 3)}%` }} />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-gray-500 mt-1">
                  <span>Exposure: {mc99Percent.toFixed(2)}%</span>
                  <span>Systemic Risk Cap</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800/80 pt-5 mt-4">
        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Play className="h-3.5 w-3.5 text-emerald-400 fill-emerald-500/20" /> Run Custom Simulation Path
        </h4>
        
        <form onSubmit={handleCustomSimSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Holding Period</label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
            >
              <option value={1}>1 Day</option>
              <option value={5}>5 Days (1 Week)</option>
              <option value={10}>10 Days (2 Weeks)</option>
              <option value={20}>20 Days (1 Month)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Confidence Interval</label>
            <select
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
            >
              <option value={0.90}>90% Confidence</option>
              <option value={0.95}>95% Confidence</option>
              <option value={0.99}>99% Confidence</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Simulations Run</label>
            <select
              value={sims}
              onChange={(e) => setSims(parseInt(e.target.value))}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
            >
              <option value={250}>250 runs</option>
              <option value={500}>500 runs</option>
              <option value={1000}>1,000 runs (Refined)</option>
              <option value={2000}>2,000 runs (High-Fi)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-1.5 px-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 transition-all text-emerald-400 font-bold text-xs rounded-lg border border-gray-700/60 hover:border-emerald-500/30 flex items-center justify-center gap-1.5 h-[32px] cursor-pointer"
          >
            {loading ? 'Simulating...' : 'Run Engine'}
          </button>
        </form>

        {customResult && (
          <div className="mt-4 p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-spin" />
              <span className="text-gray-300 font-medium">
                Custom {customResult.days}-day {customResult.confidenceLevel * 100}% Monte Carlo VaR:
              </span>
            </div>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {formatCurrency(customResult.varAmount)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
