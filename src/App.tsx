import React, { useEffect, useState, useRef } from 'react';
import { 
  DollarSign, 
  TrendingDown, 
  ShieldAlert, 
  Activity, 
  Zap,
  LayoutDashboard
} from 'lucide-react';
import Header from './components/Header';
import MetricCard from './components/MetricCard';
import RiskMetricsPanel from './components/RiskMetricsPanel';
import PositionTable from './components/PositionTable';
import ExposureHeatmap from './components/ExposureHeatmap';
import MonteCarloChart from './components/MonteCarloChart';
import HistoricalPerformanceChart from './components/HistoricalPerformanceChart';
import TradeLogTable from './components/TradeLogTable';
import DashboardCustomizer from './components/DashboardCustomizer';
import { DashboardState, Trade, UserCustomization } from './types';

const INITIAL_DASHBOARD_STATE: DashboardState = {
  trades: [],
  positions: [],
  prices: {},
  metrics: {
    portfolioValue: 0,
    totalCost: 0,
    totalPL: 0,
    totalPLPercent: 0,
    dailyPL: 0,
    dailyPLPercent: 0,
    historicalVaR95: 0,
    historicalVaR99: 0,
    monteCarloVaR95: 0,
    monteCarloVaR99: 0,
    maxDrawdown: 1.85,
    volatility: 0.012,
    beta: 1.0,
  },
  monteCarloPaths: [],
  historicalPerf: [],
  lastUpdate: '',
  isSimulating: false,
};

const LOCAL_STORAGE_KEY = 'quantrisk_user_customization';

const DEFAULT_CUSTOMIZATION: UserCustomization = {
  visibleKPIs: {
    portfolioValue: true,
    historicalVaR: true,
    monteCarloVaR: true,
    betaVol: true,
  },
  visiblePanels: {
    historicalChart: true,
    monteCarloChart: true,
    positionTable: true,
    exposureHeatmap: true,
    riskSimulator: true,
    tradeLog: true,
  },
  layoutOrder: ['kpi', 'charts', 'holdings', 'analytics'],
  colorTheme: 'emerald',
  chartStyle: 'area',
  thresholds: {
    maxVolatility: 1.5,
    maxBeta: 1.2,
    maxHistoricalVaR: 10000,
    maxMonteCarloVaR: 18000,
  },
  tableColumns: {
    positions: {
      sector: true,
      shares: true,
      costBasis: true,
      currentPrice: true,
      weight: true,
      unrealizedPL: true,
    },
    trades: {
      dateTime: true,
      shares: true,
      price: true,
      outlay: true,
    }
  }
};

const ACCENT_TEXT_MAP = {
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
  amber: 'text-amber-400',
  violet: 'text-violet-400',
  rose: 'text-rose-400',
};

