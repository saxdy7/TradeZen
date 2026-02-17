'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import { fetchBinanceKlines, fetchBinance24hTicker, getBinanceKlineWSUrl } from '@/lib/binance';
import { Maximize2, Minimize2, BarChart3, LineChart, AreaChart } from 'lucide-react';

type ChartType = 'candles' | 'line' | 'area';
type KlineData = { time: number; open: number; high: number; low: number; close: number; volume: number };

// Compute Simple Moving Average
function computeSMA(data: KlineData[], period: number) {
  const result: { time: number; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

interface TradingChartProps {
  symbol?: string;
  interval?: string;
}

interface Stats24h {
  highPrice: string;
  lowPrice: string;
  openPrice: string;
  volume: string;
  quoteVolume: string;
  priceChangePercent: string;
}

export default function TradingChart({ symbol = 'BTCUSDT', interval: initialInterval = '1h' }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | ISeriesApi<'Area'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ma7Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ma25Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ma99Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const klinesRef = useRef<KlineData[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState(initialInterval);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stats, setStats] = useState<Stats24h | null>(null);
  const [showMA7, setShowMA7] = useState(false);
  const [showMA25, setShowMA25] = useState(false);
  const [showMA99, setShowMA99] = useState(false);

  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!fullscreenRef.current) return;
    if (!isFullscreen) {
      fullscreenRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Listen for fullscreen exit
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Fetch 24h stats
  useEffect(() => {
    fetchBinance24hTicker(symbol).then((data) => {
      if (data) setStats(data);
    });
  }, [symbol]);

  // Create chart and load data
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    mainSeriesRef.current = null;
    volumeSeriesRef.current = null;
    ma7Ref.current = null;
    ma25Ref.current = null;
    ma99Ref.current = null;

    const chartHeight = isFullscreen ? window.innerHeight - 120 : (window.innerWidth < 768 ? 300 : 420);

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
      height: chartHeight,
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(0, 255, 136, 0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(0, 255, 136, 0.3)', width: 1, style: 2 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        timeVisible: true,
      },
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.05)' },
    });
    chartRef.current = chart;

    // Create main series based on chart type
    if (chartType === 'candles') {
      const s = chart.addSeries(CandlestickSeries, {
        upColor: '#00FF88',
        downColor: '#FF4466',
        borderDownColor: '#FF4466',
        borderUpColor: '#00FF88',
        wickDownColor: '#FF4466',
        wickUpColor: '#00FF88',
      });
      mainSeriesRef.current = s;
    } else if (chartType === 'line') {
      const s = chart.addSeries(LineSeries, {
        color: '#00D4FF',
        lineWidth: 2,
      });
      mainSeriesRef.current = s;
    } else {
      const s = chart.addSeries(AreaSeries, {
        topColor: 'rgba(0, 212, 255, 0.4)',
        bottomColor: 'rgba(0, 212, 255, 0.02)',
        lineColor: '#00D4FF',
        lineWidth: 2,
      });
      mainSeriesRef.current = s;
    }

    // Volume
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeriesRef.current = volumeSeries;
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    // MA overlays
    if (showMA7) {
      ma7Ref.current = chart.addSeries(LineSeries, { color: '#FFD93D', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    }
    if (showMA25) {
      ma25Ref.current = chart.addSeries(LineSeries, { color: '#FF6B6B', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    }
    if (showMA99) {
      ma99Ref.current = chart.addSeries(LineSeries, { color: '#9B59B6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    }

    // Load data
    const loadData = async () => {
      setLoading(true);
      setError(null);
      const klines: KlineData[] = await fetchBinanceKlines(symbol, interval, 300);
      if (klines.length > 0) {
        klinesRef.current = klines;

        if (chartType === 'candles') {
          (mainSeriesRef.current as ISeriesApi<'Candlestick'>)?.setData(
            klines.map((k) => ({ time: k.time, open: k.open, high: k.high, low: k.low, close: k.close }))
          );
        } else {
          (mainSeriesRef.current as ISeriesApi<'Line'> | ISeriesApi<'Area'>)?.setData(
            klines.map((k) => ({ time: k.time, value: k.close }))
          );
        }

        volumeSeries.setData(
          klines.map((k) => ({
            time: k.time,
            value: k.volume,
            color: k.close >= k.open ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 68, 102, 0.3)',
          }))
        );

        // MA overlays
        if (showMA7 && ma7Ref.current) ma7Ref.current.setData(computeSMA(klines, 7));
        if (showMA25 && ma25Ref.current) ma25Ref.current.setData(computeSMA(klines, 25));
        if (showMA99 && ma99Ref.current) ma99Ref.current.setData(computeSMA(klines, 99));

        chart.timeScale().fitContent();
        setLastPrice(klines[klines.length - 1].close);
      } else {
        setError('Failed to load chart data');
      }
      setLoading(false);
    };

    loadData().then(() => {
      const ws = new WebSocket(getBinanceKlineWSUrl(symbol, interval));
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const k = msg.k;
          if (!k) return;

          const candle: KlineData = {
            time: Math.floor(k.t / 1000),
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
          };

          // Update klines ref for MA computation
          const existing = klinesRef.current;
          if (existing.length > 0 && existing[existing.length - 1].time === candle.time) {
            existing[existing.length - 1] = candle;
          } else {
            existing.push(candle);
          }

          if (chartType === 'candles') {
            (mainSeriesRef.current as ISeriesApi<'Candlestick'>)?.update({
              time: candle.time, open: candle.open, high: candle.high, low: candle.low, close: candle.close,
            });
          } else {
            (mainSeriesRef.current as ISeriesApi<'Line'> | ISeriesApi<'Area'>)?.update({
              time: candle.time, value: candle.close,
            });
          }

          volumeSeriesRef.current?.update({
            time: candle.time,
            value: candle.volume,
            color: candle.close >= candle.open ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 68, 102, 0.3)',
          });

          // Update MA overlays
          if (showMA7 && ma7Ref.current && existing.length >= 7) {
            const sma = computeSMA(existing.slice(-7), 7);
            if (sma.length > 0) ma7Ref.current.update(sma[sma.length - 1]);
          }
          if (showMA25 && ma25Ref.current && existing.length >= 25) {
            const sma = computeSMA(existing.slice(-25), 25);
            if (sma.length > 0) ma25Ref.current.update(sma[sma.length - 1]);
          }
          if (showMA99 && ma99Ref.current && existing.length >= 99) {
            const sma = computeSMA(existing.slice(-99), 99);
            if (sma.length > 0) ma99Ref.current.update(sma[sma.length - 1]);
          }

          setLastPrice(candle.close);
        } catch { /* ignore */ }
      };
      ws.onerror = () => ws.close();
      wsRef.current = ws;
    });

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const h = isFullscreen ? window.innerHeight - 120 : (window.innerWidth < 768 ? 300 : 420);
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth, height: h });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      wsRef.current?.close();
      wsRef.current = null;
      chartRef.current?.remove();
      chartRef.current = null;
    };
  }, [symbol, interval, chartType, showMA7, showMA25, showMA99, isFullscreen]);

  const changePercent = stats ? parseFloat(stats.priceChangePercent) : 0;
  const isPositive = changePercent >= 0;

  const chartTypeButtons: { type: ChartType; icon: typeof BarChart3; label: string }[] = [
    { type: 'candles', icon: BarChart3, label: 'Candles' },
    { type: 'line', icon: LineChart, label: 'Line' },
    { type: 'area', icon: AreaChart, label: 'Area' },
  ];

  return (
    <div ref={fullscreenRef} className={`rounded-xl border border-white/5 bg-[#12121A] overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      {/* 24h Stats Bar */}
      {stats && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 lg:px-4 py-2 border-b border-white/5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-semibold text-white font-[family-name:var(--font-space-grotesk)]">
              {symbol.replace('USDT', '')}/USDT
            </span>
            {lastPrice !== null && (
              <span className="text-base font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                ${lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
            <span className={`font-medium ${isPositive ? 'text-[#00FF88]' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#00FF88]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-3 text-[#8888AA]">
            <span>H <span className="text-white">${parseFloat(stats.highPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
            <span>L <span className="text-white">${parseFloat(stats.lowPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
            <span className="hidden sm:inline">O <span className="text-white">${parseFloat(stats.openPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
            <span className="hidden sm:inline">Vol <span className="text-white">${(parseFloat(stats.quoteVolume) / 1e6).toFixed(2)}M</span></span>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 lg:px-4 py-2 border-b border-white/5">
        {/* Intervals */}
        <div className="flex items-center gap-1">
          {['1m', '5m', '15m', '1h', '4h', '1d'].map((i) => (
            <button
              key={i}
              onClick={() => setInterval(i)}
              className={`px-2 py-1 text-[11px] rounded cursor-pointer transition-colors ${
                interval === i ? 'text-[#00FF88] bg-[#00FF88]/10' : 'text-[#8888AA] hover:text-white'
              }`}
            >
              {i}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {/* Chart Type */}
          {chartTypeButtons.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              title={label}
              className={`p-1.5 rounded cursor-pointer transition-colors ${
                chartType === type ? 'text-[#00D4FF] bg-[#00D4FF]/10' : 'text-[#8888AA] hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* MA Toggles */}
          <button
            onClick={() => setShowMA7((v) => !v)}
            className={`px-1.5 py-0.5 text-[10px] rounded font-medium cursor-pointer transition-colors ${
              showMA7 ? 'text-[#FFD93D] bg-[#FFD93D]/10' : 'text-[#8888AA] hover:text-white'
            }`}
          >
            MA7
          </button>
          <button
            onClick={() => setShowMA25((v) => !v)}
            className={`px-1.5 py-0.5 text-[10px] rounded font-medium cursor-pointer transition-colors ${
              showMA25 ? 'text-[#FF6B6B] bg-[#FF6B6B]/10' : 'text-[#8888AA] hover:text-white'
            }`}
          >
            MA25
          </button>
          <button
            onClick={() => setShowMA99((v) => !v)}
            className={`px-1.5 py-0.5 text-[10px] rounded font-medium cursor-pointer transition-colors ${
              showMA99 ? 'text-[#9B59B6] bg-[#9B59B6]/10' : 'text-[#8888AA] hover:text-white'
            }`}
          >
            MA99
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded text-[#8888AA] hover:text-white cursor-pointer transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#12121A]/80 z-10">
            <div className="w-8 h-8 border-2 border-[#00FF88]/20 border-t-[#00FF88] rounded-full animate-spin" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#12121A]/80 z-10">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        <div ref={chartContainerRef} />
      </div>

      {/* MA Legend */}
      {(showMA7 || showMA25 || showMA99) && (
        <div className="flex items-center gap-3 px-3 py-1.5 border-t border-white/5 text-[10px]">
          {showMA7 && <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#FFD93D] rounded" />MA(7)</span>}
          {showMA25 && <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#FF6B6B] rounded" />MA(25)</span>}
          {showMA99 && <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#9B59B6] rounded" />MA(99)</span>}
        </div>
      )}
    </div>
  );
}
