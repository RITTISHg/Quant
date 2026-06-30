import React from 'react';
import { History, Trash2, ShieldAlert } from 'lucide-react';
import { Trade, UserCustomization } from '../types';

interface TradeLogTableProps {
  trades: Trade[];
  onDeleteTrade: (id: string) => Promise<void>;
  columns?: UserCustomization['tableColumns']['trades'];
  colorTheme?: UserCustomization['colorTheme'];
}

const COLOR_TEXT = {
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
  amber: 'text-amber-400',
  violet: 'text-violet-400',
  rose: 'text-rose-400',
};

export default function TradeLogTable({ 
  trades, 
  onDeleteTrade,
  columns = {
    dateTime: true,
    shares: true,
    price: true,
    outlay: true,
  },
  colorTheme = 'emerald'
}: TradeLogTableProps) {
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const themeText = COLOR_TEXT[colorTheme] || COLOR_TEXT.emerald;

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

  // Compute active columns count for correct empty table span
  const colSpanCount = 3 + 
    (columns.dateTime ? 1 : 0) + 
    (columns.shares ? 1 : 0) + 
    (columns.price ? 1 : 0) + 
    (columns.outlay ? 1 : 0);

  return (
    <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6 h-full flex flex-col justify-between" id="trade-log-ledger-card">
      <div>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800/80">
          <div className="flex items-center gap-2">
            <History className={`h-4.5 w-4.5 ${themeText}`} />
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
                {columns.dateTime && <th className="pb-3 pl-2 hidden sm:table-cell">Date / Time</th>}
                <th className="pb-3">Asset</th>
                <th className="pb-3 text-center">Action</th>
                {columns.shares && <th className="pb-3 text-right">Shares</th>}
                {columns.price && <th className="pb-3 text-right hidden md:table-cell">Execution Price</th>}
                {columns.outlay && <th className="pb-3 text-right">Total Outlay</th>}
                <th className="pb-3 text-center pr-2">Revert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30 text-xs">
              {sortedTrades.length === 0 ? (
                <tr>
                  <td colSpan={colSpanCount} className="text-center py-8 text-gray-500 font-medium">
                    No trade logs found. Log transactions above to begin auditing.
                  </td>
                </tr>
              ) : (
                sortedTrades.map((t) => {
                  const totalOutlay = t.quantity * t.price;
                  const isBuy = t.type === 'BUY';

                  return (
                    <tr key={t.id} className="hover:bg-gray-800/20 transition-colors group" id={`trade-row-${t.id}`}>
                      {columns.dateTime && (
                        <td className="py-3 pl-2 font-mono text-gray-400 hidden sm:table-cell">
                          {formatDate(t.timestamp)}
                        </td>
                      )}

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

                      {columns.shares && (
                        <td className="py-3 text-right font-mono font-medium text-gray-300">
                          {t.quantity.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                        </td>
                      )}

                      {columns.price && (
                        <td className="py-3 text-right font-mono text-gray-400 hidden md:table-cell">
                          {formatCurrency(t.price)}
                        </td>
                      )}

                      {columns.outlay && (
                        <td className="py-3 text-right font-mono font-semibold text-gray-200">
                          {formatCurrency(totalOutlay)}
                        </td>
                      )}

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
      </div>

      <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500 font-medium p-2.5 bg-gray-950/40 border border-gray-800/40 rounded-xl">
        <ShieldAlert className="h-3.5 w-3.5 text-amber-500/60 shrink-0" />
        <span>Reverting a transaction will immediately adjust asset allocations, weights, and run Monte Carlo simulations.</span>
      </div>
    </div>
  );
}
