'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchOrderBook, getBinanceDepthWSUrl, type OrderBook } from '@/lib/binance';

interface OrderBookPanelProps {
  symbol: string;
}

export default function OrderBookPanel({ symbol }: OrderBookPanelProps) {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load initial order book + subscribe to WebSocket updates
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const data = await fetchOrderBook(symbol, 15);
      if (mounted && data) setOrderBook(data);
    };
    load();

    // Live depth stream
    const ws = new WebSocket(getBinanceDepthWSUrl(symbol));
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg.bids || !msg.asks) return;

        const mapEntries = (entries: [string, string][]) => {
          let cumTotal = 0;
          return entries.map(([p, q]: [string, string]) => {
            const price = parseFloat(p);
            const quantity = parseFloat(q);
            cumTotal += quantity;
            return { price, quantity, total: cumTotal };
          });
        };

        if (mounted) {
          setOrderBook({
            bids: mapEntries(msg.bids),
            asks: mapEntries(msg.asks).reverse(),
            lastUpdateId: msg.lastUpdateId || 0,
          });
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

  if (!orderBook) {
    return (
      <div className="rounded-xl border border-white/5 bg-[#12121A] p-4 h-[400px] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#00FF88]/20 border-t-[#00FF88] rounded-full animate-spin" />
      </div>
    );
  }

  const maxBidTotal = Math.max(...orderBook.bids.map((b) => b.total), 1);
  const maxAskTotal = Math.max(...orderBook.asks.map((a) => a.total), 1);
  // Spread calculation
  const bestBid = orderBook.bids[0]?.price || 0;
  const bestAsk = orderBook.asks[orderBook.asks.length - 1]?.price || 0;
  const spread = bestAsk - bestBid;
  const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0;

  return (
    <div className="rounded-xl border border-white/5 bg-[#12121A] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <h3 className="text-xs font-medium text-white">Order Book</h3>
        <span className="text-[10px] text-[#8888AA]">Spread: ${spread.toFixed(2)} ({spreadPercent.toFixed(3)}%)</span>
      </div>

      {/* Header */}
      <div className="grid grid-cols-3 px-3 py-1 text-[10px] text-[#8888AA] border-b border-white/5">
        <span>Price (USD)</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (sells) — shown top, red */}
      <div className="max-h-[160px] overflow-y-auto scrollbar-thin">
        {orderBook.asks.map((ask, i) => (
          <div key={`a-${i}`} className="relative grid grid-cols-3 px-3 py-[3px] text-[11px] hover:bg-white/[0.02]">
            <div
              className="absolute right-0 top-0 bottom-0 bg-red-500/8"
              style={{ width: `${(ask.total / maxAskTotal) * 100}%` }}
            />
            <span className="relative text-red-400">${ask.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="relative text-right text-white/70">{ask.quantity.toFixed(4)}</span>
            <span className="relative text-right text-[#8888AA]">{ask.total.toFixed(4)}</span>
          </div>
        ))}
      </div>

      {/* Mid price */}
      <div className="px-3 py-1.5 border-y border-white/5 text-center">
        <span className="text-sm font-bold text-white font-[family-name:var(--font-space-grotesk)]">
          ${bestAsk.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Bids (buys) — shown bottom, green */}
      <div className="max-h-[160px] overflow-y-auto scrollbar-thin">
        {orderBook.bids.map((bid, i) => (
          <div key={`b-${i}`} className="relative grid grid-cols-3 px-3 py-[3px] text-[11px] hover:bg-white/[0.02]">
            <div
              className="absolute right-0 top-0 bottom-0 bg-[#00FF88]/8"
              style={{ width: `${(bid.total / maxBidTotal) * 100}%` }}
            />
            <span className="relative text-[#00FF88]">${bid.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="relative text-right text-white/70">{bid.quantity.toFixed(4)}</span>
            <span className="relative text-right text-[#8888AA]">{bid.total.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