export default function App() {
  const [dashboard, setDashboard] = useState<DashboardState>(INITIAL_DASHBOARD_STATE);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<Array<{ id: string; message: string; timestamp: string; type: string }>>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Initialize customization state from localStorage
  const [customization, setCustomization] = useState<UserCustomization>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CUSTOMIZATION,
          ...parsed,
          visibleKPIs: { ...DEFAULT_CUSTOMIZATION.visibleKPIs, ...parsed.visibleKPIs },
          visiblePanels: { ...DEFAULT_CUSTOMIZATION.visiblePanels, ...parsed.visiblePanels },
          thresholds: { ...DEFAULT_CUSTOMIZATION.thresholds, ...parsed.thresholds },
          tableColumns: {
            positions: { ...DEFAULT_CUSTOMIZATION.tableColumns.positions, ...parsed.tableColumns?.positions },
            trades: { ...DEFAULT_CUSTOMIZATION.tableColumns.trades, ...parsed.tableColumns?.trades },
          }
        };
      }
    } catch (e) {
      console.error('Failed to load user customization from local storage', e);
    }
    return DEFAULT_CUSTOMIZATION;
  });

  const handleCustomizationChange = (newConfig: UserCustomization) => {
    setCustomization(newConfig);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetCustomization = () => {
    setCustomization(DEFAULT_CUSTOMIZATION);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDashboardState = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'INITIAL_STATE' || msg.type === 'STATE_UPDATE') {
          setDashboard(msg.payload);
        } else if (msg.type === 'ALERT') {
          const alertData = msg.payload;
          const newAlert = {
            id: alertData.timestamp + '-' + Math.random().toString(36).substr(2, 4),
            message: alertData.message,
            timestamp: alertData.timestamp,
            type: alertData.alertType,
          };
          setActiveAlerts(prev => {
            const filtered = prev.filter(a => a.type !== alertData.alertType);
            return [...filtered, newAlert].slice(-5);
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 4000);
    };

    ws.onerror = () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  };

  useEffect(() => {
    fetchDashboardState();
    connectWebSocket();

    const fallbackTimer = setInterval(() => {
      if (!wsConnected) {
        fetchDashboardState();
      }
    }, 10000);

    return () => {
      clearInterval(fallbackTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [wsConnected]);

  const handleAddTrade = async (tradeData: Omit<Trade, 'id' | 'timestamp'>) => {
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData),
      });
      if (res.ok) {
        const updatedDashboard = await res.json();
        setDashboard(updatedDashboard);
      } else {
        const errData = await res.json();
        alert(`Failed to add trade: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTrade = async (id: string) => {
    try {
      const res = await fetch(`/api/trades/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const updatedDashboard = await res.json();
        setDashboard(updatedDashboard);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunSimulation = async (config: { confidenceLevel: number; numSimulations: number; days: number }) => {
    try {
      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const handleClearAlerts = () => {
    setActiveAlerts([]);
  };

  const { metrics, positions, prices, trades, monteCarloPaths, historicalPerf, lastUpdate } = dashboard;

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  };

  const themeText = ACCENT_TEXT_MAP[customization.colorTheme] || ACCENT_TEXT_MAP.emerald;

  const renderLayoutSection = (sectionId: string) => {
    switch (sectionId) {
      case 'kpi': {
        const hasVisibleKPI = Object.values(customization.visibleKPIs).some(Boolean);
        if (!hasVisibleKPI) return null;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-scale-up" id="kpi-grid" key="section-kpi">
            {customization.visibleKPIs.portfolioValue && (
              <MetricCard
                title="Portfolio Value (NAV)"
                value={formatCurrency(metrics.portfolioValue)}
                change={metrics.dailyPL}
                changePercent={metrics.dailyPLPercent}
                icon={DollarSign}
                iconColor={themeText}
                tooltip="Net Asset Value: Aggregate value of active stock allocations"
              />
            )}

            {customization.visibleKPIs.historicalVaR && (
              <MetricCard
                title="1d Historical VaR (95%)"
                value={formatCurrency(metrics.historicalVaR95)}
                subValue={`Max 1d loss with 95% confidence`}
                icon={TrendingDown}
                iconColor="text-rose-400"
                tooltip="Value at Risk: Statistically, there is only a 5% chance the portfolio loses more than this in 1 trading day."
                isTriggeredAlert={metrics.historicalVaR95 > customization.thresholds.maxHistoricalVaR}
              />
            )}

            {customization.visibleKPIs.monteCarloVaR && (
              <MetricCard
                title="10d Monte Carlo VaR (99%)"
                value={formatCurrency(metrics.monteCarloVaR99)}
                subValue={`Systemic 10-day risk horizon`}
                icon={ShieldAlert}
                iconColor="text-amber-400"
                tooltip="Value at Risk (Monte Carlo): Standard 10-day 99% horizon modeling systemic extreme black swan shocks."
                isTriggeredAlert={metrics.monteCarloVaR99 > customization.thresholds.maxMonteCarloVaR}
              />
            )}

            {customization.visibleKPIs.betaVol && (
              <MetricCard
                title="Risk Beta &amp; Volatility"
                value={`β: ${metrics.beta.toFixed(2)}`}
                subValue={`Daily Vol: ${(metrics.volatility * 100).toFixed(2)}%`}
                icon={Activity}
                iconColor="text-blue-400"
                tooltip="Beta measures sensitivity compared to S&P 500 (SPY). Volatility tracks daily return deviations."
                isTriggeredAlert={(metrics.volatility * 100) > customization.thresholds.maxVolatility || metrics.beta > customization.thresholds.maxBeta}
              />
            )}
          </div>
        );
      }

      case 'charts': {
        const showHistorical = customization.visiblePanels.historicalChart;
        const showMonteCarlo = customization.visiblePanels.monteCarloChart;
        if (!showHistorical && !showMonteCarlo) return null;
        return (
          <div 
            className={`grid grid-cols-1 gap-6 animate-scale-up ${
              showHistorical && showMonteCarlo ? 'lg:grid-cols-2' : 'lg:grid-cols-1'
            }`} 
            id="charts-grid"
            key="section-charts"
          >
            {showHistorical && (
              <HistoricalPerformanceChart 
                data={historicalPerf} 
                colorTheme={customization.colorTheme}
                chartStyle={customization.chartStyle}
              />
            )}
            {showMonteCarlo && <MonteCarloChart paths={monteCarloPaths} />}
          </div>
        );
      }

      case 'holdings': {
        const showPositions = customization.visiblePanels.positionTable;
        const showExposure = customization.visiblePanels.exposureHeatmap;
        if (!showPositions && !showExposure) return null;
        return (
          <div 
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scale-up" 
            id="holdings-exposure-grid"
            key="section-holdings"
          >
            {showPositions && (
              <div className={showExposure ? 'lg:col-span-8' : 'lg:col-span-12'}>
                <PositionTable 
                  positions={positions} 
                  prices={prices} 
                  columns={customization.tableColumns.positions}
                  colorTheme={customization.colorTheme}
                />
              </div>
            )}
            {showExposure && (
              <div className={showPositions ? 'lg:col-span-4' : 'lg:col-span-12'}>
                <ExposureHeatmap positions={positions} />
              </div>
            )}
          </div>
        );
      }

      case 'analytics': {
        const showSimulator = customization.visiblePanels.riskSimulator;
        const showTrades = customization.visiblePanels.tradeLog;
        if (!showSimulator && !showTrades) return null;
        return (
          <div 
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scale-up" 
            id="risk-ledger-grid"
            key="section-analytics"
          >
            {showSimulator && (
              <div className={showTrades ? 'lg:col-span-6' : 'lg:col-span-12'}>
                <RiskMetricsPanel metrics={metrics} onRunSimulation={handleRunSimulation} />
              </div>
            )}
            {showTrades && (
              <div className={showSimulator ? 'lg:col-span-6' : 'lg:col-span-12'}>
                <TradeLogTable 
                  trades={trades} 
                  onDeleteTrade={handleDeleteTrade} 
                  columns={customization.tableColumns.trades}
                  colorTheme={customization.colorTheme}
                />
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500/25 selection:text-emerald-300" id="app-root">
      <Header 
        wsConnected={wsConnected} 
        activeAlerts={activeAlerts} 
        onAddTrade={handleAddTrade} 
        onClearAlerts={handleClearAlerts} 
      />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Cockpit Status Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-gray-900/20 border border-gray-800/50 rounded-2xl px-5 py-3.5" id="status-bar">
          <div className="flex items-center gap-2">
            <LayoutDashboard className={`h-4.5 w-4.5 ${themeText}`} />
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
              Risk Dashboard Cockpit
            </h2>
          </div>
          <div className="text-[10px] text-gray-500 font-medium font-mono flex items-center gap-3">
            <span>Last Update: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'N/A'}</span>
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-400 fill-amber-400/10 animate-pulse" /> Live Cache Enabled
            </span>
          </div>
        </div>

        {/* Customized Settings panel */}
        <DashboardCustomizer 
          customization={customization}
          onChange={handleCustomizationChange}
          onReset={handleResetCustomization}
        />

        {/* Dynamic Horizontal Ordered Layout Deck */}
        {customization.layoutOrder.map(renderLayoutSection)}

      </main>

      <footer className="border-t border-gray-900 bg-gray-950 py-8 px-6 text-center text-xs text-gray-600 font-mono" id="app-footer">
        <p>© 2026 QuantRisk Systems Inc. All calculations processed container-side.</p>
      </footer>
    </div>
  );
}
