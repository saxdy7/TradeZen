'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCrypto } from '@/contexts/CryptoContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { fetchBinancePrice, MAIN_SYMBOLS, COIN_NAMES, COIN_ICONS } from '@/lib/binance';
import PriceCard from '@/components/crypto/PriceCard';
import TradingChart from '@/components/charts/TradingChart';
import {
  Activity, TrendingUp, TrendingDown, Wallet, Globe2, BarChart3, Bitcoin, DollarSign,
  Coins, Brain, Bell, Eye, Zap, ArrowRight, ArrowUpRight, ArrowDownRight,
  Clock, Flame, LayoutGrid, PieChart, Volume2, Sparkles, RefreshCw,
  ExternalLink, ChevronRight, Star, Hash,
} from 'lucide-react';
import type { PortfolioHolding } from '@/types';
import CryptoNews from '@/components/crypto/CryptoNews';

// ───── Helpers ─────
const formatB = (n: number) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
};

const formatPrice = (p: number) => p >= 1 ? p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : p.toFixed(6);

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 6) return { text: 'Burning the midnight oil', emoji: '🌙' };
  if (h < 12) return { text: 'Good morning, trader', emoji: '☀️' };
  if (h < 17) return { text: 'Good afternoon, trader', emoji: '🌤️' };
  if (h < 21) return { text: 'Good evening, trader', emoji: '🌆' };
  return { text: 'Night owl mode', emoji: '🦉' };
}

// Allocation colors for portfolio donut
const ALLOC_COLORS = ['#00FF88', '#00D4FF', '#FFD93D', '#FF6B6B', '#6C5CE7', '#FD79A8', '#F7931A', '#627EEA'];

