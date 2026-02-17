'use client';

import { motion } from 'framer-motion';
import { useBinanceWS } from '@/hooks/useBinanceWS';
import { MAIN_SYMBOLS } from '@/lib/binance';
import PriceCard from '@/components/crypto/PriceCard';
import TradingChart from '@/components/charts/TradingChart';
import { Activity, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default function DashboardPage() {
  const { tickerList, tickers, isConnected } = useBinanceWS({ symbols: MAIN_SYMBOLS });

  // Calculate top gainers & losers from the available tickers
  const allTickers = Object.values(tickers)
    .map((t) => ({
      symbol: t.symbol,
      change: parseFloat(t.priceChangePercent),
    }))
    .sort((a, b) => b.change - a.change);

  const gainers = allTickers.filter((t) => t.change > 0).slice(0, 5);
  const losers = allTickers.filter((t) => t.change < 0).slice(-5).reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
            Dashboard
          </h1>
          <p className="text-sm text-[#8888AA] mt-1">Live market overview</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12121A] border border-white/5">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00FF88]' : 'bg-red-400'} animate-pulse`} />
          <span className="text-xs text-[#8888AA]">
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Price Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tickerList.length > 0
          ? tickerList.map((ticker) => (
              <PriceCard
                key={ticker.symbol}
                symbol={ticker.symbol}
                name={ticker.name}
                price={ticker.price}
                change={ticker.priceChangePercent}
                icon={ticker.icon}
              />
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl border border-white/5 bg-[#12121A] animate-pulse"
              />
            ))}
      </div>

      {/* Chart + Side Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TradingView Chart */}
        <div className="lg:col-span-2">
          <TradingChart symbol="BTCUSDT" interval="1h" />
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Market Sentiment */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl border border-white/5 bg-[#12121A] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-[#00D4FF]" />
              <h3 className="text-sm font-medium text-white">Market Sentiment</h3>
            </div>
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#00FF88] font-[family-name:var(--font-space-grotesk)]">
                  72
                </div>
                <div className="text-sm text-[#00FF88] mt-1">Greed</div>
                <div className="text-xs text-[#8888AA] mt-1">Fear & Greed Index</div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-[#0A0A0F] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-[#00FF88]"
                style={{ width: '72%' }}
              />
            </div>
          </motion.div>

          {/* Top Gainers */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-white/5 bg-[#12121A] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[#00FF88]" />
              <h3 className="text-sm font-medium text-white">Top Gainers</h3>
            </div>
            <div className="space-y-2">
              {gainers.length > 0
                ? gainers.map((g) => (
                    <div key={g.symbol} className="flex justify-between items-center">
                      <span className="text-xs text-white">
                        {g.symbol.replace('usdt', '').toUpperCase()}
                      </span>
                      <span className="text-xs text-[#00FF88]">+{g.change.toFixed(2)}%</span>
                    </div>
                  ))
                : <div className="text-xs text-[#8888AA] text-center py-2">Loading...</div>}
            </div>
          </motion.div>

          {/* Top Losers */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-white/5 bg-[#12121A] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-medium text-white">Top Losers</h3>
            </div>
            <div className="space-y-2">
              {losers.length > 0
                ? losers.map((l) => (
                    <div key={l.symbol} className="flex justify-between items-center">
                      <span className="text-xs text-white">
                        {l.symbol.replace('usdt', '').toUpperCase()}
                      </span>
                      <span className="text-xs text-red-400">{l.change.toFixed(2)}%</span>
                    </div>
                  ))
                : <div className="text-xs text-[#8888AA] text-center py-2">Loading...</div>}
            </div>
          </motion.div>

          {/* Portfolio Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-white/5 bg-[#12121A] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-[#FFD93D]" />
              <h3 className="text-sm font-medium text-white">Portfolio Summary</h3>
            </div>
            <p className="text-xs text-[#8888AA] text-center py-4">
              Connect your portfolio to see a summary here.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
