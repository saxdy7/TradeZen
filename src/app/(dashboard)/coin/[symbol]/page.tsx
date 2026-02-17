'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { fetchCoinDetail, type CoinDetailInfo, COIN_NAMES, COIN_ICONS, COINGECKO_IDS, fetchBinance24hTicker } from '@/lib/binance';
import { useCrypto } from '@/contexts/CryptoContext';
import TradingChart from '@/components/charts/TradingChart';
import OrderBook from '@/components/trading/OrderBook';
import RecentTrades from '@/components/trading/RecentTrades';
import DepthChart from '@/components/trading/DepthChart';
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Coins,
  Activity,
} from 'lucide-react';

export default function CoinDetailPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params?.symbol as string)?.toUpperCase() || 'BTCUSDT';
  const symbolKey = symbol.replace('USDT', '');
  const { tickers } = useCrypto();

  const [coinDetail, setCoinDetail] = useState<CoinDetailInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orderbook' | 'trades' | 'depth'>('orderbook');
  const [stats24h, setStats24h] = useState<{ highPrice: string; lowPrice: string; volume: string; quoteVolume: string; priceChangePercent: string } | null>(null);

  const ticker = tickers[symbol];
  const coinName = COIN_NAMES[symbolKey as keyof typeof COIN_NAMES] || symbolKey;
  const coinIcon = COIN_ICONS[symbolKey as keyof typeof COIN_ICONS] || '🪙';
  const coingeckoId = COINGECKO_IDS[symbolKey as keyof typeof COINGECKO_IDS];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [detail, stats] = await Promise.all([
        coingeckoId ? fetchCoinDetail(coingeckoId) : Promise.resolve(null),
        fetchBinance24hTicker(symbol),
      ]);
      if (detail) setCoinDetail(detail);
      if (stats) setStats24h(stats);
      setLoading(false);
    };
    load();
  }, [symbol, coingeckoId]);

  const price = ticker ? parseFloat(ticker.c) : 0;
  const change24h = ticker ? parseFloat(ticker.P) : 0;
  const isPositive = change24h >= 0;

  const formatNum = (n: number, decimals = 2) =>
    n >= 1e9 ? `$${(n / 1e9).toFixed(decimals)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(decimals)}M` : `$${n.toLocaleString('en-US', { minimumFractionDigits: decimals })}`;

  return (
    <div className="min-h-screen p-3 lg:p-6 space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex items-center gap-2">
          {coinDetail?.image ? (
            <img src={coinDetail.image} alt={coinName} className="w-8 h-8 rounded-full" />
          ) : (
            <span className="text-2xl">{coinIcon}</span>
          )}
          <div>
            <h1 className="text-lg font-bold text-white font-[family-name:var(--font-space-grotesk)]">{coinName}</h1>
            <p className="text-xs text-[#8888AA]">{symbolKey}/USDT</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
            ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${isPositive ? 'text-[#00FF88] bg-[#00FF88]/10' : 'text-red-400 bg-red-400/10'}`}>
            {isPositive ? '+' : ''}{change24h.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Left: Chart */}
        <div className="xl:col-span-2 space-y-4">
          <TradingChart symbol={symbol} interval="1h" />

          {/* Trading Data Tabs */}
          <div className="rounded-xl border border-white/5 bg-[#12121A] overflow-hidden">
            <div className="flex border-b border-white/5">
              {(['orderbook', 'trades', 'depth'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2.5 text-xs font-medium capitalize transition-colors cursor-pointer ${activeTab === tab ? 'text-[#00FF88] border-b-2 border-[#00FF88] bg-[#00FF88]/5' : 'text-[#8888AA] hover:text-white'}`}
                >{tab === 'orderbook' ? 'Order Book' : tab === 'depth' ? 'Depth' : 'Trades'}</button>
              ))}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {activeTab === 'orderbook' && <OrderBook symbol={symbol} />}
              {activeTab === 'trades' && <RecentTrades symbol={symbol} />}
              {activeTab === 'depth' && <DepthChart symbol={symbol} />}
            </div>
          </div>
        </div>

        {/* Right: Info Panel */}
        <div className="space-y-4">
          {/* 24h Stats */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-white/5 bg-[#12121A] p-4 space-y-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#00D4FF]" />24h Statistics</h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {stats24h && (
                <>
                  <div className="space-y-0.5"><span className="text-[#8888AA]">24h High</span><p className="text-white font-medium">${parseFloat(stats24h.highPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
                  <div className="space-y-0.5"><span className="text-[#8888AA]">24h Low</span><p className="text-white font-medium">${parseFloat(stats24h.lowPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
                  <div className="space-y-0.5"><span className="text-[#8888AA]">24h Volume</span><p className="text-white font-medium">${(parseFloat(stats24h.quoteVolume) / 1e6).toFixed(2)}M</p></div>
                  <div className="space-y-0.5"><span className="text-[#8888AA]">24h Change</span><p className={`font-medium ${parseFloat(stats24h.priceChangePercent) >= 0 ? 'text-[#00FF88]' : 'text-red-400'}`}>{parseFloat(stats24h.priceChangePercent).toFixed(2)}%</p></div>
                </>
              )}
            </div>
          </motion.div>

          {/* Market Data */}
          {coinDetail && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-white/5 bg-[#12121A] p-4 space-y-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Coins className="w-4 h-4 text-[#00FF88]" />Market Data</h2>
              <div className="space-y-2 text-xs">
                {coinDetail.marketCap > 0 && <div className="flex justify-between"><span className="text-[#8888AA]">Market Cap</span><span className="text-white">{formatNum(coinDetail.marketCap)}</span></div>}
                {coinDetail.totalVolume > 0 && <div className="flex justify-between"><span className="text-[#8888AA]">Volume (24h)</span><span className="text-white">{formatNum(coinDetail.totalVolume)}</span></div>}
                {coinDetail.circulatingSupply > 0 && <div className="flex justify-between"><span className="text-[#8888AA]">Circulating Supply</span><span className="text-white">{(coinDetail.circulatingSupply / 1e6).toFixed(2)}M</span></div>}
                {coinDetail.totalSupply && coinDetail.totalSupply > 0 && <div className="flex justify-between"><span className="text-[#8888AA]">Total Supply</span><span className="text-white">{(coinDetail.totalSupply / 1e6).toFixed(2)}M</span></div>}
                {coinDetail.maxSupply && coinDetail.maxSupply > 0 && <div className="flex justify-between"><span className="text-[#8888AA]">Max Supply</span><span className="text-white">{(coinDetail.maxSupply / 1e6).toFixed(2)}M</span></div>}
              </div>
            </motion.div>
          )}

          {/* ATH/ATL */}
          {coinDetail && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-white/5 bg-[#12121A] p-4 space-y-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-[#FFD93D]" />Price Extremes</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#8888AA] flex items-center gap-1"><TrendingUp className="w-3 h-3 text-[#00FF88]" />ATH</span>
                  <div className="text-right">
                    <span className="text-white">${coinDetail.ath.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    <p className="text-red-400 text-[10px]">{coinDetail.athChangePercentage.toFixed(1)}%</p>
                  </div>
                </div>
                {coinDetail.athDate && <p className="text-[10px] text-[#8888AA]">{new Date(coinDetail.athDate).toLocaleDateString()}</p>}
                <div className="flex justify-between items-center">
                  <span className="text-[#8888AA] flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-400" />ATL</span>
                  <div className="text-right">
                    <span className="text-white">${coinDetail.atl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                    <p className="text-[#00FF88] text-[10px]">+{coinDetail.atlChangePercentage.toFixed(1)}%</p>
                  </div>
                </div>
                {coinDetail.atlDate && <p className="text-[10px] text-[#8888AA]">{new Date(coinDetail.atlDate).toLocaleDateString()}</p>}
              </div>
            </motion.div>
          )}

          {/* Price Changes */}
          {coinDetail && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-white/5 bg-[#12121A] p-4 space-y-3">
              <h2 className="text-sm font-semibold text-white">Price Changes</h2>
              <div className="space-y-2 text-xs">
                {[
                  { label: '24h', value: coinDetail.priceChange24h },
                  { label: '7d', value: coinDetail.priceChange7d },
                  { label: '30d', value: coinDetail.priceChange30d },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-[#8888AA]">{label}</span>
                    <span className={`font-medium ${value >= 0 ? 'text-[#00FF88]' : 'text-red-400'}`}>
                      {value >= 0 ? '+' : ''}{value.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* About / Description */}
          {coinDetail?.description && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl border border-white/5 bg-[#12121A] p-4 space-y-3">
              <h2 className="text-sm font-semibold text-white">About {coinName}</h2>
              {coinDetail.categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {coinDetail.categories.slice(0, 4).map((cat) => (
                    <span key={cat} className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 text-[#8888AA]">{cat}</span>
                  ))}
                </div>
              )}
              <p className="text-xs text-[#8888AA] leading-relaxed line-clamp-6"
                dangerouslySetInnerHTML={{ __html: coinDetail.description.replace(/<a /g, '<a target="_blank" rel="noopener" class="text-[#00D4FF] hover:underline" ') }}
              />
              {/* Links */}
              <div className="flex flex-wrap gap-2 pt-1">
                {coinDetail.links.homepage && (
                  <a href={coinDetail.links.homepage} target="_blank" rel="noopener"
                    className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-white/5 text-[#8888AA] hover:text-white transition-colors"
                  ><Globe className="w-3 h-3" />Website</a>
                )}
                {coinDetail.links.twitter && (
                  <a href={`https://twitter.com/${coinDetail.links.twitter}`} target="_blank" rel="noopener"
                    className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-white/5 text-[#8888AA] hover:text-white transition-colors"
                  ><ExternalLink className="w-3 h-3" />Twitter</a>
                )}
                {coinDetail.links.github && (
                  <a href={coinDetail.links.github} target="_blank" rel="noopener"
                    className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-white/5 text-[#8888AA] hover:text-white transition-colors"
                  ><ExternalLink className="w-3 h-3" />GitHub</a>
                )}
              </div>
            </motion.div>
          )}

          {loading && !coinDetail && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#00FF88]/20 border-t-[#00FF88] rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
