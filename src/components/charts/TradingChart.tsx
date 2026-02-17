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
import { Maximize2, Minimize2, BarChart3, LineChart, AreaChart, Settings2 } from 'lucide-react';

type ChartType = 'candles' | 'line' | 'area';
type KlineData = { time: number; open: number; high: number; low: number; close: number; volume: number };

// === Technical Indicator Computations ===
function computeSMA(data: KlineData[], period: number) {
  const result: { time: number; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j].close;
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

function computeEMA(data: KlineData[], period: number) {
  const result: { time: number; value: number }[] = [];
  if (data.length < period) return result;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((s, d) => s + d.close, 0) / period;
  result.push({ time: data[period - 1].time, value: ema });
  for (let i = period; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    result.push({ time: data[i].time, value: ema });
  }
  return result;
}

function computeBollingerBands(data: KlineData[], period: number = 20, stdDev: number = 2) {
  const upper: { time: number; value: number }[] = [];
  const middle: { time: number; value: number }[] = [];
  const lower: { time: number; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = slice.reduce((s, d) => s + d.close, 0) / period;
    const variance = slice.reduce((s, d) => s + Math.pow(d.close - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    middle.push({ time: data[i].time, value: mean });
    upper.push({ time: data[i].time, value: mean + stdDev * sd });
    lower.push({ time: data[i].time, value: mean - stdDev * sd });
  }
  return { upper, middle, lower };
}

function computeRSI(data: KlineData[], period: number = 14) {
  const result: { time: number; value: number }[] = [];
  if (data.length < period + 1) return result;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) avgGain += diff; else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;
  const rs0 = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push({ time: data[period].time, value: 100 - 100 / (1 + rs0) });
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push({ time: data[i].time, value: 100 - 100 / (1 + rs) });
  }
  return result;
}

function computeMACD(data: KlineData[], fast: number = 12, slow: number = 26, signal: number = 9) {
  const emaFast = computeEMA(data, fast);
  const emaSlow = computeEMA(data, slow);
  const macdLine: { time: number; value: number }[] = [];
  const startIdx = slow - fast;
  for (let i = 0; i < emaSlow.length; i++) {
    const fi = i + startIdx;
    if (fi >= 0 && fi < emaFast.length) {
      macdLine.push({ time: emaSlow[i].time, value: emaFast[fi].value - emaSlow[i].value });
    }
  }
  // Signal line (EMA of MACD)
  const signalLine: { time: number; value: number }[] = [];
  if (macdLine.length >= signal) {
    const k = 2 / (signal + 1);
    let ema = macdLine.slice(0, signal).reduce((s, d) => s + d.value, 0) / signal;
    signalLine.push({ time: macdLine[signal - 1].time, value: ema });
    for (let i = signal; i < macdLine.length; i++) {
      ema = macdLine[i].value * k + ema * (1 - k);
      signalLine.push({ time: macdLine[i].time, value: ema });
    }
  }
  // Histogram
  const histogram: { time: number; value: number; color: string }[] = [];
  const signalStart = macdLine.length - signalLine.length;
  for (let i = 0; i < signalLine.length; i++) {
    const mi = i + signalStart;
    const val = macdLine[mi].value - signalLine[i].value;
    histogram.push({
      time: signalLine[i].time,
      value: val,
      color: val >= 0 ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 68, 102, 0.5)',
    });
  }
  return { macdLine, signalLine, histogram };
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

const ALL_INTERVALS = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '1w', '1M'];

