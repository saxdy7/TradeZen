'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, type IChartApi } from 'lightweight-charts';
import { fetchBinanceKlines } from '@/lib/binance';

interface TradingChartProps {
  symbol?: string;
  interval?: string;
}

export default function TradingChart({ symbol = 'BTCUSDT', interval = '1h' }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#12121A' },
        textColor: '#8888AA',
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(0, 255, 136, 0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(0, 255, 136, 0.3)', width: 1, style: 2 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00FF88',
      downColor: '#FF4466',
      borderDownColor: '#FF4466',
      borderUpColor: '#00FF88',
      wickDownColor: '#FF4466',
      wickUpColor: '#00FF88',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const loadData = async () => {
      setLoading(true);
      const klines = await fetchBinanceKlines(symbol, interval, 200);
      if (klines.length > 0) {
        candlestickSeries.setData(
          klines.map((k: { time: number; open: number; high: number; low: number; close: number }) => ({
            time: k.time,
            open: k.open,
            high: k.high,
            low: k.low,
            close: k.close,
          }))
        );
        volumeSeries.setData(
          klines.map((k: { time: number; open: number; close: number; volume: number }) => ({
            time: k.time,
            value: k.volume,
            color: k.close >= k.open ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 68, 102, 0.3)',
          }))
        );
        chart.timeScale().fitContent();
      }
      setLoading(false);
    };

    loadData();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [symbol, interval]);

  return (
    <div className="rounded-xl border border-white/5 bg-[#12121A] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">
            {symbol.replace('USDT', '')}/USDT
          </span>
          <span className="text-xs text-[#8888AA]">• {interval}</span>
        </div>
        <div className="flex gap-1">
          {['1m', '5m', '15m', '1h', '4h', '1d'].map((i) => (
            <span
              key={i}
              className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
                interval === i
                  ? 'text-[#00FF88] bg-[#00FF88]/10'
                  : 'text-[#8888AA] hover:text-white'
              }`}
            >
              {i}
            </span>
          ))}
        </div>
      </div>
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#12121A]/80 z-10">
            <div className="w-8 h-8 border-2 border-[#00FF88]/20 border-t-[#00FF88] rounded-full animate-spin" />
          </div>
        )}
        <div ref={chartContainerRef} />
      </div>
    </div>
  );
}
