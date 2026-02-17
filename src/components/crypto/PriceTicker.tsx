'use client';

import { motion } from 'framer-motion';
import { useBinanceWS } from '@/hooks/useBinanceWS';
import { MAIN_SYMBOLS } from '@/lib/binance';

// PriceTicker uses its own WebSocket because it's used on the landing page
// (outside the CryptoProvider). This is the only standalone WS consumer.
export default function PriceTicker() {
  const { tickerList } = useBinanceWS({ symbols: MAIN_SYMBOLS });

  return (
    <div className="overflow-hidden border-y border-white/5 bg-[#12121A]/50 py-3">
      <motion.div
        animate={{ x: [0, -1000] }}
        transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
        className="flex gap-8 whitespace-nowrap"
      >
        {[...tickerList, ...tickerList].map((ticker, i) => {
          const isPositive = parseFloat(ticker.priceChangePercent) >= 0;
          return (
            <div key={`${ticker.symbol}-${i}`} className="flex items-center gap-3">
              <span className="text-lg">{ticker.icon}</span>
              <span className="text-sm font-medium text-white">{ticker.name}</span>
              <span className="text-sm text-white/80">
                ${parseFloat(ticker.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`text-xs font-medium ${
                  isPositive ? 'text-[#00FF88]' : 'text-red-400'
                }`}
              >
                {isPositive ? '+' : ''}{parseFloat(ticker.priceChangePercent).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