export default function TradingChart({ symbol = 'BTCUSDT', interval: initialInterval = '1h' }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | ISeriesApi<'Area'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const klinesRef = useRef<KlineData[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState(initialInterval);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stats, setStats] = useState<Stats24h | null>(null);
  const [showIndicators, setShowIndicators] = useState(false);

  // Indicator toggles
  const [showMA7, setShowMA7] = useState(false);
  const [showMA25, setShowMA25] = useState(false);
  const [showMA99, setShowMA99] = useState(false);
  const [showEMA12, setShowEMA12] = useState(false);
  const [showEMA26, setShowEMA26] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [logScale, setLogScale] = useState(false);

  const fullscreenRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement) setIsFullscreen(false); };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    fetchBinance24hTicker(symbol).then((data) => { if (data) setStats(data); });
  }, [symbol]);

  // === Main Chart + Sub-charts ===
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Cleanup
    chartRef.current?.remove(); chartRef.current = null;
    rsiChartRef.current?.remove(); rsiChartRef.current = null;
    macdChartRef.current?.remove(); macdChartRef.current = null;
    wsRef.current?.close(); wsRef.current = null;
    mainSeriesRef.current = null;
    volumeSeriesRef.current = null;

    const w = chartContainerRef.current.clientWidth;
    const mainH = isFullscreen ? window.innerHeight - 200 : (window.innerWidth < 768 ? 280 : 400);

    const chartOpts = {
      layout: { background: { color: '#12121A' }, textColor: '#8888AA', fontFamily: 'Inter, sans-serif' },
      grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } },
      width: w,
      crosshair: { mode: 0 as const, vertLine: { color: 'rgba(0,255,136,0.3)', width: 1 as const, style: 2 as const }, horzLine: { color: 'rgba(0,255,136,0.3)', width: 1 as const, style: 2 as const } },
      timeScale: { borderColor: 'rgba(255,255,255,0.05)', timeVisible: true },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.05)', mode: logScale ? 1 : 0 },
    };

    // Main chart
    const chart = createChart(chartContainerRef.current, { ...chartOpts, height: mainH });
    chartRef.current = chart;

    // Main series
    if (chartType === 'candles') {
      mainSeriesRef.current = chart.addSeries(CandlestickSeries, { upColor: '#00FF88', downColor: '#FF4466', borderDownColor: '#FF4466', borderUpColor: '#00FF88', wickDownColor: '#FF4466', wickUpColor: '#00FF88' });
    } else if (chartType === 'line') {
      mainSeriesRef.current = chart.addSeries(LineSeries, { color: '#00D4FF', lineWidth: 2 });
    } else {
      mainSeriesRef.current = chart.addSeries(AreaSeries, { topColor: 'rgba(0,212,255,0.4)', bottomColor: 'rgba(0,212,255,0.02)', lineColor: '#00D4FF', lineWidth: 2 });
    }

    // Volume
    const volSeries = chart.addSeries(HistogramSeries, { color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: '' });
    volumeSeriesRef.current = volSeries;
    volSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    // Overlay indicator series refs
    const overlaySeriesRefs: ISeriesApi<'Line'>[] = [];

    // RSI sub-chart
    let rsiSeries: ISeriesApi<'Line'> | null = null;
    let rsi70Line: ISeriesApi<'Line'> | null = null;
    let rsi30Line: ISeriesApi<'Line'> | null = null;
    if (showRSI && rsiContainerRef.current) {
      const rsiChart = createChart(rsiContainerRef.current, { ...chartOpts, height: 100 });
      rsiChartRef.current = rsiChart;
      rsiSeries = rsiChart.addSeries(LineSeries, { color: '#FFD93D', lineWidth: 1.5, priceLineVisible: false });
      rsi70Line = rsiChart.addSeries(LineSeries, { color: 'rgba(255,68,102,0.3)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 2 });
      rsi30Line = rsiChart.addSeries(LineSeries, { color: 'rgba(0,255,136,0.3)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 2 });
    }

    // MACD sub-chart
    let macdLineSeries: ISeriesApi<'Line'> | null = null;
    let macdSignalSeries: ISeriesApi<'Line'> | null = null;
    let macdHistSeries: ISeriesApi<'Histogram'> | null = null;
    if (showMACD && macdContainerRef.current) {
      const macdChart = createChart(macdContainerRef.current, { ...chartOpts, height: 100 });
      macdChartRef.current = macdChart;
      macdLineSeries = macdChart.addSeries(LineSeries, { color: '#00D4FF', lineWidth: 1.5, priceLineVisible: false });
      macdSignalSeries = macdChart.addSeries(LineSeries, { color: '#FF6B6B', lineWidth: 1.5, priceLineVisible: false });
      macdHistSeries = macdChart.addSeries(HistogramSeries, { priceFormat: { type: 'price' }, priceScaleId: '' });
      macdHistSeries.priceScale().applyOptions({ scaleMargins: { top: 0.3, bottom: 0 } });
    }

    const setOverlayData = (klines: KlineData[]) => {
      // Clear old overlay series
      overlaySeriesRefs.forEach((s) => { try { chart.removeSeries(s); } catch { /* */ } });
      overlaySeriesRefs.length = 0;

      const addLine = (data: { time: number; value: number }[], color: string) => {
        const s = chart.addSeries(LineSeries, { color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s.setData(data);
        overlaySeriesRefs.push(s);
      };

      if (showMA7) addLine(computeSMA(klines, 7), '#FFD93D');
      if (showMA25) addLine(computeSMA(klines, 25), '#FF6B6B');
      if (showMA99) addLine(computeSMA(klines, 99), '#9B59B6');
      if (showEMA12) addLine(computeEMA(klines, 12), '#00D4FF');
      if (showEMA26) addLine(computeEMA(klines, 26), '#FF9F43');
      if (showBB) {
        const bb = computeBollingerBands(klines);
        addLine(bb.upper, 'rgba(0,212,255,0.5)');
        addLine(bb.middle, 'rgba(0,212,255,0.25)');
        addLine(bb.lower, 'rgba(0,212,255,0.5)');
      }

      // RSI
      if (showRSI && rsiSeries) {
        const rsiData = computeRSI(klines);
        rsiSeries.setData(rsiData);
        if (rsi70Line && rsi30Line && rsiData.length > 1) {
          const times = rsiData.map((d) => d.time);
          rsi70Line.setData(times.map((t) => ({ time: t, value: 70 })));
          rsi30Line.setData(times.map((t) => ({ time: t, value: 30 })));
        }
        rsiChartRef.current?.timeScale().fitContent();
      }

      // MACD
      if (showMACD && macdLineSeries && macdSignalSeries && macdHistSeries) {
        const macd = computeMACD(klines);
        macdLineSeries.setData(macd.macdLine);
        macdSignalSeries.setData(macd.signalLine);
        macdHistSeries.setData(macd.histogram);
        macdChartRef.current?.timeScale().fitContent();
      }
    };

    // Load data
    const loadData = async () => {
      setLoading(true);
      setError(null);
      const klines: KlineData[] = await fetchBinanceKlines(symbol, interval, 500);
      if (klines.length > 0) {
        klinesRef.current = klines;

        if (chartType === 'candles') {
          (mainSeriesRef.current as ISeriesApi<'Candlestick'>)?.setData(klines.map((k) => ({ time: k.time, open: k.open, high: k.high, low: k.low, close: k.close })));
        } else {
          (mainSeriesRef.current as ISeriesApi<'Line'> | ISeriesApi<'Area'>)?.setData(klines.map((k) => ({ time: k.time, value: k.close })));
        }
        volSeries.setData(klines.map((k) => ({ time: k.time, value: k.volume, color: k.close >= k.open ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,102,0.3)' })));

        setOverlayData(klines);
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
          const candle: KlineData = { time: Math.floor(k.t / 1000), open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l), close: parseFloat(k.c), volume: parseFloat(k.v) };

          const existing = klinesRef.current;
          if (existing.length > 0 && existing[existing.length - 1].time === candle.time) {
            existing[existing.length - 1] = candle;
          } else { existing.push(candle); }

          if (chartType === 'candles') {
            (mainSeriesRef.current as ISeriesApi<'Candlestick'>)?.update({ time: candle.time, open: candle.open, high: candle.high, low: candle.low, close: candle.close });
          } else {
            (mainSeriesRef.current as ISeriesApi<'Line'> | ISeriesApi<'Area'>)?.update({ time: candle.time, value: candle.close });
          }
          volumeSeriesRef.current?.update({ time: candle.time, value: candle.volume, color: candle.close >= candle.open ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,102,0.3)' });
          setLastPrice(candle.close);
        } catch { /* ignore */ }
      };
      ws.onerror = () => ws.close();
      wsRef.current = ws;
    });

    // Sync time scales
    const syncCharts = [rsiChartRef.current, macdChartRef.current].filter(Boolean) as IChartApi[];
    if (syncCharts.length > 0) {
      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range) syncCharts.forEach((c) => c.timeScale().setVisibleLogicalRange(range));
      });
    }

    const handleResize = () => {
      if (!chartContainerRef.current || !chartRef.current) return;
      const nw = chartContainerRef.current.clientWidth;
      const nh = isFullscreen ? window.innerHeight - 200 : (window.innerWidth < 768 ? 280 : 400);
      chartRef.current.applyOptions({ width: nw, height: nh });
      rsiChartRef.current?.applyOptions({ width: nw });
      macdChartRef.current?.applyOptions({ width: nw });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      wsRef.current?.close(); wsRef.current = null;
      chartRef.current?.remove(); chartRef.current = null;
      rsiChartRef.current?.remove(); rsiChartRef.current = null;
      macdChartRef.current?.remove(); macdChartRef.current = null;
    };
  }, [symbol, interval, chartType, showMA7, showMA25, showMA99, showEMA12, showEMA26, showBB, showRSI, showMACD, logScale, isFullscreen]);

  const changePercent = stats ? parseFloat(stats.priceChangePercent) : 0;
  const isPositive = changePercent >= 0;

  const chartTypeButtons: { type: ChartType; icon: typeof BarChart3; label: string }[] = [
    { type: 'candles', icon: BarChart3, label: 'Candles' },
    { type: 'line', icon: LineChart, label: 'Line' },
    { type: 'area', icon: AreaChart, label: 'Area' },
  ];

  const activeIndicators = [showMA7 && 'MA7', showMA25 && 'MA25', showMA99 && 'MA99', showEMA12 && 'EMA12', showEMA26 && 'EMA26', showBB && 'BB', showRSI && 'RSI', showMACD && 'MACD'].filter(Boolean);

  return (
    <div ref={fullscreenRef} className={`rounded-xl border border-white/5 bg-[#12121A] overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      {/* 24h Stats Bar */}
      {stats && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 lg:px-4 py-2 border-b border-white/5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-base lg:text-lg font-semibold text-white font-[family-name:var(--font-space-grotesk)]">
              {symbol.replace('USDT', '')}/USDT
            </span>
            {lastPrice !== null && (
              <span className="text-sm lg:text-base font-bold text-white font-[family-name:var(--font-space-grotesk)]">
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
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-thin">
          {ALL_INTERVALS.map((i) => (
            <button key={i} onClick={() => setInterval(i)}
              className={`px-1.5 py-1 text-[10px] lg:text-[11px] rounded cursor-pointer transition-colors whitespace-nowrap ${interval === i ? 'text-[#00FF88] bg-[#00FF88]/10' : 'text-[#8888AA] hover:text-white'}`}
            >{i}</button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {chartTypeButtons.map(({ type, icon: Icon, label }) => (
            <button key={type} onClick={() => setChartType(type)} title={label}
              className={`p-1.5 rounded cursor-pointer transition-colors ${chartType === type ? 'text-[#00D4FF] bg-[#00D4FF]/10' : 'text-[#8888AA] hover:text-white'}`}
            ><Icon className="w-3.5 h-3.5" /></button>
          ))}

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Indicators dropdown */}
          <div className="relative">
            <button onClick={() => setShowIndicators((v) => !v)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition-colors ${activeIndicators.length > 0 ? 'text-[#00D4FF] bg-[#00D4FF]/10' : 'text-[#8888AA] hover:text-white'}`}
            >
              <Settings2 className="w-3 h-3" />
              <span className="hidden sm:inline">Indicators</span>
              {activeIndicators.length > 0 && <span className="w-4 h-4 rounded-full bg-[#00D4FF]/20 text-[#00D4FF] text-[9px] flex items-center justify-center">{activeIndicators.length}</span>}
            </button>

            {showIndicators && (
              <div className="absolute right-0 top-8 z-30 w-52 rounded-lg border border-white/10 bg-[#1a1a2e] shadow-2xl p-2 space-y-1">
                <p className="text-[10px] text-[#8888AA] px-2 pt-1">Overlays</p>
                {[
                  { label: 'MA(7)', active: showMA7, toggle: setShowMA7, color: '#FFD93D' },
                  { label: 'MA(25)', active: showMA25, toggle: setShowMA25, color: '#FF6B6B' },
                  { label: 'MA(99)', active: showMA99, toggle: setShowMA99, color: '#9B59B6' },
                  { label: 'EMA(12)', active: showEMA12, toggle: setShowEMA12, color: '#00D4FF' },
                  { label: 'EMA(26)', active: showEMA26, toggle: setShowEMA26, color: '#FF9F43' },
                  { label: 'Bollinger Bands', active: showBB, toggle: setShowBB, color: '#00D4FF' },
                ].map(({ label, active, toggle, color }) => (
                  <button key={label} onClick={() => toggle((v: boolean) => !v)}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-[11px] transition-colors cursor-pointer ${active ? 'bg-white/5 text-white' : 'text-[#8888AA] hover:text-white hover:bg-white/[0.02]'}`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? color : '#555' }} />
                    {label}
                  </button>
                ))}
                <div className="border-t border-white/5 my-1" />
                <p className="text-[10px] text-[#8888AA] px-2">Sub-charts</p>
                {[
                  { label: 'RSI (14)', active: showRSI, toggle: setShowRSI, color: '#FFD93D' },
                  { label: 'MACD (12,26,9)', active: showMACD, toggle: setShowMACD, color: '#00D4FF' },
                ].map(({ label, active, toggle, color }) => (
                  <button key={label} onClick={() => toggle((v: boolean) => !v)}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-[11px] transition-colors cursor-pointer ${active ? 'bg-white/5 text-white' : 'text-[#8888AA] hover:text-white hover:bg-white/[0.02]'}`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? color : '#555' }} />
                    {label}
                  </button>
                ))}
                <div className="border-t border-white/5 my-1" />
                <button onClick={() => setLogScale((v) => !v)}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-[11px] transition-colors cursor-pointer ${logScale ? 'bg-white/5 text-white' : 'text-[#8888AA] hover:text-white hover:bg-white/[0.02]'}`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: logScale ? '#00FF88' : '#555' }} />
                  Log Scale
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button onClick={toggleFullscreen} className="p-1.5 rounded text-[#8888AA] hover:text-white cursor-pointer transition-colors" title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
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

      {/* RSI Sub-chart */}
      {showRSI && (
        <div className="border-t border-white/5">
          <div className="flex items-center gap-2 px-3 py-1 text-[10px] text-[#8888AA]">
            <span className="w-2 h-0.5 bg-[#FFD93D] rounded" />RSI(14)
            <span className="ml-auto text-[9px]">70 / 30</span>
          </div>
          <div ref={rsiContainerRef} />
        </div>
      )}

      {/* MACD Sub-chart */}
      {showMACD && (
        <div className="border-t border-white/5">
          <div className="flex items-center gap-2 px-3 py-1 text-[10px] text-[#8888AA]">
            <span className="w-2 h-0.5 bg-[#00D4FF] rounded" />MACD
            <span className="w-2 h-0.5 bg-[#FF6B6B] rounded ml-1" />Signal
          </div>
          <div ref={macdContainerRef} />
        </div>
      )}

      {/* Active Indicator Legend */}
      {activeIndicators.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 border-t border-white/5 text-[10px] text-[#8888AA]">
          {showMA7 && <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#FFD93D] rounded" />MA7</span>}
          {showMA25 && <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#FF6B6B] rounded" />MA25</span>}
          {showMA99 && <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#9B59B6] rounded" />MA99</span>}
          {showEMA12 && <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#00D4FF] rounded" />EMA12</span>}
          {showEMA26 && <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#FF9F43] rounded" />EMA26</span>}
          {showBB && <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#00D4FF] rounded" />BB(20,2)</span>}
          {logScale && <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#00FF88] rounded" />Log</span>}
        </div>
      )}
    </div>
  );
}
