import React, { useState } from 'react';
import { ShieldCheck, Plus, Radio, AlertTriangle, X, RefreshCw, LogIn } from 'lucide-react';
import { Trade, SECTOR_MAP } from '../types';

interface HeaderProps {
  wsConnected: boolean;
  activeAlerts: Array<{ message: string; timestamp: string; id: string; type: string }>;
  onAddTrade: (trade: Omit<Trade, 'id' | 'timestamp'>) => Promise<void>;
  onClearAlerts: () => void;
}

export default function Header({ wsConnected, activeAlerts, onAddTrade, onClearAlerts }: HeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [symbol, setSymbol] = useState('AAPL');
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill price estimates for convenience
  const handleSymbolChange = (sym: string) => {
    setSymbol(sym);
    let estimatedPrice = '150';
    switch (sym) {
      case 'AAPL': estimatedPrice = '210'; break;
      case 'MSFT': estimatedPrice = '415'; break;
      case 'GOOGL': estimatedPrice = '175'; break;
      case 'NVDA': estimatedPrice = '125'; break;
      case 'TSLA': estimatedPrice = '185'; break;
      case 'AMZN': estimatedPrice = '190'; break;
      case 'META': estimatedPrice = '490'; break;
      case 'JPM': estimatedPrice = '195'; break;
      case 'V': estimatedPrice = '270'; break;
      case 'JNJ': estimatedPrice = '150'; break;
      case 'WMT': estimatedPrice = '65'; break;
      case 'XOM': estimatedPrice = '115'; break;
      case 'DIS': estimatedPrice = '100'; break;
      case 'KO': estimatedPrice = '62'; break;
      case 'SPY': estimatedPrice = '540'; break;
    }
    setPrice(estimatedPrice);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(quantity);
    const priceNum = parseFloat(price);

    if (!symbol || isNaN(qtyNum) || qtyNum <= 0 || isNaN(priceNum) || priceNum <= 0) {
      alert('Please fill out all fields with valid positive numbers.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddTrade({
        symbol,
        type,
        quantity: qtyNum,
        price: priceNum,
      });
      setIsModalOpen(false);
      setQuantity('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <header className="border-b border-gray-800 bg-gray-950/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4" id="app-header">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Logo and Connection Indicator */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-emerald-400">
            <ShieldCheck className="h-6 w-6" id="logo-icon" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100 tracking-tight flex items-center gap-2 font-display">
              QUANT<span className="text-emerald-400">RISK</span>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-900 border border-gray-800 font-mono font-medium text-gray-400">
                PORTFOLIO ENGINE
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Real-Time VaR Historical & Monte Carlo Simulation Engine</p>
          </div>
        </div>

        {/* Live Status and Quick Actions */}
        <div className="flex items-center flex-wrap gap-3 md:self-center">
          {/* WebSocket Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800">
            <Radio className={`h-3.5 w-3.5 ${wsConnected ? 'text-emerald-400 animate-pulse' : 'text-rose-500'}`} />
            <span className="text-xs font-mono font-medium text-gray-300">
              {wsConnected ? 'WS STREAMING' : 'OFFLINE - HTTP'}
            </span>
          </div>

          {/* Quick Trade Execution Trigger */}
          <button
            onClick={() => {
              setIsModalOpen(true);
              handleSymbolChange('AAPL');
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 transition-colors text-gray-950 font-medium text-sm rounded-lg shadow-lg shadow-emerald-500/10 cursor-pointer"
            id="execute-trade-btn"
          >
            <Plus className="h-4 w-4" />
            Log Trade
          </button>
        </div>
      </div>

      {/* Live Warning Alerts Marquee (Displays WebSocket Drawdown / Tick alerts) */}
      {activeAlerts.length > 0 && (
        <div className="mt-3 bg-rose-950/30 border border-rose-500/20 rounded-lg p-2.5 flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5 overflow-hidden text-ellipsis">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 animate-bounce" />
            <div className="text-xs text-rose-300 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-xl md:max-w-4xl">
              <span className="font-bold text-rose-200">ALERT:</span> {activeAlerts[activeAlerts.length - 1].message}
            </div>
            {activeAlerts.length > 1 && (
              <span className="text-[10px] bg-rose-900/50 text-rose-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                +{activeAlerts.length - 1} more
              </span>
            )}
          </div>
          <button
            onClick={onClearAlerts}
            className="text-rose-400 hover:text-rose-200 transition-colors shrink-0"
            title="Dismiss all alerts"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Trade execution modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 relative animate-scale-up" id="trade-modal">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2 font-display">
              <Plus className="h-5 w-5 text-emerald-400" /> Log Portfolio Transaction
            </h3>
            <p className="text-xs text-gray-400 mt-1">Log buy/sell trades to immediately compute real-time Value at Risk statistics.</p>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Asset Symbol</label>
                <select
                  value={symbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                >
                  {Object.keys(SECTOR_MAP).map((sym) => (
                    <option key={sym} value={sym}>
                      {sym} - {SECTOR_MAP[sym].name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Action Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('BUY')}
                      className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        type === 'BUY'
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400'
                          : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      BUY
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('SELL')}
                      className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        type === 'SELL'
                          ? 'bg-rose-950/50 border-rose-500 text-rose-400'
                          : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      SELL
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Quantity (shares)</label>
                  <input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 10"
                    required
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Transaction Price ($ USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Estimated Price"
                    required
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-7 pr-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Pre-filled with estimated current market price.</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 disabled:text-gray-400 transition-colors text-gray-950 font-bold text-sm rounded-lg"
                >
                  {isSubmitting ? 'Logging Trade...' : 'Log Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
