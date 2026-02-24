'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries, type IChartApi, type UTCTimestamp } from 'lightweight-charts';
import { fetchOrderBook, getBinanceDepthWSUrl, type OrderBookEntry } from '@/lib/binance';

interface DepthChartProps {
  symbol?: string;
}

interface DepthLevel {
  price: number;
  quantity: number;
  total: number;
}

export default function DepthChart({ symbol = 'BTCUSDT' }: DepthChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [midPrice, setMidPrice] = useState<number | null>(null);
  const [spread, setSpread] = useState<string>('');

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current?.remove();
    chartRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;

    const w = containerRef.current.clientWidth;
    const h = window.innerWidth < 768 ? 200 : 280;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: '#12121A' }, textColor: '#8888AA', fontFamily: 'Inter, sans-serif' },
      grid: { vertLines: { color: 'rgba(255,255,255,0.02)' }, horzLines: { color: 'rgba(255,255,255,0.02)' } },
      width: w,
      height: h,
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.05)', scaleMargins: { top: 0.05, bottom: 0.05 } },
      timeScale: { visible: false },
      crosshair: { mode: 0 as const },
      handleScale: false,
      handleScroll: false,
    });
    chartRef.current = chart;

    const bidSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(0, 255, 136, 0.25)',
      bottomColor: 'rgba(0, 255, 136, 0.02)',
      lineColor: '#00FF88',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      priceScaleId: 'depth',
    });

    const askSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(255, 68, 102, 0.25)',
      bottomColor: 'rgba(255, 68, 102, 0.02)',
      lineColor: '#FF4466',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      priceScaleId: 'depth',
    });

    const updateDepth = (bids: OrderBookEntry[], asks: OrderBookEntry[]) => {
      // Process bids (sorted high → low)
      const bidLevels: DepthLevel[] = [];
      let bidTotal = 0;
      const sortedBids = [...bids].sort((a, b) => b.price - a.price);
      for (const b of sortedBids) {
        bidTotal += b.quantity;
        bidLevels.push({ price: b.price, quantity: b.quantity, total: bidTotal });
      }

      // Process asks (sorted low → high)
      const askLevels: DepthLevel[] = [];
      let askTotal = 0;
      const sortedAsks = [...asks].sort((a, b) => a.price - b.price);
      for (const a of sortedAsks) {
        askTotal += a.quantity;
        askLevels.push({ price: a.price, quantity: a.quantity, total: askTotal });
      }

      if (bidLevels.length > 0 && askLevels.length > 0) {
        const bestBid = bidLevels[0].price;
        const bestAsk = askLevels[0].price;
        const mid = (bestBid + bestAsk) / 2;
        setMidPrice(mid);
        setSpread(((bestAsk - bestBid) / mid * 100).toFixed(4));

        const bidData = bidLevels.reverse().map((b, i) => ({
          time: (i + 1) as UTCTimestamp,
          value: b.total,
        }));
        const askData = askLevels.map((a, i) => ({
          time: (bidLevels.length + i + 1) as UTCTimestamp,
          value: a.total,
        }));

        bidSeries.setData(bidData);
        askSeries.setData(askData);
      }
    };

    // Parse raw WS [price, qty] tuples into OrderBookEntry[]
    const parseEntries = (raw: [string, string][]): OrderBookEntry[] =>
      raw.map(([p, q]) => ({ price: parseFloat(p), quantity: parseFloat(q), total: 0 }));

    // Initial load
    fetchOrderBook(symbol, 50).then((data) => {
      if (data) updateDepth(data.bids, data.asks);
    });

    // WebSocket for live updates
    const ws = new WebSocket(getBinanceDepthWSUrl(symbol));
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.bids && msg.asks) {
          updateDepth(parseEntries(msg.bids), parseEntries(msg.asks));
        }

      } catch { /* ignore */ }
    };
    ws.onerror = () => ws.close();
    wsRef.current = ws;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: window.innerWidth < 768 ? 200 : 280,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      wsRef.current?.close();
      wsRef.current = null;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [symbol]);

  return (
    <div className="rounded-xl border border-white/5 bg-[#12121A] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <span className="text-xs font-medium text-white">Depth Chart</span>
        <div className="flex items-center gap-3 text-[10px] text-[#8888AA]">
          {midPrice && <span>Mid: <span className="text-white">${midPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>}
          {spread && <span>Spread: <span className="text-white">{spread}%</span></span>}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#00FF88] rounded" />Bids</span>
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#FF4466] rounded" />Asks</span>
          </div>
        </div>
      </div>
      <div ref={containerRef} />
    </div>
  );
}
