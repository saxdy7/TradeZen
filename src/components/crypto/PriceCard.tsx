'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceCardProps {
  symbol: string;
  name: string;
  price: string;
  change: string;
  icon: string;
}

export default function PriceCard({ symbol, name, price, change, icon }: PriceCardProps) {
  const changeNum = parseFloat(change);
  const isPositive = changeNum >= 0;
  const formattedPrice = parseFloat(price).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative overflow-hidden rounded-xl border border-white/5 bg-[#12121A] p-5"
    >
      {/* Gradient overlay */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${
          isPositive ? 'bg-[#00FF88]' : 'bg-red-500'
        }`}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-sm font-medium text-white">{name}</p>
              <p className="text-xs text-[#8888AA]">{symbol.replace('usdt', '').toUpperCase()}/USDT</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-[family-name:var(--font-space-grotesk)]">
            {formattedPrice}
          </p>
        </div>

        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
            isPositive
              ? 'text-[#00FF88] bg-[#00FF88]/10'
              : 'text-red-400 bg-red-400/10'
          }`}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{parseFloat(change).toFixed(2)}%
        </div>
      </div>
    </motion.div>
  );
}
