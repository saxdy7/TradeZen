'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCrypto } from '@/contexts/CryptoContext';
import Link from 'next/link';
import TradingChart from '@/components/charts/TradingChart';
import OrderBook from '@/components/trading/OrderBook';
import RecentTradesPanel from '@/components/trading/RecentTrades';
import DepthChart from '@/components/trading/DepthChart';
import {
  X, BookOpen, Clock, ChevronDown, BarChart3, ExternalLink, Search,
  TrendingUp, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown,
  LayoutGrid, LayoutList, Rows3, Flame, Star, StarOff,
  Globe2, Activity, Zap, Volume2, Target, Filter, RefreshCw,
  ChevronRight, Hash, PieChart, Eye, Brain, Wallet, Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { COIN_NAMES, COIN_ICONS, type CoinMarketInfo } from '@/lib/binance';
import type { CryptoTicker } from '@/types';
import CryptoNews from '@/components/crypto/CryptoNews';

// ───── Types ─────
type TradingTab = 'orderbook' | 'trades' | 'depth';
type ViewMode = 'table' | 'grid' | 'compact';
type SortField = 'rank' | 'name' | 'price' | 'change' | 'volume' | 'marketCap' | 'ath';
type SortDir = 'asc' | 'desc';
type MarketTab = 'all' | 'gainers' | 'losers' | 'trending' | 'watchlist';
type CategoryFilter = 'all' | 'layer1' | 'layer2' | 'defi' | 'meme' | 'ai' | 'gaming';

// ───── Coin category mapping ─────
const COIN_CATEGORIES: Record<string, CategoryFilter[]> = {
  btcusdt: ['layer1'], ethusdt: ['layer1'], bnbusdt: ['layer1'], solusdt: ['layer1'],
  xrpusdt: ['layer1'], adausdt: ['layer1'], avaxusdt: ['layer1'], dotusdt: ['layer1'],
  ltcusdt: ['layer1'], atomusdt: ['layer1'], etcusdt: ['layer1'], xlmusdt: ['layer1'],
  nearusdt: ['layer1'], aptusdt: ['layer1'], trxusdt: ['layer1'], bchusdt: ['layer1'],
  icpusdt: ['layer1'], suiusdt: ['layer1'], hbarusdt: ['layer1'], seiusdt: ['layer1'],
  tiausdt: ['layer1'], ftmusdt: ['layer1'], thetausdt: ['layer1'], algousdt: ['layer1'],
  stxusdt: ['layer1'],
  maticusdt: ['layer2'], arbusdt: ['layer2'], opusdt: ['layer2'], imxusdt: ['layer2'],
  linkusdt: ['defi'], uniusdt: ['defi'], aaveusdt: ['defi'], mkrusdt: ['defi'],
  snxusdt: ['defi'], ldousdt: ['defi'], pendleusdt: ['defi'], injusdt: ['defi'],
  runeusdt: ['defi'], jupusdt: ['defi'], ondousdt: ['defi'], enausdt: ['defi'],
  dogeusdt: ['meme'], shibusdt: ['meme'], pepeusdt: ['meme'], wldusdt: ['meme'],
  fetusdt: ['ai'], renderusdt: ['ai'], grtusdt: ['ai'],
  filusdt: ['defi'], vetusdt: ['layer1'],
};

const CATEGORY_LABELS: Record<CategoryFilter, { label: string; color: string }> = {
  all: { label: 'All', color: '#8888AA' },
  layer1: { label: 'Layer 1', color: '#00FF88' },
  layer2: { label: 'Layer 2', color: '#00D4FF' },
  defi: { label: 'DeFi', color: '#6C5CE7' },
  meme: { label: 'Meme', color: '#FFD93D' },
  ai: { label: 'AI', color: '#FD79A8' },
  gaming: { label: 'Gaming', color: '#FF6B6B' },
};

// ───── Sparkline ─────
function Sparkline({ data, color, width = 80, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 2) - 1}`).join(' ');
  return (
    <svg width={width} height={height} className="inline-block">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

// ───── Format helpers ─────
const formatPrice = (p: number) => p >= 1 ? p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : p.toFixed(6);
const formatB = (n: number) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
};

// ═══════════════════════════════════════════════
// MARKET PAGE
// ═══════════════════════════════════════════════
export default function MarketPage() {
  const { tickers, isConnected, coinMarketData, globalMarket } = useCrypto();
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [tradingTab, setTradingTab] = useState<TradingTab>('orderbook');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [activeTab, setActiveTab] = useState<MarketTab>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  // Load watchlist from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tradezen-watchlist');
      if (saved) setWatchlist(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  const toggleWatchlist = (symbol: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol); else next.add(symbol);
      localStorage.setItem('tradezen-watchlist', JSON.stringify([...next]));
      return next;
    });
  };

  const selectedSymbol = selectedCoin?.toUpperCase() || '';

  // Build ticker array with enriched data
  const allCoins = useMemo(() => {
    return Object.values(tickers).map((t) => {
      const marketInfo = coinMarketData?.[t.symbol];
      return {
        ...t,
        name: COIN_NAMES[t.symbol] || t.symbol.replace('usdt', '').toUpperCase(),
        icon: COIN_ICONS[t.symbol] || '●',
        changeNum: parseFloat(t.priceChangePercent),
        priceNum: parseFloat(t.price),
        volumeNum: parseFloat(t.quoteVolume),
        highNum: parseFloat(t.highPrice),
        lowNum: parseFloat(t.lowPrice),
        marketCap: marketInfo?.marketCap || 0,
        marketCapRank: marketInfo?.marketCapRank || 999,
        sparkline7d: marketInfo?.sparkline7d || [],
        ath: marketInfo?.ath || 0,
        athChangePercent: marketInfo?.athChangePercent || 0,
        categories: COIN_CATEGORIES[t.symbol] || [],
      };
    });
  }, [tickers, coinMarketData]);

  // Filter + sort
  const filteredCoins = useMemo(() => {
    let arr = [...allCoins];

    // Search
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter((t) => t.name.toLowerCase().includes(q) || t.symbol.includes(q));
    }

    // Tab filter
    if (activeTab === 'gainers') arr = arr.filter((t) => t.changeNum > 0);
    else if (activeTab === 'losers') arr = arr.filter((t) => t.changeNum < 0);
    else if (activeTab === 'trending') arr = [...arr].sort((a, b) => Math.abs(b.changeNum) - Math.abs(a.changeNum));
    else if (activeTab === 'watchlist') arr = arr.filter((t) => watchlist.has(t.symbol));

    // Category filter
    if (categoryFilter !== 'all') {
      arr = arr.filter((t) => t.categories.includes(categoryFilter));
    }

    // Sort
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'rank': cmp = a.marketCapRank - b.marketCapRank; break;
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'price': cmp = a.priceNum - b.priceNum; break;
        case 'change': cmp = a.changeNum - b.changeNum; break;
        case 'volume': cmp = a.volumeNum - b.volumeNum; break;
        case 'marketCap': cmp = a.marketCap - b.marketCap; break;
        case 'ath': cmp = a.athChangePercent - b.athChangePercent; break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return arr;
  }, [allCoins, search, activeTab, categoryFilter, sortField, sortDir, watchlist]);

  // Market summary stats
  const marketStats = useMemo(() => {
    const total = allCoins.length;
    const bullish = allCoins.filter((t) => t.changeNum > 0).length;
    const bearish = total - bullish;
    const avgChange = total > 0 ? allCoins.reduce((s, t) => s + t.changeNum, 0) / total : 0;
    const totalVol = allCoins.reduce((s, t) => s + t.volumeNum, 0);
    const topGainer = [...allCoins].sort((a, b) => b.changeNum - a.changeNum)[0];
    const topLoser = [...allCoins].sort((a, b) => a.changeNum - b.changeNum)[0];
    return { total, bullish, bearish, avgChange, totalVol, topGainer, topLoser };
  }, [allCoins]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-[#555]" />;
    return sortDir === 'desc' ? <ArrowDown className="w-3 h-3 text-[#00FF88]" /> : <ArrowUp className="w-3 h-3 text-[#00FF88]" />;
  };

  const tabs: { key: MarketTab; label: string; icon: React.ElementType; color: string }[] = [
    { key: 'all', label: 'All', icon: LayoutGrid, color: '#8888AA' },
    { key: 'gainers', label: 'Gainers', icon: TrendingUp, color: '#00FF88' },
    { key: 'losers', label: 'Losers', icon: TrendingDown, color: '#FF6B6B' },
    { key: 'trending', label: 'Trending', icon: Flame, color: '#FFD93D' },
    { key: 'watchlist', label: `Watchlist (${watchlist.size})`, icon: Star, color: '#00D4FF' },
  ];

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
            Market
          </h1>
          <p className="text-xs text-[#8888AA] mt-1">
            50 cryptocurrencies • Real-time data from Binance & CoinGecko
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick actions */}
          <div className="flex items-center gap-1.5">
            <Link href="/mentor" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#00D4FF]/10 text-[#00D4FF] text-xs hover:bg-[#00D4FF]/15 transition-colors">
              <Brain className="w-3 h-3" /> AI Mentor
            </Link>
            <Link href="/alerts" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#6C5CE7]/10 text-[#6C5CE7] text-xs hover:bg-[#6C5CE7]/15 transition-colors">
              <Target className="w-3 h-3" /> Alerts
            </Link>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12121A] border border-white/5">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00FF88]' : 'bg-red-400'} animate-pulse`} />
            <span className="text-xs text-[#8888AA]">{Object.keys(tickers).length} coins live</span>
          </div>
        </div>
      </div>

      {/* ─── Market Summary Strip ─── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2"
      >
        {globalMarket && (
          <>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#12121A] border border-white/5">
              <Globe2 className="w-4 h-4 text-[#00D4FF]" />
              <div>
                <p className="text-[10px] text-[#8888AA]">Market Cap</p>
                <p className="text-xs font-semibold text-white">{formatB(globalMarket.totalMarketCap)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#12121A] border border-white/5">
              <Volume2 className="w-4 h-4 text-[#00FF88]" />
              <div>
                <p className="text-[10px] text-[#8888AA]">24h Volume</p>
                <p className="text-xs font-semibold text-white">{formatB(globalMarket.totalVolume24h)}</p>
              </div>
            </div>
          </>
        )}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#12121A] border border-white/5">
          <TrendingUp className="w-4 h-4 text-[#00FF88]" />
          <div>
            <p className="text-[10px] text-[#8888AA]">Bullish</p>
            <p className="text-xs font-semibold text-[#00FF88]">{marketStats.bullish} coins</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#12121A] border border-white/5">
          <TrendingDown className="w-4 h-4 text-red-400" />
          <div>
            <p className="text-[10px] text-[#8888AA]">Bearish</p>
            <p className="text-xs font-semibold text-red-400">{marketStats.bearish} coins</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#12121A] border border-white/5">
          <Activity className="w-4 h-4 text-[#FFD93D]" />
          <div>
            <p className="text-[10px] text-[#8888AA]">Avg Change</p>
            <p className={`text-xs font-semibold ${marketStats.avgChange >= 0 ? 'text-[#00FF88]' : 'text-red-400'}`}>
              {marketStats.avgChange >= 0 ? '+' : ''}{marketStats.avgChange.toFixed(2)}%
            </p>
          </div>
        </div>
        {marketStats.topGainer && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#12121A] border border-white/5">
            <Zap className="w-4 h-4 text-[#00FF88]" />
            <div>
              <p className="text-[10px] text-[#8888AA]">Top Gainer</p>
              <p className="text-xs font-semibold text-[#00FF88]">
                {marketStats.topGainer.icon} {marketStats.topGainer.name} +{marketStats.topGainer.changeNum.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ─── Market Pulse Bar ─── */}
      <div className="rounded-lg border border-white/5 bg-[#12121A] p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-[#8888AA]">Market Pulse — Bull/Bear distribution</p>
          <p className="text-[10px] text-[#666]">{marketStats.bullish} green • {marketStats.bearish} red</p>
        </div>
        <div className="flex gap-0.5 flex-wrap">
          {allCoins
            .sort((a, b) => b.changeNum - a.changeNum)
            .map((t) => {
              const bg = t.changeNum > 5 ? 'bg-[#00FF88]'
                : t.changeNum > 0 ? 'bg-[#00FF88]/30'
                : t.changeNum > -5 ? 'bg-red-400/30'
                : 'bg-red-500';
              return (
                <motion.button key={t.symbol} whileHover={{ scale: 1.4 }}
                  title={`${t.name}: ${t.changeNum >= 0 ? '+' : ''}${t.changeNum.toFixed(2)}%`}
                  onClick={() => setSelectedCoin(t.symbol)}
                  className={`w-3.5 h-3.5 rounded-sm ${bg} cursor-pointer transition-all`}
                />
              );
            })}
        </div>
        <div className="mt-2 h-2 rounded-full bg-[#0A0A0F] overflow-hidden flex">
          <div className="h-full bg-[#00FF88]" style={{ width: `${(marketStats.bullish / (marketStats.total || 1)) * 100}%` }} />
          <div className="h-full bg-red-400" style={{ width: `${(marketStats.bearish / (marketStats.total || 1)) * 100}%` }} />
        </div>
      </div>

      {/* ─── Trading View (when coin selected) ─── */}
      <AnimatePresence>
        {selectedCoin && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-[#00D4FF]" />
                <div className="flex items-center gap-2">
                  <span className="text-lg">{COIN_ICONS[selectedCoin] || '●'}</span>
                  <h2 className="text-sm font-medium text-white font-[family-name:var(--font-space-grotesk)]">
                    {COIN_NAMES[selectedCoin] || selectedSymbol.replace('USDT', '')} / USDT
                  </h2>
                  {(() => {
                    const t = tickers[selectedCoin];
                    if (!t) return null;
                    const change = parseFloat(t.priceChangePercent);
                    return (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${change >= 0 ? 'bg-[#00FF88]/10 text-[#00FF88]' : 'bg-red-400/10 text-red-400'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleWatchlist(selectedCoin)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-[#FFD93D] hover:bg-white/5 rounded-md transition-colors cursor-pointer"
                >
                  {watchlist.has(selectedCoin) ? <Star className="w-3 h-3 fill-[#FFD93D]" /> : <StarOff className="w-3 h-3" />}
                  {watchlist.has(selectedCoin) ? 'Saved' : 'Watch'}
                </button>
                <button onClick={() => router.push(`/coin/${selectedSymbol}`)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-[#00D4FF] hover:text-white rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" /> Details
                </button>
                <button onClick={() => setSelectedCoin(null)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-[#8888AA] hover:text-white rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" /> Close
                </button>
              </div>
            </div>

            {/* Coin quick stats */}
            {(() => {
              const t = tickers[selectedCoin];
              const m = coinMarketData?.[selectedCoin];
              if (!t) return null;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
                  {[
                    { label: 'Price', value: `$${formatPrice(parseFloat(t.price))}`, color: 'text-white' },
                    { label: '24h High', value: `$${formatPrice(parseFloat(t.highPrice))}`, color: 'text-[#00FF88]' },
                    { label: '24h Low', value: `$${formatPrice(parseFloat(t.lowPrice))}`, color: 'text-red-400' },
                    { label: '24h Volume', value: formatB(parseFloat(t.quoteVolume)), color: 'text-[#00D4FF]' },
                    { label: 'Market Cap', value: m?.marketCap ? formatB(m.marketCap) : '—', color: 'text-white' },
                    { label: 'ATH', value: m?.ath ? `$${formatPrice(m.ath)}` : '—', color: 'text-[#FFD93D]' },
                  ].map((s) => (
                    <div key={s.label} className="px-3 py-2 rounded-lg bg-[#0A0A0F] border border-white/5">
                      <p className="text-[9px] text-[#8888AA]">{s.label}</p>
                      <p className={`text-xs font-semibold ${s.color} font-[family-name:var(--font-space-grotesk)]`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <TradingChart symbol={selectedSymbol} />
              </div>
              <div className="space-y-0">
                <div className="flex bg-[#12121A] rounded-t-xl border border-b-0 border-white/5">
                  {([
                    { key: 'orderbook' as TradingTab, icon: BookOpen, label: 'Book', color: '#00FF88' },
                    { key: 'trades' as TradingTab, icon: Clock, label: 'Trades', color: '#00D4FF' },
                    { key: 'depth' as TradingTab, icon: BarChart3, label: 'Depth', color: '#FFD93D' },
                  ]).map((tab, i) => (
                    <button key={tab.key} onClick={() => setTradingTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer ${i === 0 ? 'rounded-tl-xl' : i === 2 ? 'rounded-tr-xl' : ''} ${
                        tradingTab === tab.key
                          ? `text-[${tab.color}] bg-[${tab.color}]/5 border-b-2`
                          : 'text-[#8888AA] hover:text-white'
                      }`}
                      style={tradingTab === tab.key ? { color: tab.color, borderBottomColor: tab.color, backgroundColor: `${tab.color}08` } : {}}
                    >
                      <tab.icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div>
                  {tradingTab === 'orderbook' ? <OrderBook symbol={selectedSymbol} />
                    : tradingTab === 'trades' ? <RecentTradesPanel symbol={selectedSymbol} />
                    : <DepthChart symbol={selectedSymbol} />}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Search + Tabs + View Mode + Filters ─── */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 justify-between">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888AA]" />
              <Input
                placeholder="Search by name or symbol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#12121A] border-white/10 text-white placeholder:text-[#555] w-full sm:w-72"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                  <X className="w-3.5 h-3.5 text-[#8888AA] hover:text-white" />
                </button>
              )}
            </div>
            {/* Filter toggle */}
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                showFilters || categoryFilter !== 'all' ? 'border-[#00FF88]/30 bg-[#00FF88]/5 text-[#00FF88]' : 'border-white/10 bg-[#12121A] text-[#8888AA] hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {categoryFilter !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]" />}
            </button>
          </div>
          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex gap-1 bg-[#12121A] rounded-lg p-1 border border-white/5 overflow-x-auto">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.key ? 'bg-white/5 text-white' : 'text-[#8888AA] hover:text-white'
                  }`}
                >
                  <tab.icon className="w-3 h-3" style={activeTab === tab.key ? { color: tab.color } : {}} />
                  {tab.label}
                </button>
              ))}
            </div>
            {/* View mode */}
            <div className="flex gap-0.5 bg-[#12121A] rounded-lg p-1 border border-white/5">
              {([
                { key: 'table' as ViewMode, icon: LayoutList },
                { key: 'grid' as ViewMode, icon: LayoutGrid },
                { key: 'compact' as ViewMode, icon: Rows3 },
              ]).map((v) => (
                <button key={v.key} onClick={() => setViewMode(v.key)}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === v.key ? 'bg-white/10 text-white' : 'text-[#555] hover:text-white'}`}
                >
                  <v.icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-[#12121A] border border-white/5">
                <p className="text-[10px] text-[#8888AA] self-center mr-2">Category:</p>
                {Object.entries(CATEGORY_LABELS).map(([key, { label, color }]) => (
                  <button key={key} onClick={() => setCategoryFilter(key as CategoryFilter)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                      categoryFilter === key ? 'border-white/20 text-white' : 'border-transparent text-[#8888AA] hover:text-white'
                    }`}
                    style={categoryFilter === key ? { backgroundColor: `${color}15`, color } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-[#666]">
            Showing {filteredCoins.length} of {allCoins.length} coins
            {categoryFilter !== 'all' && <span> • Filtered by <span style={{ color: CATEGORY_LABELS[categoryFilter].color }}>{CATEGORY_LABELS[categoryFilter].label}</span></span>}
          </p>
          <p className="text-[10px] text-[#666]">
            Sorted by {sortField} ({sortDir === 'desc' ? '↓' : '↑'})
          </p>
        </div>
      </div>

      {/* ─── COIN LIST — TABLE VIEW ─── */}
      {viewMode === 'table' && (
        <div className="rounded-xl border border-white/5 bg-[#12121A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-center text-xs text-[#555] font-medium px-2 py-3 w-8"></th>
                  <th className="text-left text-xs text-[#8888AA] font-medium px-3 py-3 cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('rank')}>
                    <span className="flex items-center gap-1"># <SortIcon field="rank" /></span>
                  </th>
                  <th className="text-left text-xs text-[#8888AA] font-medium px-3 py-3 cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('name')}>
                    <span className="flex items-center gap-1">Coin <SortIcon field="name" /></span>
                  </th>
                  <th className="text-right text-xs text-[#8888AA] font-medium px-3 py-3 cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('price')}>
                    <span className="flex items-center gap-1 justify-end">Price <SortIcon field="price" /></span>
                  </th>
                  <th className="text-right text-xs text-[#8888AA] font-medium px-3 py-3 cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('change')}>
                    <span className="flex items-center gap-1 justify-end">24h <SortIcon field="change" /></span>
                  </th>
                  <th className="text-center text-xs text-[#8888AA] font-medium px-3 py-3 hidden lg:table-cell">7d</th>
                  <th className="text-right text-xs text-[#8888AA] font-medium px-3 py-3 hidden md:table-cell cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('marketCap')}>
                    <span className="flex items-center gap-1 justify-end">MCap <SortIcon field="marketCap" /></span>
                  </th>
                  <th className="text-right text-xs text-[#8888AA] font-medium px-3 py-3 cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('volume')}>
                    <span className="flex items-center gap-1 justify-end">Volume <SortIcon field="volume" /></span>
                  </th>
                  <th className="text-right text-xs text-[#8888AA] font-medium px-3 py-3 hidden lg:table-cell">24h Range</th>
                  <th className="text-right text-xs text-[#8888AA] font-medium px-3 py-3 hidden xl:table-cell cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('ath')}>
                    <span className="flex items-center gap-1 justify-end">vs ATH <SortIcon field="ath" /></span>
                  </th>
                  <th className="text-center text-xs text-[#8888AA] font-medium px-2 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filteredCoins.map((ticker, index) => {
                  const isPositive = ticker.changeNum >= 0;
                  const sparkColor = isPositive ? '#00FF88' : '#FF4466';
                  const upperSymbol = ticker.symbol.replace('usdt', '').toUpperCase() + 'USDT';
                  // 24h range bar
                  const range = ticker.highNum - ticker.lowNum;
                  const rangePercent = range > 0 ? ((ticker.priceNum - ticker.lowNum) / range) * 100 : 50;
                  return (
                    <motion.tr key={ticker.symbol}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(index * 0.015, 0.5) }}
                      onClick={() => setSelectedCoin(ticker.symbol)}
                      className={`border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors ${
                        selectedCoin === ticker.symbol ? 'bg-[#00FF88]/[0.03]' : ''
                      }`}
                    >
                      {/* Watchlist star */}
                      <td className="px-2 py-3 text-center">
                        <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(ticker.symbol); }} className="cursor-pointer">
                          {watchlist.has(ticker.symbol)
                            ? <Star className="w-3.5 h-3.5 text-[#FFD93D] fill-[#FFD93D]" />
                            : <Star className="w-3.5 h-3.5 text-[#333] hover:text-[#FFD93D] transition-colors" />
                          }
                        </button>
                      </td>
                      {/* Rank */}
                      <td className="px-3 py-3 text-xs text-[#8888AA]">{ticker.marketCapRank < 999 ? ticker.marketCapRank : index + 1}</td>
                      {/* Coin */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{ticker.icon}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-white">{ticker.name}</p>
                              {ticker.categories[0] && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded-full border border-white/5"
                                  style={{ color: CATEGORY_LABELS[ticker.categories[0]]?.color || '#888' }}
                                >
                                  {CATEGORY_LABELS[ticker.categories[0]]?.label || ''}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#666]">{ticker.symbol.replace('usdt', '').toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      {/* Price */}
                      <td className="px-3 py-3 text-right text-sm font-medium text-white font-[family-name:var(--font-space-grotesk)]">
                        ${formatPrice(ticker.priceNum)}
                      </td>
                      {/* 24h Change */}
                      <td className="px-3 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-[#00FF88]' : 'text-red-400'}`}>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isPositive ? '+' : ''}{ticker.changeNum.toFixed(2)}%
                        </span>
                      </td>
                      {/* 7d sparkline */}
                      <td className="px-3 py-3 text-center hidden lg:table-cell">
                        {ticker.sparkline7d.length > 0
                          ? <Sparkline data={ticker.sparkline7d} color={sparkColor} />
                          : <span className="text-[10px] text-[#555]">—</span>
                        }
                      </td>
                      {/* Market Cap */}
                      <td className="px-3 py-3 text-right text-xs text-[#8888AA] hidden md:table-cell">
                        {ticker.marketCap > 0 ? formatB(ticker.marketCap) : '—'}
                      </td>
                      {/* Volume */}
                      <td className="px-3 py-3 text-right text-xs text-[#8888AA]">
                        {formatB(ticker.volumeNum)}
                      </td>
                      {/* 24h Range bar */}
                      <td className="px-3 py-3 text-right hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-red-400/60">${formatPrice(ticker.lowNum)}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-[#0A0A0F] min-w-[40px]">
                            <div className="h-full rounded-full bg-gradient-to-r from-red-400 to-[#00FF88]" style={{ width: `${rangePercent}%` }} />
                          </div>
                          <span className="text-[9px] text-[#00FF88]/60">${formatPrice(ticker.highNum)}</span>
                        </div>
                      </td>
                      {/* vs ATH */}
                      <td className="px-3 py-3 text-right hidden xl:table-cell">
                        {ticker.athChangePercent !== 0 ? (
                          <span className="text-[10px] text-red-400/60">{ticker.athChangePercent.toFixed(1)}%</span>
                        ) : <span className="text-[10px] text-[#555]">—</span>}
                      </td>
                      {/* Action */}
                      <td className="px-2 py-3 text-center">
                        <button onClick={(e) => { e.stopPropagation(); router.push(`/coin/${upperSymbol}`); }}
                          className="p-1 rounded text-[#555] hover:text-[#00D4FF] transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredCoins.length === 0 && (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-[#333] mx-auto mb-2" />
              <p className="text-sm text-[#8888AA]">
                {activeTab === 'watchlist' ? 'Your watchlist is empty. Star coins to add them!' : 'No coins match your filters'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── COIN LIST — GRID VIEW ─── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredCoins.map((ticker, index) => {
            const isPositive = ticker.changeNum >= 0;
            const sparkColor = isPositive ? '#00FF88' : '#FF4466';
            return (
              <motion.div key={ticker.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.5) }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedCoin(ticker.symbol)}
                className={`p-4 rounded-xl border bg-[#12121A] cursor-pointer transition-all group ${
                  selectedCoin === ticker.symbol ? 'border-[#00FF88]/30' : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{ticker.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{ticker.name}</p>
                      <p className="text-[10px] text-[#666]">{ticker.symbol.replace('usdt', '').toUpperCase()}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(ticker.symbol); }} className="cursor-pointer">
                    {watchlist.has(ticker.symbol)
                      ? <Star className="w-4 h-4 text-[#FFD93D] fill-[#FFD93D]" />
                      : <Star className="w-4 h-4 text-[#333] group-hover:text-[#555] transition-colors" />
                    }
                  </button>
                </div>
                <p className="text-lg font-bold text-white font-[family-name:var(--font-space-grotesk)] mb-1">
                  ${formatPrice(ticker.priceNum)}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-[#00FF88]' : 'text-red-400'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{ticker.changeNum.toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-[#666]">Vol: {formatB(ticker.volumeNum)}</span>
                </div>
                {ticker.sparkline7d.length > 0 && (
                  <Sparkline data={ticker.sparkline7d} color={sparkColor} width={200} height={32} />
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] text-[#555]">MCap: {ticker.marketCap > 0 ? formatB(ticker.marketCap) : '—'}</span>
                  {ticker.categories[0] && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full border border-white/5"
                      style={{ color: CATEGORY_LABELS[ticker.categories[0]]?.color || '#888' }}
                    >
                      {CATEGORY_LABELS[ticker.categories[0]]?.label}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
          {filteredCoins.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <Search className="w-8 h-8 text-[#333] mx-auto mb-2" />
              <p className="text-sm text-[#8888AA]">No coins match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* ─── COIN LIST — COMPACT VIEW ─── */}
      {viewMode === 'compact' && (
        <div className="rounded-xl border border-white/5 bg-[#12121A] overflow-hidden divide-y divide-white/[0.03]">
          {filteredCoins.map((ticker, index) => {
            const isPositive = ticker.changeNum >= 0;
            return (
              <motion.div key={ticker.symbol}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(index * 0.01, 0.3) }}
                onClick={() => setSelectedCoin(ticker.symbol)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/[0.02] transition-colors ${
                  selectedCoin === ticker.symbol ? 'bg-[#00FF88]/[0.03]' : ''
                }`}
              >
                <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(ticker.symbol); }} className="cursor-pointer flex-shrink-0">
                  {watchlist.has(ticker.symbol)
                    ? <Star className="w-3 h-3 text-[#FFD93D] fill-[#FFD93D]" />
                    : <Star className="w-3 h-3 text-[#333]" />
                  }
                </button>
                <span className="text-[10px] text-[#555] w-5">{ticker.marketCapRank < 999 ? ticker.marketCapRank : index + 1}</span>
                <span className="text-sm">{ticker.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-white truncate">{ticker.name}</span>
                    <span className="text-[10px] text-[#555]">{ticker.symbol.replace('usdt', '').toUpperCase()}</span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4 flex-shrink-0">
                  <span className="text-xs font-medium text-white font-[family-name:var(--font-space-grotesk)] w-24 text-right">
                    ${formatPrice(ticker.priceNum)}
                  </span>
                  <span className={`text-xs font-medium w-16 text-right ${isPositive ? 'text-[#00FF88]' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{ticker.changeNum.toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-[#666] w-16 text-right hidden sm:block">{formatB(ticker.volumeNum)}</span>
                </div>
              </motion.div>
            );
          })}
          {filteredCoins.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-[#8888AA]">No coins match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Crypto News ─── */}
      <CryptoNews maxItems={12} />
    </div>
  );
}
