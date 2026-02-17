'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCrypto } from '@/contexts/CryptoContext';
import CoinList from '@/components/crypto/CoinList';
import TradingChart from '@/components/charts/TradingChart';
import OrderBook from '@/components/trading/OrderBook';
import RecentTradesPanel from '@/components/trading/RecentTrades';
import { X, BookOpen, Clock, ChevronDown } from 'lucide-react';

type TradingTab = 'orderbook' | 'trades';

export default function MarketPage() {
  const { tickers, isConnected, coinMarketData } = useCrypto();
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [tradingTab, setTradingTab] = useState<TradingTab>('orderbook');

  const selectedSymbol = selectedCoin?.toUpperCase() || '';

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
            Market
          </h1>
          <p className="text-xs lg:text-sm text-[#8888AA] mt-1">
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

      {/* Trading View (when coin selected) */}
      <AnimatePresence>
        {selectedCoin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Coin header bar */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ChevronDown className="w-4 h-4 text-[#00D4FF]" />
                <h2 className="text-sm font-medium text-white">
                  {selectedSymbol.replace('USDT', '')}/USDT Trading View
                </h2>
              </div>
              <button
                onClick={() => setSelectedCoin(null)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-[#8888AA] hover:text-white rounded-md hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                Close
              </button>
            </div>

            {/* Desktop: Chart left + Order Book / Recent Trades right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Chart (takes 2/3 on desktop) */}
              <div className="lg:col-span-2">
                <TradingChart symbol={selectedSymbol} />
              </div>

              {/* Side panel (1/3 on desktop, tabs on mobile) */}
              <div className="space-y-0">
                {/* Tab toggle for mobile & desktop */}
                <div className="flex bg-[#12121A] rounded-t-xl border border-b-0 border-white/5">
                  <button
                    onClick={() => setTradingTab('orderbook')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer rounded-tl-xl ${
                      tradingTab === 'orderbook'
                        ? 'text-[#00FF88] bg-[#00FF88]/5 border-b-2 border-[#00FF88]'
                        : 'text-[#8888AA] hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3 h-3" />
                    Order Book
                  </button>
                  <button
                    onClick={() => setTradingTab('trades')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer rounded-tr-xl ${
                      tradingTab === 'trades'
                        ? 'text-[#00D4FF] bg-[#00D4FF]/5 border-b-2 border-[#00D4FF]'
                        : 'text-[#8888AA] hover:text-white'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    Trades
                  </button>
                </div>

                {/* Panel content */}
                <div>
                  {tradingTab === 'orderbook' ? (
                    <OrderBook symbol={selectedSymbol} />
                  ) : (
                    <RecentTradesPanel symbol={selectedSymbol} />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coin List */}
      <CoinList tickers={tickers} coinMarketData={coinMarketData} onSelectCoin={(s) => setSelectedCoin(s)} />
    </div>
  );
}
