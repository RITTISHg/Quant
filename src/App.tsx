import React, { useEffect, useState, useRef } from 'react';
import { 
  DollarSign, 
  TrendingDown, 
  ShieldAlert, 
  Percent, 
  Activity, 
  Zap,
  LayoutDashboard,
  Coins
} from 'lucide-react';
import Header from './components/Header';
import MetricCard from './components/MetricCard';
import RiskMetricsPanel from './components/RiskMetricsPanel';
import PositionTable from './components/PositionTable';
import ExposureHeatmap from './components/ExposureHeatmap';
import MonteCarloChart from './components/MonteCarloChart';
import HistoricalPerformanceChart from './components/HistoricalPerformanceChart';
import TradeLogTable from './components/TradeLogTable';
import { DashboardState, Trade } from './types';

// Default mock state for instantaneous loading screen
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

export default function App() {
  const [dashboard, setDashboard] = useState<DashboardState>(INITIAL_DASHBOARD_STATE);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<Array<{ id: string; message: string; timestamp: string; type: string }>>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Fetch initial dashboard state via HTTP REST
  const fetchDashboardState = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (err) {
      console.error('Failed to pre-fetch dashboard state:', err);
    }
  };

  // Setup WebSocket connection
  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Resolve protocol and host dynamically
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    console.log(`Establishing real-time link: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket link connected successfully!');
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
            // Cap to maximum 5 active alerts to prevent clutter
            const filtered = prev.filter(a => a.type !== alertData.alertType);
            return [...filtered, newAlert].slice(-5);
          });
        }
      } catch (err) {
        console.error('Error parsing WebSocket frame:', err);
      }
    };

    ws.onclose = () => {
      console.warn('WebSocket connection lost. Attempting auto-reconnection in 4 seconds...');
      setWsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 4000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket connection error:', err);
      ws.close();
    };
  };

  useEffect(() => {
    // Initial fetch
    fetchDashboardState();

    // Connect WS
    connectWebSocket();

    // HTTP Polling fallback (runs every 10s if WS is disconnected)
    const fallbackTimer = setInterval(() => {
      if (!wsConnected) {
        console.log('WS offline, falling back to HTTP poll...');
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

  // Action: Add manual trade
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
      console.error('Add trade request failed:', err);
    }
  };

  // Action: Delete trade log
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
      console.error('Delete trade request failed:', err);
    }
  };

  // Action: Run custom simulations on-demand
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
      console.error('Custom simulation compute failed:', err);
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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500/25 selection:text-emerald-300" id="app-root">
      {/* Top Header & Alert Banner */}
      <Header 
        wsConnected={wsConnected} 
        activeAlerts={activeAlerts} 
        onAddTrade={handleAddTrade} 
        onClearAlerts={handleClearAlerts} 
      />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Welcome & Dashboard Status Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-gray-900/20 border border-gray-800/50 rounded-2xl px-5 py-3.5" id="status-bar">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4.5 w-4.5 text-emerald-400" />
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
              Risk Dashboard Cockpit
            </h2>
          </div>
          <div className="text-[10px] text-gray-500 font-medium font-mono flex items-center gap-3">
            <span>Last Update: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'N/A'}</span>
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-400 fill-amber-400/10 animate-pulse" /> Live Cache Enabled (Redis Model)
            </span>
          </div>
        </div>

        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="kpi-grid">
          
          {/* Net Asset Value */}
          <MetricCard
            title="Portfolio Value (NAV)"
            value={formatCurrency(metrics.portfolioValue)}
            change={metrics.dailyPL}
            changePercent={metrics.dailyPLPercent}
            icon={DollarSign}
            iconColor="text-emerald-400"
            tooltip="Net Asset Value: Aggregate value of active stock allocations"
          />

          {/* Value at Risk (Hist 95%) */}
          <MetricCard
            title="1d Historical VaR (95%)"
            value={formatCurrency(metrics.historicalVaR95)}
            subValue={`Max 1d loss with 95% confidence`}
            icon={TrendingDown}
            iconColor="text-rose-400"
            tooltip="Value at Risk: Statistically, there is only a 5% chance the portfolio loses more than this in 1 trading day."
          />

          {/* Value at Risk (Monte Carlo 99%) */}
          <MetricCard
            title="10d Monte Carlo VaR (99%)"
            value={formatCurrency(metrics.monteCarloVaR99)}
            subValue={`Systemic 10-day risk horizon`}
            icon={ShieldAlert}
            iconColor="text-amber-400"
            tooltip="Value at Risk (Monte Carlo): Standard 10-day 99% horizon modeling systemic extreme black swan shocks."
          />

          {/* Portfolio Beta / Volatility */}
          <MetricCard
            title="Risk Beta &amp; Volatility"
            value={`β: ${metrics.beta.toFixed(2)}`}
            subValue={`Daily Vol: ${(metrics.volatility * 100).toFixed(2)}%`}
            icon={Activity}
            iconColor="text-blue-400"
            tooltip="Beta measures sensitivity compared to S&P 500 (SPY). Volatility tracks daily return deviations."
          />

        </div>

        {/* Charts Section: Historical NAV vs Monte Carlo Path walks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="charts-grid">
          <HistoricalPerformanceChart data={historicalPerf} />
          <MonteCarloChart paths={monteCarloPaths} />
        </div>

        {/* Active Holdings & Exposure Heatmap Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="holdings-exposure-grid">
          <div className="lg:col-span-8">
            <PositionTable positions={positions} prices={prices} />
          </div>
          <div className="lg:col-span-4">
            <ExposureHeatmap positions={positions} />
          </div>
        </div>

        {/* Risk Panel & Audit Trades Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="risk-ledger-grid">
          <div className="lg:col-span-6">
            <RiskMetricsPanel metrics={metrics} onRunSimulation={handleRunSimulation} />
          </div>
          <div className="lg:col-span-6">
            <TradeLogTable trades={trades} onDeleteTrade={handleDeleteTrade} />
          </div>
        </div>

      </main>

      {/* Footer copyright */}
      <footer className="border-t border-gray-900 bg-gray-950 py-8 px-6 text-center text-xs text-gray-600 font-mono" id="app-footer">
        <p>© 2026 QuantRisk Systems Inc. All calculations processed container-side (Express Engine).</p>
      </footer>
    </div>
  );
}
