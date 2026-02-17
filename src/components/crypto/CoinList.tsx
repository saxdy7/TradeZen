'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Search, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { COIN_NAMES, COIN_ICONS, type CoinMarketInfo } from '@/lib/binance';
import type { CryptoTicker } from '@/types';

// Tiny SVG sparkline component
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

interface CoinListProps {
  tickers: Record<string, CryptoTicker>;
  coinMarketData?: Record<string, CoinMarketInfo>;
  onSelectCoin?: (symbol: string) => void;
}

type Tab = 'all' | 'gainers' | 'losers';

export default function CoinList({ tickers, coinMarketData, onSelectCoin }: CoinListProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const router = useRouter();

  const tickerArray = Object.values(tickers).map((t) => ({
    ...t,
    name: COIN_NAMES[t.symbol] || t.symbol.replace('usdt', '').toUpperCase(),
    icon: COIN_ICONS[t.symbol] || '●',
    changeNum: parseFloat(t.priceChangePercent),
  }));

  let filtered = tickerArray.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.symbol.toLowerCase().includes(search.toLowerCase())
  );

  if (activeTab === 'gainers') {
    filtered = filtered.filter((t) => t.changeNum > 0).sort((a, b) => b.changeNum - a.changeNum);
  } else if (activeTab === 'losers') {
    filtered = filtered.filter((t) => t.changeNum < 0).sort((a, b) => a.changeNum - b.changeNum);
  } else {
    filtered = filtered.sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'gainers', label: 'Gainers' },
    { key: 'losers', label: 'Losers' },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888AA]" />
          <Input
            placeholder="Search coins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#12121A] border-white/10 text-white placeholder:text-[#8888AA] w-64"
          />
        </div>
        <div className="flex gap-1 bg-[#12121A] rounded-lg p-1 border border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-[#00FF88]/10 text-[#00FF88]'
                  : 'text-[#8888AA] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/5 bg-[#12121A] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-[#8888AA] font-medium px-4 py-3">#</th>
              <th className="text-left text-xs text-[#8888AA] font-medium px-4 py-3">Coin</th>
              <th className="text-right text-xs text-[#8888AA] font-medium px-4 py-3">Price</th>
              <th className="text-right text-xs text-[#8888AA] font-medium px-4 py-3">24h Change</th>
              <th className="text-center text-xs text-[#8888AA] font-medium px-4 py-3 hidden lg:table-cell">7d</th>
              <th className="text-right text-xs text-[#8888AA] font-medium px-4 py-3 hidden md:table-cell">Market Cap</th>
              <th className="text-right text-xs text-[#8888AA] font-medium px-4 py-3">24h Volume</th>
              <th className="text-center text-xs text-[#8888AA] font-medium px-4 py-3 hidden sm:table-cell w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ticker, index) => {
              const isPositive = ticker.changeNum >= 0;
              const marketInfo = coinMarketData?.[ticker.symbol];
              const sparkline7d = marketInfo?.sparkline7d;
              const sparkColor = isPositive ? '#00FF88' : '#FF4466';
              const upperSymbol = ticker.symbol.replace('usdt', '').toUpperCase() + 'USDT';
              return (
                <motion.tr
                  key={ticker.symbol}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(index * 0.02, 0.5) }}
                  onClick={() => onSelectCoin?.(ticker.symbol)}
                  className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-[#8888AA]">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{ticker.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{ticker.name}</p>
                        <p className="text-xs text-[#8888AA]">
                          {ticker.symbol.replace('usdt', '').toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-white">
                    ${parseFloat(ticker.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-sm font-medium ${
                        isPositive ? 'text-[#00FF88]' : 'text-red-400'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {isPositive ? '+' : ''}{ticker.changeNum.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    {sparkline7d && sparkline7d.length > 0 ? (
                      <Sparkline data={sparkline7d} color={sparkColor} />
                    ) : (
                      <span className="text-[10px] text-[#8888AA]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-[#8888AA] hidden md:table-cell">
                    {marketInfo?.marketCap
                      ? marketInfo.marketCap >= 1e9
                        ? `$${(marketInfo.marketCap / 1e9).toFixed(2)}B`
                        : `$${(marketInfo.marketCap / 1e6).toFixed(1)}M`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-[#8888AA]">
                    ${(parseFloat(ticker.quoteVolume) / 1e6).toFixed(2)}M
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/coin/${upperSymbol}`); }}
                      className="p-1 rounded text-[#8888AA] hover:text-[#00D4FF] transition-colors cursor-pointer"
                      title="View coin details"
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
        {filtered.length === 0 && (
          <div className="py-8 text-center text-[#8888AA] text-sm">No coins found</div>
        )}
      </div>
    </div>
  );
}
