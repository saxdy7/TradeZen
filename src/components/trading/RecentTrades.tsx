'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchRecentTrades, getBinanceTradeWSUrl, type RecentTrade } from '@/lib/binance';

interface RecentTradesPanelProps {
  symbol: string;
}

export default function RecentTradesPanel({ symbol }: RecentTradesPanelProps) {
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let mounted = true;

    // Load initial trades
    fetchRecentTrades(symbol, 30).then((data) => {
      if (mounted) setTrades(data.reverse());
    });

    // Live trade stream
    const ws = new WebSocket(getBinanceTradeWSUrl(symbol));
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg.p) return;

        const trade: RecentTrade = {
          id: msg.t,
          price: parseFloat(msg.p),
          qty: parseFloat(msg.q),
          quoteQty: parseFloat(msg.p) * parseFloat(msg.q),
          time: msg.T,
          isBuyerMaker: msg.m,
        };

        if (mounted) {
          setTrades((prev) => [trade, ...prev].slice(0, 50));
        }
      } catch { /* ignore */ }
    };
    ws.onerror = () => ws.close();
    wsRef.current = ws;

    return () => {
      mounted = false;
      wsRef.current?.close();
    };
  }, [symbol]);

  return (
    <div className="rounded-xl border border-white/5 bg-[#12121A] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <h3 className="text-xs font-medium text-white">Recent Trades</h3>
        <span className="text-[10px] text-[#8888AA]">{trades.length} trades</span>
      </div>

      {/* Header */}
      <div className="grid grid-cols-3 px-3 py-1 text-[10px] text-[#8888AA] border-b border-white/5">
        <span>Price (USD)</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Time</span>
      </div>

      {/* Trade list */}
      <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
        {trades.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#00FF88]/20 border-t-[#00FF88] rounded-full animate-spin" />
          </div>
        ) : (
          trades.map((trade) => {
            const isBuy = !trade.isBuyerMaker;
            const timeStr = new Date(trade.time).toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            return (
              <div
                key={trade.id}
                className="grid grid-cols-3 px-3 py-[3px] text-[11px] hover:bg-white/[0.02] transition-colors"
              >
                <span className={isBuy ? 'text-[#00FF88]' : 'text-red-400'}>
                  ${trade.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-right text-white/70">{trade.qty.toFixed(4)}</span>
                <span className="text-right text-[#8888AA]">{timeStr}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
