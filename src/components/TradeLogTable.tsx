import React from 'react';
import { History, Trash2, ShieldAlert } from 'lucide-react';
import { Trade } from '../types';

interface TradeLogTableProps {
  trades: Trade[];
  onDeleteTrade: (id: string) => Promise<void>;
}

export default function TradeLogTable({ trades, onDeleteTrade }: TradeLogTableProps) {
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6" id="trade-log-ledger-card">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800/80">
        <div className="flex items-center gap-2">
          <History className="h-4.5 w-4.5 text-emerald-400" />
          <h3 className="text-sm font-bold text-gray-100 font-display tracking-tight">Audit Ledger &amp; Trade History</h3>
        </div>
        <span className="text-xs font-mono text-gray-500 font-medium">
          {trades.length} historical logs
        </span>
      </div>

      <div className="overflow-y-auto max-h-[380px] pr-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 bg-gray-950 z-10 py-2">
              <th className="pb-3 pl-2">Date / Time</th>
              <th className="pb-3">Asset</th>
              <th className="pb-3 text-center">Action</th>
              <th className="pb-3 text-right">Shares</th>
              <th className="pb-3 text-right">Execution Price</th>
              <th className="pb-3 text-right">Total Outlay</th>
              <th className="pb-3 text-center pr-2">Revert</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/30 text-xs">
            {sortedTrades.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500 font-medium">
                  No trade logs found. Log transactions above to begin auditing.
                </td>
              </tr>
            ) : (
              sortedTrades.map((t) => {
                const totalOutlay = t.quantity * t.price;
                const isBuy = t.type === 'BUY';

                return (
                  <tr key={t.id} className="hover:bg-gray-800/20 transition-colors group" id={`trade-row-${t.id}`}>
                    <td className="py-3 pl-2 font-mono text-gray-400">
                      {formatDate(t.timestamp)}
                    </td>

                    <td className="py-3 font-bold text-gray-200">
                      {t.symbol}
                    </td>

                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[9px] border ${
                        isBuy 
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/10' 
                          : 'bg-rose-950/40 text-rose-400 border-rose-500/10'
                      }`}>
                        {t.type}
                      </span>
                    </td>

                    <td className="py-3 text-right font-mono font-medium text-gray-300">
                      {t.quantity.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                    </td>

                    <td className="py-3 text-right font-mono text-gray-400">
                      {formatCurrency(t.price)}
                    </td>

                    <td className="py-3 text-right font-mono font-semibold text-gray-200">
                      {formatCurrency(totalOutlay)}
                    </td>

                    <td className="py-3 text-center pr-2">
                      <button
                        onClick={() => onDeleteTrade(t.id)}
                        className="p-1 text-gray-500 hover:text-rose-400 rounded transition-colors group-hover:opacity-100 duration-200 cursor-pointer"
                        title="Revert trade entry"
                        id={`delete-trade-${t.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500 font-medium p-2.5 bg-gray-950/40 border border-gray-800/40 rounded-xl">
        <ShieldAlert className="h-3.5 w-3.5 text-amber-500/60 shrink-0" />
        <span>Reverting a transaction will immediately adjust asset allocations, weights, and run Monte Carlo simulations.</span>
      </div>
    </div>
  );
}
