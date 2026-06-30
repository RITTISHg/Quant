import React, { useState } from 'react';
import { 
  Settings, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Palette, 
  AlertTriangle, 
  Sliders, 
  Grid, 
  RotateCcw,
  Layout,
  TableProperties
} from 'lucide-react';
import { UserCustomization } from '../types';

interface DashboardCustomizerProps {
  customization: UserCustomization;
  onChange: (newConfig: UserCustomization) => void;
  onReset: () => void;
}

export default function DashboardCustomizer({ customization, onChange, onReset }: DashboardCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'layout' | 'theme' | 'thresholds' | 'columns'>('layout');

  const updateCustomization = (updater: (prev: UserCustomization) => UserCustomization) => {
    const next = updater(customization);
    onChange(next);
  };

  // Helper to reorder layout list
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const nextOrder = [...customization.layoutOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < nextOrder.length) {
      const temp = nextOrder[index];
      nextOrder[index] = nextOrder[targetIndex];
      nextOrder[targetIndex] = temp;
      updateCustomization(prev => ({ ...prev, layoutOrder: nextOrder }));
    }
  };

  const sectionLabels: Record<string, string> = {
    kpi: 'KPI Highlights Grid',
    charts: 'Risk & Net Asset Value Charts',
    holdings: 'Active Allocation & Exposure Heatmap',
    analytics: 'Simulation Engine & Transaction Ledger',
  };

  return (
    <div className="bg-gray-900/30 border border-gray-800/80 rounded-2xl overflow-hidden transition-all duration-300" id="dashboard-customizer-root">
      {/* Header / Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/10 transition-colors select-none"
        id="customizer-toggle-header"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
            <Settings className={`h-4.5 w-4.5 ${isOpen ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider font-mono">Workspace Customizer Suite</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Toggle widgets, design visual accents, reorder grid positions, and set risk levels</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isOpen ? (
            <span className="text-[10px] text-emerald-400 font-mono font-semibold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-800/50">EXPANDED</span>
          ) : (
            <span className="text-[10px] text-gray-500 font-mono bg-gray-950/60 px-2 py-0.5 rounded border border-gray-800/40">COLLAPSED</span>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-gray-800/60 bg-gray-950/35 p-5 space-y-5 animate-fade-in" id="customizer-body">
          {/* Tabs Navigation */}
          <div className="flex flex-wrap gap-2 border-b border-gray-800/85 pb-3">
            <button
              onClick={() => setActiveTab('layout')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                activeTab === 'layout'
                  ? 'bg-emerald-950/50 border-emerald-500/45 text-emerald-400'
                  : 'bg-gray-900/30 border-transparent text-gray-400 hover:text-gray-200'
              }`}
              id="tab-layout"
            >
              <Layout className="h-3.5 w-3.5" />
              Layout & Widgets
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                activeTab === 'theme'
                  ? 'bg-emerald-950/50 border-emerald-500/45 text-emerald-400'
                  : 'bg-gray-900/30 border-transparent text-gray-400 hover:text-gray-200'
              }`}
              id="tab-theme"
            >
              <Palette className="h-3.5 w-3.5" />
              Theme & Accents
            </button>
            <button
              onClick={() => setActiveTab('thresholds')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                activeTab === 'thresholds'
                  ? 'bg-emerald-950/50 border-emerald-500/45 text-emerald-400'
                  : 'bg-gray-900/30 border-transparent text-gray-400 hover:text-gray-200'
              }`}
              id="tab-thresholds"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Risk Limits
            </button>
            <button
              onClick={() => setActiveTab('columns')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                activeTab === 'columns'
                  ? 'bg-emerald-950/50 border-emerald-500/45 text-emerald-400'
                  : 'bg-gray-900/30 border-transparent text-gray-400 hover:text-gray-200'
              }`}
              id="tab-columns"
            >
              <TableProperties className="h-3.5 w-3.5" />
              Table Columns
            </button>

            <button 
              onClick={onReset}
              className="ml-auto flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono text-gray-500 hover:text-rose-400 transition-colors border border-dashed border-gray-800 hover:border-rose-900/40 rounded"
              title="Reset configuration back to workspace defaults"
              id="btn-reset-customizer"
            >
              <RotateCcw className="h-3 w-3" /> Reset Default
            </button>
          </div>

          {/* Tab Contents */}
          {activeTab === 'layout' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-scale-up">
              {/* Widget Visibility */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-300 flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-emerald-400" /> Active Widgets Control
                </h4>
                
                <div className="space-y-2.5 bg-gray-900/10 border border-gray-850 p-3.5 rounded-xl">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-mono font-bold mb-1">Highlight KPI Summary Cards</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateCustomization(prev => ({
                        ...prev,
                        visibleKPIs: { ...prev.visibleKPIs, portfolioValue: !prev.visibleKPIs.portfolioValue }
                      }))}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        customization.visibleKPIs.portfolioValue 
                          ? 'bg-gray-900/60 border-emerald-800 text-emerald-400' 
                          : 'bg-gray-950/40 border-gray-900 text-gray-500'
                      }`}
                    >
                      <span>Portfolio NAV</span>
                      {customization.visibleKPIs.portfolioValue ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5 text-gray-600" />}
                    </button>
                    <button
                      onClick={() => updateCustomization(prev => ({
                        ...prev,
                        visibleKPIs: { ...prev.visibleKPIs, historicalVaR: !prev.visibleKPIs.historicalVaR }
                      }))}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        customization.visibleKPIs.historicalVaR 
                          ? 'bg-gray-900/60 border-emerald-800 text-emerald-400' 
                          : 'bg-gray-950/40 border-gray-900 text-gray-500'
                      }`}
                    >
                      <span>Historical VaR</span>
                      {customization.visibleKPIs.historicalVaR ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5 text-gray-600" />}
                    </button>
                    <button
                      onClick={() => updateCustomization(prev => ({
                        ...prev,
                        visibleKPIs: { ...prev.visibleKPIs, monteCarloVaR: !prev.visibleKPIs.monteCarloVaR }
                      }))}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        customization.visibleKPIs.monteCarloVaR 
                          ? 'bg-gray-900/60 border-emerald-800 text-emerald-400' 
                          : 'bg-gray-950/40 border-gray-900 text-gray-500'
                      }`}
                    >
                      <span>Monte Carlo VaR</span>
                      {customization.visibleKPIs.monteCarloVaR ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5 text-gray-600" />}
                    </button>
                    <button
                      onClick={() => updateCustomization(prev => ({
                        ...prev,
                        visibleKPIs: { ...prev.visibleKPIs, betaVol: !prev.visibleKPIs.betaVol }
                      }))}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        customization.visibleKPIs.betaVol 
                          ? 'bg-gray-900/60 border-emerald-800 text-emerald-400' 
                          : 'bg-gray-950/40 border-gray-900 text-gray-500'
                      }`}
                    >
                      <span>Beta & Volatility</span>
                      {customization.visibleKPIs.betaVol ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5 text-gray-600" />}
                    </button>
                  </div>

                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-mono font-bold mt-4 mb-1">Primary Grid Panels</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateCustomization(prev => ({
                        ...prev,
                        visiblePanels: { ...prev.visiblePanels, historicalChart: !prev.visiblePanels.historicalChart }
                      }))}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        customization.visiblePanels.historicalChart 
                          ? 'bg-gray-900/60 border-emerald-800 text-emerald-400' 
                          : 'bg-gray-950/40 border-gray-900 text-gray-500'
                      }`}
                    >
                      <span>NAV Area Chart</span>
                      {customization.visiblePanels.historicalChart ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => updateCustomization(prev => ({
                        ...prev,
                        visiblePanels: { ...prev.visiblePanels, monteCarloChart: !prev.visiblePanels.monteCarloChart }
                      }))}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        customization.visiblePanels.monteCarloChart 
                          ? 'bg-gray-900/60 border-emerald-800 text-emerald-400' 
                          : 'bg-gray-950/40 border-gray-900 text-gray-500'
                      }`}
                    >
                      <span>Monte Carlo Walks</span>
                      {customization.visiblePanels.monteCarloChart ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => updateCustomization(prev => ({
                        ...prev,
                        visiblePanels: { ...prev.visiblePanels, positionTable: !prev.visiblePanels.positionTable }
                      }))}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        customization.visiblePanels.positionTable 
                          ? 'bg-gray-900/60 border-emerald-800 text-emerald-400' 
                          : 'bg-gray-950/40 border-gray-900 text-gray-500'
                      }`}
                    >
                      <span>Allocation Table</span>
                      {customization.visiblePanels.positionTable ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => updateCustomization(prev => ({
                        ...prev,
                        visiblePanels: { ...prev.visiblePanels, exposureHeatmap: !prev.visiblePanels.exposureHeatmap }
                      }))}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        customization.visiblePanels.exposureHeatmap 
                          ? 'bg-gray-900/60 border-emerald-800 text-emerald-400' 
                          : 'bg-gray-950/40 border-gray-900 text-gray-500'
                      }`}
                    >
                      <span>Exposure Heatmap</span>
                      {customization.visiblePanels.exposureHeatmap ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => updateCustomization(prev => ({
                        ...prev,
                        visiblePanels: { ...prev.visiblePanels, riskSimulator: !prev.visiblePanels.riskSimulator }
                      }))}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        customization.visiblePanels.riskSimulator 
                          ? 'bg-gray-900/60 border-emerald-800 text-emerald-400' 
                          : 'bg-gray-950/40 border-gray-900 text-gray-500'
                      }`}
                    >
                      <span>Risk Simulator</span>
                      {customization.visiblePanels.riskSimulator ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => updateCustomization(prev => ({
                        ...prev,
                        visiblePanels: { ...prev.visiblePanels, tradeLog: !prev.visiblePanels.tradeLog }
                      }))}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        customization.visiblePanels.tradeLog 
                          ? 'bg-gray-900/60 border-emerald-800 text-emerald-400' 
                          : 'bg-gray-950/40 border-gray-900 text-gray-500'
                      }`}
                    >
                      <span>Transaction Ledger</span>
                      {customization.visiblePanels.tradeLog ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Layout Ordering */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-300 flex items-center gap-2">
                  <Grid className="h-3.5 w-3.5 text-emerald-400" /> Vertical Deck Ordering
                </h4>
                <div className="space-y-2 bg-gray-900/10 border border-gray-850 p-3.5 rounded-xl">
                  <p className="text-[10px] text-gray-400 leading-normal mb-3">
                    Arrange the order of horizontal grids. Move sections up or down to align the components exactly as you need.
                  </p>
                  <div className="space-y-1.5">
                    {customization.layoutOrder.map((sectionId, idx) => (
                      <div 
                        key={sectionId} 
                        className="flex items-center justify-between px-3 py-2 bg-gray-950 border border-gray-850 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-2 font-medium text-gray-200">
                          <span className="w-5 h-5 rounded bg-gray-900 border border-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400 font-mono">
                            {idx + 1}
                          </span>
                          <span>{sectionLabels[sectionId] || sectionId}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveSection(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors cursor-pointer"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(idx, 'down')}
                            disabled={idx === customization.layoutOrder.length - 1}
                            className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors cursor-pointer"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-scale-up">
              {/* Dynamic Branding Accent */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-300 flex items-center gap-2">
                  <Palette className="h-3.5 w-3.5 text-emerald-400" /> Color Accent Selection
                </h4>
                <div className="space-y-3 bg-gray-900/10 border border-gray-850 p-4 rounded-xl">
                  <p className="text-[10px] text-gray-400 leading-normal">
                    Select a distinctive visual theme brand accent. This colors chart lines, icons, primary buttons, and live price flashes.
                  </p>
                  
                  <div className="grid grid-cols-5 gap-2 pt-2">
                    {/* Emerald */}
                    <button
                      onClick={() => updateCustomization(prev => ({ ...prev, colorTheme: 'emerald' }))}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-center ${
                        customization.colorTheme === 'emerald'
                          ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400'
                          : 'bg-gray-950 border-gray-900 text-gray-400 hover:border-gray-800'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500 border border-emerald-300/30 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                      <span className="text-[9px] font-mono uppercase font-bold tracking-tight">Emerald</span>
                    </button>

                    {/* Ocean Blue */}
                    <button
                      onClick={() => updateCustomization(prev => ({ ...prev, colorTheme: 'blue' }))}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-center ${
                        customization.colorTheme === 'blue'
                          ? 'bg-blue-950/20 border-blue-500 text-blue-400'
                          : 'bg-gray-950 border-gray-900 text-gray-400 hover:border-gray-800'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-500 border border-blue-300/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
                      <span className="text-[9px] font-mono uppercase font-bold tracking-tight">Cobalt</span>
                    </button>

                    {/* Sunset Orange/Amber */}
                    <button
                      onClick={() => updateCustomization(prev => ({ ...prev, colorTheme: 'amber' }))}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-center ${
                        customization.colorTheme === 'amber'
                          ? 'bg-amber-950/20 border-amber-500 text-amber-400'
                          : 'bg-gray-950 border-gray-900 text-gray-400 hover:border-gray-800'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-amber-500 border border-amber-300/30 shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                      <span className="text-[9px] font-mono uppercase font-bold tracking-tight">Gold</span>
                    </button>

                    {/* Velvet Violet */}
                    <button
                      onClick={() => updateCustomization(prev => ({ ...prev, colorTheme: 'violet' }))}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-center ${
                        customization.colorTheme === 'violet'
                          ? 'bg-violet-950/20 border-violet-500 text-violet-400'
                          : 'bg-gray-950 border-gray-900 text-gray-400 hover:border-gray-800'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-violet-500 border border-violet-300/30 shadow-[0_0_8px_rgba(139,92,246,0.3)]" />
                      <span className="text-[9px] font-mono uppercase font-bold tracking-tight">Velvet</span>
                    </button>

                    {/* Cyber Rose */}
                    <button
                      onClick={() => updateCustomization(prev => ({ ...prev, colorTheme: 'rose' }))}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-center ${
                        customization.colorTheme === 'rose'
                          ? 'bg-rose-950/20 border-rose-500 text-rose-400'
                          : 'bg-gray-950 border-gray-900 text-gray-400 hover:border-gray-800'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-rose-500 border border-rose-300/30 shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
                      <span className="text-[9px] font-mono uppercase font-bold tracking-tight">Rose</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart Visual Styles */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-300 flex items-center gap-2">
                  <Sliders className="h-3.5 w-3.5 text-emerald-400" /> Chart Rendering Style
                </h4>
                <div className="space-y-3.5 bg-gray-900/10 border border-gray-850 p-4 rounded-xl">
                  <p className="text-[10px] text-gray-400 leading-normal">
                    Change how the Historical Net Asset Value performance chart outputs values on the coordinate system.
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => updateCustomization(prev => ({ ...prev, chartStyle: 'area' }))}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        customization.chartStyle === 'area'
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400'
                          : 'bg-gray-950 border-gray-850 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      Gradient Area
                    </button>
                    <button
                      onClick={() => updateCustomization(prev => ({ ...prev, chartStyle: 'line' }))}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        customization.chartStyle === 'line'
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400'
                          : 'bg-gray-950 border-gray-850 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      Precision Line
                    </button>
                    <button
                      onClick={() => updateCustomization(prev => ({ ...prev, chartStyle: 'bar' }))}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        customization.chartStyle === 'bar'
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400'
                          : 'bg-gray-950 border-gray-855 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      Minimal Bar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'thresholds' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-scale-up">
              {/* Volatility & Beta Alerts */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-300 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-emerald-400" /> Statistical Risk Alerts
                </h4>
                
                <div className="space-y-4 bg-gray-900/10 border border-gray-850 p-4 rounded-xl">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-medium text-gray-300">Max Volatility Threshold</label>
                      <span className="text-xs font-mono font-bold text-emerald-400">{customization.thresholds.maxVolatility.toFixed(2)}% / day</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3.5"
                      step="0.1"
                      value={customization.thresholds.maxVolatility}
                      onChange={(e) => updateCustomization(prev => ({
                        ...prev,
                        thresholds: { ...prev.thresholds, maxVolatility: parseFloat(e.target.value) }
                      }))}
                      className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[8px] text-gray-600 font-mono mt-1">
                      <span>0.5% (Very Safe)</span>
                      <span>3.5% (Extremely Volatile)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-medium text-gray-300">Max Sensitivity Beta Limit</label>
                      <span className="text-xs font-mono font-bold text-emerald-400">β: {customization.thresholds.maxBeta.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.05"
                      value={customization.thresholds.maxBeta}
                      onChange={(e) => updateCustomization(prev => ({
                        ...prev,
                        thresholds: { ...prev.thresholds, maxBeta: parseFloat(e.target.value) }
                      }))}
                      className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[8px] text-gray-600 font-mono mt-1">
                      <span>0.5 (Defensive)</span>
                      <span>2.5 (Aggressive Leveraged)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Absolute VaR Threshold Limits */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-300 flex items-center gap-2">
                  <Sliders className="h-3.5 w-3.5 text-emerald-400" /> Capital-at-Risk Warning Limits
                </h4>
                
                <div className="space-y-4 bg-gray-900/10 border border-gray-850 p-4 rounded-xl">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Historical VaR Max Budget ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono text-gray-500">$</span>
                      <input
                        type="number"
                        min="100"
                        max="100000"
                        step="500"
                        value={customization.thresholds.maxHistoricalVaR}
                        onChange={(e) => updateCustomization(prev => ({
                          ...prev,
                          thresholds: { ...prev.thresholds, maxHistoricalVaR: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full bg-gray-950 border border-gray-850 rounded-lg pl-7 pr-3 py-1.5 text-xs font-mono text-gray-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <span className="text-[8px] text-gray-500 leading-tight block mt-1">Triggers alert glow if 1-day 95% historical potential loss exceeds budget.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Monte Carlo 10-day Risk Cap ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono text-gray-500">$</span>
                      <input
                        type="number"
                        min="500"
                        max="200000"
                        step="500"
                        value={customization.thresholds.maxMonteCarloVaR}
                        onChange={(e) => updateCustomization(prev => ({
                          ...prev,
                          thresholds: { ...prev.thresholds, maxMonteCarloVaR: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full bg-gray-950 border border-gray-850 rounded-lg pl-7 pr-3 py-1.5 text-xs font-mono text-gray-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <span className="text-[8px] text-gray-500 leading-tight block mt-1">Triggers high-priority alerts if 10-day 99% brownian simulations indicate downside beyond limit.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'columns' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-scale-up">
              {/* Position Table Columns */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-300 flex items-center gap-2">
                  <TableProperties className="h-3.5 w-3.5 text-emerald-400" /> Holdings Position Columns
                </h4>
                <div className="space-y-2 bg-gray-900/10 border border-gray-850 p-4 rounded-xl">
                  <p className="text-[10px] text-gray-400 leading-normal mb-3.5">
                    Choose which data attributes are displayed in the main asset holdings table. Unselected columns will be safely removed.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(customization.tableColumns.positions).map(([colId, visible]) => (
                      <button
                        key={colId}
                        onClick={() => updateCustomization(prev => ({
                          ...prev,
                          tableColumns: {
                            ...prev.tableColumns,
                            positions: {
                              ...prev.tableColumns.positions,
                              [colId]: !visible
                            }
                          }
                        }))}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                          visible 
                            ? 'bg-gray-900/60 border-emerald-800 text-emerald-400' 
                            : 'bg-gray-950/40 border-gray-900 text-gray-500'
                        }`}
                      >
                        <span className="capitalize">{colId.replace(/([A-Z])/g, ' $1')}</span>
                        {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ledger Table Columns */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-300 flex items-center gap-2">
                  <TableProperties className="h-3.5 w-3.5 text-emerald-400" /> Transaction Ledger Columns
                </h4>
                <div className="space-y-2 bg-gray-900/10 border border-gray-850 p-4 rounded-xl">
                  <p className="text-[10px] text-gray-400 leading-normal mb-3.5">
                    Select active columns for the transaction history ledger of BUY and SELL logs.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(customization.tableColumns.trades).map(([colId, visible]) => (
                      <button
                        key={colId}
                        onClick={() => updateCustomization(prev => ({
                          ...prev,
                          tableColumns: {
                            ...prev.tableColumns,
                            trades: {
                              ...prev.tableColumns.trades,
                              [colId]: !visible
                            }
                          }
                        }))}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                          visible 
                            ? 'bg-gray-900/60 border-emerald-800 text-emerald-400' 
                            : 'bg-gray-950/40 border-gray-900 text-gray-500'
                        }`}
                      >
                        <span className="capitalize">{colId.replace(/([A-Z])/g, ' $1')}</span>
                        {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