export default function DashboardPage() {
  const { tickers, tickerList, isConnected, globalMarket, coinMarketData } = useCrypto();
  const { holdings } = usePortfolio();

  const [sentiment, setSentiment] = useState<{ value: number; label: string }>({ value: 50, label: 'Neutral' });
  const [enrichedHoldings, setEnrichedHoldings] = useState<PortfolioHolding[]>([]);
  const [selectedChart, setSelectedChart] = useState('BTCUSDT');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAllGainers, setShowAllGainers] = useState(false);
  const [showAllLosers, setShowAllLosers] = useState(false);
  const greeting = getGreeting();

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch live Fear & Greed index
  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const res = await fetch('https://api.alternative.me/fng/?limit=1');
        const json = await res.json();
        if (json.data?.[0]) {
          setSentiment({ value: parseInt(json.data[0].value, 10), label: json.data[0].value_classification });
        }
      } catch { /* Keep default */ }
    };
    fetchSentiment();
  }, []);

  // Enrich portfolio holdings with live prices
  useEffect(() => {
    const enrich = async () => {
      if (holdings.length === 0) { setEnrichedHoldings([]); return; }
      const enriched = await Promise.all(
        holdings.map(async (h) => {
          const wsPrice = tickers[`${h.coin_symbol.toLowerCase()}usdt`];
          const currentPrice = wsPrice ? parseFloat(wsPrice.price) : await fetchBinancePrice(`${h.coin_symbol}USDT`);
          const currentValue = currentPrice * h.amount;
          const investedValue = h.buy_price * h.amount;
          const pnl = currentValue - investedValue;
          const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
          return { ...h, current_price: currentPrice, current_value: currentValue, pnl, pnl_percent: pnlPercent };
        })
      );
      setEnrichedHoldings(enriched);
    };
    enrich();
  }, [holdings, tickers]);

  // Derived data
  const allTickers = useMemo(() =>
    Object.values(tickers)
      .map((t) => ({
        symbol: t.symbol,
        name: COIN_NAMES[t.symbol] || t.symbol.replace('usdt', '').toUpperCase(),
        icon: COIN_ICONS[t.symbol] || '●',
        price: parseFloat(t.price),
        change: parseFloat(t.priceChangePercent),
        volume: parseFloat(t.quoteVolume),
        high: parseFloat(t.highPrice),
        low: parseFloat(t.lowPrice),
      }))
      .sort((a, b) => b.change - a.change),
    [tickers]
  );

  const gainers = allTickers.filter((t) => t.change > 0);
  const losers = [...allTickers].sort((a, b) => a.change - b.change).filter((t) => t.change < 0);
  const volumeLeaders = [...allTickers].sort((a, b) => b.volume - a.volume).slice(0, 5);
  const totalMarketVolume = allTickers.reduce((s, t) => s + t.volume, 0);

  // Trending: highest absolute change
  const trending = [...allTickers].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 8);

  // Portfolio summary
  const totalPortfolioValue = enrichedHoldings.reduce((s, h) => s + (h.current_value || 0), 0);
  const totalInvested = enrichedHoldings.reduce((s, h) => s + h.buy_price * h.amount, 0);
  const totalPnl = totalPortfolioValue - totalInvested;
  const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  // Portfolio allocation data
  const portfolioAllocation = useMemo(() => {
    if (totalPortfolioValue === 0) return [];
    return enrichedHoldings
      .filter((h) => (h.current_value || 0) > 0)
      .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
      .map((h, i) => ({
        symbol: h.coin_symbol,
        value: h.current_value || 0,
        percent: ((h.current_value || 0) / totalPortfolioValue) * 100,
        color: ALLOC_COLORS[i % ALLOC_COLORS.length],
      }));
  }, [enrichedHoldings, totalPortfolioValue]);

  const mainTickers = tickerList.filter((t) => MAIN_SYMBOLS.includes(t.symbol));

  // Market overview — categorize by change
  const marketOverview = useMemo(() => {
    const bullish = allTickers.filter((t) => t.change > 3).length;
    const mildBull = allTickers.filter((t) => t.change > 0 && t.change <= 3).length;
    const mildBear = allTickers.filter((t) => t.change < 0 && t.change >= -3).length;
    const bearish = allTickers.filter((t) => t.change < -3).length;
    const total = allTickers.length || 1;
    return { bullish, mildBull, mildBear, bearish, total };
  }, [allTickers]);

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* ─── Header with Greeting ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{greeting.emoji}</span>
            <h1 className="text-xl lg:text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
              {greeting.text}
            </h1>
          </div>
          <p className="text-xs text-[#8888AA]">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            {' • '}
            <span className="text-white/50">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            {' • Real-time data from Binance & CoinGecko'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12121A] border border-white/5">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00FF88]' : 'bg-red-400'} animate-pulse`} />
            <span className="text-xs text-[#8888AA]">
              {isConnected ? `${Object.keys(tickers).length} coins live` : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Quick Actions ─── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: Brain, label: 'AI Mentor', href: '/mentor', color: '#00D4FF', desc: 'Ask anything' },
          { icon: Wallet, label: 'Portfolio', href: '/portfolio', color: '#FFD93D', desc: 'Track P&L' },
          { icon: Bell, label: 'Alerts', href: '/alerts', color: '#6C5CE7', desc: 'Set targets' },
          { icon: Eye, label: 'Market', href: '/market', color: '#00FF88', desc: '50 coins' },
        ].map((action) => (
          <Link key={action.label} href={action.href}>
            <motion.div whileHover={{ y: -2 }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#12121A] border border-white/5 hover:border-white/10 transition-all group cursor-pointer">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${action.color}12` }}>
                <action.icon className="w-4 h-4" style={{ color: action.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white">{action.label}</p>
                <p className="text-[10px] text-[#666]">{action.desc}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#333] group-hover:text-[#8888AA] transition-colors" />
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* ─── Global Market Stats Bar ─── */}
      {globalMarket && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 lg:gap-3"
        >
          {[
            { icon: Globe2, label: 'Total Market Cap', value: formatB(globalMarket.totalMarketCap), color: '#00D4FF' },
            { icon: BarChart3, label: '24h Volume', value: formatB(globalMarket.totalVolume24h), color: '#00FF88' },
            { icon: Bitcoin, label: 'BTC Dominance', value: `${globalMarket.btcDominance.toFixed(1)}%`, color: '#F7931A' },
            { icon: DollarSign, label: 'ETH Dominance', value: `${globalMarket.ethDominance.toFixed(1)}%`, color: '#627EEA' },
            { icon: Coins, label: 'Active Coins', value: globalMarket.activeCryptocurrencies.toLocaleString(), color: '#FFD93D' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#12121A] border border-white/5">
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              <div>
                <p className="text-[10px] text-[#8888AA]">{stat.label}</p>
                <p className="text-xs font-semibold text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ─── Market Pulse (mini heatmap) ─── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-xl border border-white/5 bg-[#12121A] p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-[#00D4FF]" />
            <h3 className="text-sm font-medium text-white">Market Pulse</h3>
            <span className="text-[10px] text-[#666]">{allTickers.length} coins tracked</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#00FF88]" /> Strong Bull ({marketOverview.bullish})</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#00FF88]/40" /> Mild Bull ({marketOverview.mildBull})</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400/40" /> Mild Bear ({marketOverview.mildBear})</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Strong Bear ({marketOverview.bearish})</span>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {allTickers.map((t) => {
            const bg = t.change > 3 ? 'bg-[#00FF88]' : t.change > 0 ? 'bg-[#00FF88]/30' : t.change > -3 ? 'bg-red-400/30' : 'bg-red-500';
            return (
              <motion.button key={t.symbol} whileHover={{ scale: 1.3 }} title={`${t.name}: ${t.change >= 0 ? '+' : ''}${t.change.toFixed(2)}%`}
                onClick={() => setSelectedChart(t.symbol.toUpperCase().replace('USDT', '') + 'USDT')}
                className={`w-4 h-4 rounded-sm ${bg} cursor-pointer transition-all`}
              />
            );
          })}
        </div>
        {/* Market overview bar */}
        <div className="mt-3 h-2.5 rounded-full bg-[#0A0A0F] overflow-hidden flex">
          <div className="h-full bg-[#00FF88]" style={{ width: `${(marketOverview.bullish / marketOverview.total) * 100}%` }} />
          <div className="h-full bg-[#00FF88]/40" style={{ width: `${(marketOverview.mildBull / marketOverview.total) * 100}%` }} />
          <div className="h-full bg-red-400/40" style={{ width: `${(marketOverview.mildBear / marketOverview.total) * 100}%` }} />
          <div className="h-full bg-red-500" style={{ width: `${(marketOverview.bearish / marketOverview.total) * 100}%` }} />
        </div>
      </motion.div>

      {/* ─── Trending Coins Ticker ─── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-xl border border-white/5 bg-[#12121A] p-3"
      >
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-4 h-4 text-[#FFD93D]" />
          <h3 className="text-xs font-medium text-white">Trending Now</h3>
          <span className="text-[10px] text-[#666]">Highest volatility</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {trending.map((t, i) => (
            <motion.button key={t.symbol} whileHover={{ y: -2 }}
              onClick={() => setSelectedChart(t.symbol.toUpperCase().replace('USDT', '') + 'USDT')}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0A0A0F] border border-white/5 hover:border-white/10 transition-all cursor-pointer"
            >
              <span className="text-[10px] font-bold text-[#333]">#{i + 1}</span>
              <span className="text-xs">{t.icon}</span>
              <span className="text-xs font-medium text-white">{t.name}</span>
              <span className={`text-[10px] font-medium ${t.change >= 0 ? 'text-[#00FF88]' : 'text-red-400'}`}>
                {t.change >= 0 ? '+' : ''}{t.change.toFixed(2)}%
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ─── Price Cards — 4 main coins ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainTickers.length > 0
          ? mainTickers.map((ticker) => (
              <div key={ticker.symbol} onClick={() => setSelectedChart(ticker.symbol.toUpperCase())} className="cursor-pointer">
                <PriceCard
                  symbol={ticker.symbol}
                  name={ticker.name}
                  price={ticker.price}
                  change={ticker.priceChangePercent}
                  icon={ticker.icon}
                />
              </div>
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl border border-white/5 bg-[#12121A] animate-pulse" />
            ))}
      </div>

      {/* ─── Chart + Side Cards ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <TradingChart symbol={selectedChart} interval="1h" />
        </div>

        <div className="space-y-4">
          {/* Market Sentiment */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-white/5 bg-[#12121A] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-[#00D4FF]" />
              <h3 className="text-sm font-medium text-white">Fear & Greed Index</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a24" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none"
                    stroke={sentiment.value >= 60 ? '#00FF88' : sentiment.value >= 40 ? '#FFD93D' : '#FF6B6B'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(sentiment.value / 100) * 264} 264`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-bold font-[family-name:var(--font-space-grotesk)] ${
                    sentiment.value >= 60 ? 'text-[#00FF88]' : sentiment.value >= 40 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{sentiment.value}</span>
                </div>
              </div>
              <div>
                <p className={`text-sm font-medium ${
                  sentiment.value >= 60 ? 'text-[#00FF88]' : sentiment.value >= 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>{sentiment.label}</p>
                <p className="text-[10px] text-[#666] mt-0.5">
                  {sentiment.value >= 75 ? 'Market may be overheated' : sentiment.value >= 50 ? 'Cautiously optimistic' : sentiment.value >= 25 ? 'Opportunity zone' : 'Extreme fear — potential bottom'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Volume Leaders */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-white/5 bg-[#12121A] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-4 h-4 text-[#6C5CE7]" />
              <h3 className="text-sm font-medium text-white">Volume Leaders</h3>
            </div>
            <div className="space-y-2">
              {volumeLeaders.map((v, i) => {
                const pct = totalMarketVolume > 0 ? (v.volume / totalMarketVolume) * 100 : 0;
                return (
                  <div key={v.symbol} className="cursor-pointer hover:bg-white/[0.02] rounded px-1 py-0.5 transition-colors"
                    onClick={() => setSelectedChart(v.symbol.toUpperCase().replace('USDT', '') + 'USDT')}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#333]">#{i + 1}</span>
                        <span className="text-sm">{v.icon}</span>
                        <span className="text-xs text-white font-medium">{v.name}</span>
                      </div>
                      <span className="text-[10px] text-[#8888AA]">{formatB(v.volume)}</span>
                    </div>
                    <div className="h-1 rounded-full bg-[#0A0A0F]">
                      <div className="h-full rounded-full bg-[#6C5CE7]" style={{ width: `${Math.min(pct * 2, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Top Gainers */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-white/5 bg-[#12121A] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00FF88]" />
                <h3 className="text-sm font-medium text-white">Top Gainers (24h)</h3>
              </div>
              {gainers.length > 5 && (
                <button onClick={() => setShowAllGainers(!showAllGainers)} className="text-[10px] text-[#00FF88] hover:underline">
                  {showAllGainers ? 'Show less' : `+${gainers.length - 5} more`}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {(showAllGainers ? gainers : gainers.slice(0, 5)).map((g) => (
                <div key={g.symbol} className="flex justify-between items-center cursor-pointer hover:bg-white/[0.02] rounded px-1 py-0.5 transition-colors"
                  onClick={() => setSelectedChart(g.symbol.toUpperCase().replace('USDT', '') + 'USDT')}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{g.icon}</span>
                    <div>
                      <span className="text-xs text-white font-medium">{g.name}</span>
                      <span className="text-[10px] text-[#8888AA] ml-1">${formatPrice(g.price)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-[#00FF88]" />
                    <span className="text-xs font-medium text-[#00FF88]">+{g.change.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
              {gainers.length === 0 && <div className="text-xs text-[#8888AA] text-center py-2">Loading coins...</div>}
            </div>
          </motion.div>

          {/* Top Losers */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-white/5 bg-[#12121A] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-medium text-white">Top Losers (24h)</h3>
              </div>
              {losers.length > 5 && (
                <button onClick={() => setShowAllLosers(!showAllLosers)} className="text-[10px] text-red-400 hover:underline">
                  {showAllLosers ? 'Show less' : `+${losers.length - 5} more`}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {(showAllLosers ? losers : losers.slice(0, 5)).map((l) => (
                <div key={l.symbol} className="flex justify-between items-center cursor-pointer hover:bg-white/[0.02] rounded px-1 py-0.5 transition-colors"
                  onClick={() => setSelectedChart(l.symbol.toUpperCase().replace('USDT', '') + 'USDT')}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{l.icon}</span>
                    <div>
                      <span className="text-xs text-white font-medium">{l.name}</span>
                      <span className="text-[10px] text-[#8888AA] ml-1">${formatPrice(l.price)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowDownRight className="w-3 h-3 text-red-400" />
                    <span className="text-xs font-medium text-red-400">{l.change.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
              {losers.length === 0 && <div className="text-xs text-[#8888AA] text-center py-2">Loading coins...</div>}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Portfolio + Allocation Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Portfolio Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-white/5 bg-[#12121A] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#FFD93D]" />
              <h3 className="text-sm font-medium text-white">Portfolio Summary</h3>
            </div>
            <Link href="/portfolio" className="text-[10px] text-[#00FF88] hover:underline flex items-center gap-0.5">
              Manage <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          {enrichedHoldings.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-[#8888AA]">Total Value</p>
                  <p className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                    ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={`px-2.5 py-1 rounded-lg ${totalPnl >= 0 ? 'bg-[#00FF88]/10' : 'bg-red-400/10'}`}>
                  <p className={`text-xs font-bold ${totalPnl >= 0 ? 'text-[#00FF88]' : 'text-red-400'}`}>
                    {totalPnl >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%
                  </p>
                  <p className={`text-[10px] ${totalPnl >= 0 ? 'text-[#00FF88]/70' : 'text-red-400/70'}`}>
                    {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-[#0A0A0F]">
                  <p className="text-[10px] text-[#8888AA]">Invested</p>
                  <p className="text-sm font-semibold text-white">${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0A0A0F]">
                  <p className="text-[10px] text-[#8888AA]">Holdings</p>
                  <p className="text-sm font-semibold text-white">{enrichedHoldings.length} coins</p>
                </div>
              </div>
              <div className="pt-3 border-t border-white/5 space-y-1.5">
                {enrichedHoldings.slice(0, 5).map((h) => (
                  <div key={h.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{COIN_ICONS[`${h.coin_symbol.toLowerCase()}usdt`] || '●'}</span>
                      <span className="text-xs text-white">{h.coin_symbol}</span>
                      <span className="text-[10px] text-[#555]">{h.amount} units</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-white">${(h.current_value || 0).toFixed(2)}</span>
                      <span className={`text-[10px] ml-1.5 ${(h.pnl || 0) >= 0 ? 'text-[#00FF88]' : 'text-red-400'}`}>
                        {(h.pnl || 0) >= 0 ? '+' : ''}{(h.pnl_percent || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                {enrichedHoldings.length > 5 && (
                  <Link href="/portfolio" className="block text-[10px] text-[#8888AA] text-center hover:text-[#00FF88] transition-colors">
                    +{enrichedHoldings.length - 5} more → View all
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Wallet className="w-8 h-8 text-[#8888AA]/30 mx-auto mb-2" />
              <p className="text-xs text-[#8888AA] mb-2">No holdings yet</p>
              <Link href="/portfolio" className="inline-flex items-center gap-1 text-xs text-[#00FF88] hover:underline">
                Add your first coin <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </motion.div>

        {/* Portfolio Allocation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border border-white/5 bg-[#12121A] p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-[#FD79A8]" />
            <h3 className="text-sm font-medium text-white">Portfolio Allocation</h3>
          </div>
          {portfolioAllocation.length > 0 ? (
            <div className="flex items-center gap-6">
              {/* Simple donut via SVG */}
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    let offset = 0;
                    return portfolioAllocation.map((a) => {
                      const dash = (a.percent / 100) * 251.2;
                      const el = (
                        <circle key={a.symbol} cx="50" cy="50" r="40" fill="none" stroke={a.color} strokeWidth="12"
                          strokeDasharray={`${dash} ${251.2 - dash}`} strokeDashoffset={-offset} strokeLinecap="round"
                        />
                      );
                      offset += dash;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-[10px] text-[#8888AA]">Total</p>
                    <p className="text-xs font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                      ${totalPortfolioValue >= 1000 ? (totalPortfolioValue / 1000).toFixed(1) + 'K' : totalPortfolioValue.toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {portfolioAllocation.slice(0, 6).map((a) => (
                  <div key={a.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                      <span className="text-xs text-white">{a.symbol}</span>
                    </div>
                    <span className="text-xs text-[#8888AA]">{a.percent.toFixed(1)}%</span>
                  </div>
                ))}
                {portfolioAllocation.length > 6 && (
                  <p className="text-[10px] text-[#666]">+{portfolioAllocation.length - 6} others</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <PieChart className="w-8 h-8 text-[#8888AA]/30 mx-auto mb-2" />
              <p className="text-xs text-[#8888AA]">Add holdings to see allocation</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── News Feed ─── */}
      <CryptoNews maxItems={8} />
    </div>
  );
}
