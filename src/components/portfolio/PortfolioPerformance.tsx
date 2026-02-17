'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { PortfolioHolding } from '@/types';

interface PortfolioPerformanceProps {
  holdings: (PortfolioHolding & { current_price?: number })[];
}

const TIME_RANGES = ['7D', '30D', '90D'] as const;

export default function PortfolioPerformance({ holdings }: PortfolioPerformanceProps) {
  const [range, setRange] = useState<(typeof TIME_RANGES)[number]>('30D');

  // Generate simulated historical data based on holdings
  const chartData = useMemo(() => {
    if (holdings.length === 0) return [];

    const totalCurrentValue = holdings.reduce(
      (sum, h) => sum + h.amount * (h.current_price || h.buy_price),
      0
    );
    const totalInvested = holdings.reduce((sum, h) => sum + h.amount * h.buy_price, 0);

    const days = range === '7D' ? 7 : range === '30D' ? 30 : 90;
    const data = [];
    const now = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Simulate value progression from invested to current with some noise
      const progress = 1 - i / days;
      const noise = 1 + (Math.sin(i * 0.5) * 0.03 + Math.cos(i * 0.3) * 0.02);
      const value = totalInvested + (totalCurrentValue - totalInvested) * progress * noise;

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.max(0, value),
        invested: totalInvested,
      });
    }
    return data;
  }, [holdings, range]);

  const totalValue = holdings.reduce(
    (sum, h) => sum + h.amount * (h.current_price || h.buy_price),
    0
  );
  const totalInvested = holdings.reduce((sum, h) => sum + h.amount * h.buy_price, 0);
  const pnl = totalValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
  const isPositive = pnl >= 0;

  if (holdings.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-white/5 bg-[#12121A] text-center text-[#8888AA]">
        Add holdings to see performance chart
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl border border-white/5 bg-[#12121A]"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-sm">Portfolio Performance</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white text-xl font-bold">
              ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span
              className={`flex items-center gap-1 text-sm font-medium ${
                isPositive ? 'text-[#00FF88]' : 'text-red-400'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}
              {pnlPercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="flex gap-1 bg-[#0A0A0F] rounded-lg p-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                range === r
                  ? 'bg-[#00FF88]/20 text-[#00FF88]'
                  : 'text-[#8888AA] hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? '#00FF88' : '#FF4444'} stopOpacity={0.3} />
              <stop offset="100%" stopColor={isPositive ? '#00FF88' : '#FF4444'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A1A2E" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#8888AA' }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#8888AA' }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
            width={55}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1A2E',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Value']}
          />
          <Area
            type="monotone"
            dataKey="invested"
            stroke="#8888AA"
            strokeWidth={1}
            strokeDasharray="4 4"
            fill="none"
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={isPositive ? '#00FF88' : '#FF4444'}
            strokeWidth={2}
            fill="url(#portfolioGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
