'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBinanceWS } from '@/hooks/useBinanceWS';
import { TRACKED_SYMBOLS } from '@/lib/binance';
import CoinList from '@/components/crypto/CoinList';
import TradingChart from '@/components/charts/TradingChart';

export default function MarketPage() {
  const { tickers, isConnected } = useBinanceWS({ symbols: TRACKED_SYMBOLS });
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
            Market
          </h1>
          <p className="text-sm text-[#8888AA] mt-1">
            Top 20 cryptocurrencies by volume
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12121A] border border-white/5">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00FF88]' : 'bg-red-400'} animate-pulse`} />
          <span className="text-xs text-[#8888AA]">
            {Object.keys(tickers).length} coins live
          </span>
        </div>
      </div>

      {/* Chart (if coin selected) */}
      {selectedCoin && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-white">
              {selectedCoin.replace('usdt', '').toUpperCase()}/USDT Chart
            </h2>
            <button
              onClick={() => setSelectedCoin(null)}
              className="text-xs text-[#8888AA] hover:text-white transition-colors"
            >
              Close chart
            </button>
          </div>
          <TradingChart symbol={selectedCoin.toUpperCase()} />
        </motion.div>
      )}

      {/* Coin List */}
      <CoinList tickers={tickers} onSelectCoin={(s) => setSelectedCoin(s)} />
    </div>
  );
}
