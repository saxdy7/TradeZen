'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, AlertTriangle, PieChart, BarChart3, Target, Percent } from 'lucide-react';
import type { PortfolioHolding } from '@/types';

interface PortfolioAnalyticsProps {
  holdings: (PortfolioHolding & { current_price?: number })[];
}

export default function PortfolioAnalytics({ holdings }: PortfolioAnalyticsProps) {
  const analytics = useMemo(() => {
    if (holdings.length === 0) return null;

    const enriched = holdings.map((h) => {
      const currentPrice = h.current_price || h.buy_price;
      const value = h.amount * currentPrice;
      const invested = h.amount * h.buy_price;
      const pnl = value - invested;
      const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
      return { ...h, value, invested, pnl, pnlPercent, currentPrice };
    });

    const totalValue = enriched.reduce((s, h) => s + h.value, 0);
    const totalInvested = enriched.reduce((s, h) => s + h.invested, 0);

    // Sort by P&L percentage
    const sorted = [...enriched].sort((a, b) => b.pnlPercent - a.pnlPercent);
    const bestPerformer = sorted[0];
    const worstPerformer = sorted[sorted.length - 1];

    // Allocation concentration
    const allocations = enriched
      .map((h) => ({
        symbol: h.coin_symbol,
        percent: totalValue > 0 ? (h.value / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.percent - a.percent);

    const topHolding = allocations[0];
    const isConcentrated = topHolding && topHolding.percent > 50;

    // Average P&L
    const avgPnlPercent = enriched.length > 0
      ? enriched.reduce((s, h) => s + h.pnlPercent, 0) / enriched.length
      : 0;

    // Winners vs Losers
    const winners = enriched.filter((h) => h.pnl > 0).length;
    const losers = enriched.filter((h) => h.pnl < 0).length;

    // Portfolio diversity score (0-100)
    const diversityScore = Math.min(100, Math.round(
      (1 - allocations.reduce((sum, a) => sum + (a.percent / 100) ** 2, 0)) * 100
    ));

    return {
      totalValue,
      totalInvested,
      bestPerformer,
      worstPerformer,
      topHolding,
      isConcentrated,
      avgPnlPercent,
      winners,
      losers,
      holdingsCount: enriched.length,
      diversityScore,
      allocations: allocations.slice(0, 5),
    };
  }, [holdings]);

  if (!analytics) {
    return (
      <div className="p-6 rounded-2xl border border-white/5 bg-[#12121A] text-center text-[#8888AA]">
        Add holdings to see analytics
      </div>
    );
  }

  const cards = [
    {
      icon: Trophy,
      label: 'Best Performer',
      value: analytics.bestPerformer?.coin_symbol || '—',
      sub: `${analytics.bestPerformer?.pnlPercent.toFixed(2)}%`,
      color: '#00FF88',
    },
    {
      icon: AlertTriangle,
      label: 'Worst Performer',
      value: analytics.worstPerformer?.coin_symbol || '—',
      sub: `${analytics.worstPerformer?.pnlPercent.toFixed(2)}%`,
      color: '#FF4444',
    },
    {
      icon: Target,
      label: 'Win Rate',
      value: `${analytics.winners}W / ${analytics.losers}L`,
      sub: `of ${analytics.holdingsCount} holdings`,
      color: '#00D4FF',
    },
    {
      icon: Percent,
      label: 'Avg Return',
      value: `${analytics.avgPnlPercent >= 0 ? '+' : ''}${analytics.avgPnlPercent.toFixed(2)}%`,
      sub: 'per holding',
      color: analytics.avgPnlPercent >= 0 ? '#00FF88' : '#FF4444',
    },
    {
      icon: PieChart,
      label: 'Diversity Score',
      value: `${analytics.diversityScore}/100`,
      sub: analytics.diversityScore > 60 ? 'Well diversified' : 'Consider diversifying',
      color: analytics.diversityScore > 60 ? '#00FF88' : '#FFaa00',
    },
    {
      icon: BarChart3,
      label: 'Top Holding',
      value: analytics.topHolding?.symbol || '—',
      sub: `${analytics.topHolding?.percent.toFixed(1)}% of portfolio`,
      color: analytics.isConcentrated ? '#FFaa00' : '#00D4FF',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-white font-semibold text-sm">Portfolio Analytics</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="p-3 rounded-xl border border-white/5 bg-[#12121A] group hover:border-white/10 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
              <span className="text-[10px] text-[#8888AA] uppercase tracking-wider">{card.label}</span>
            </div>
            <div className="text-white font-bold text-sm">{card.value}</div>
            <div className="text-[10px] mt-0.5" style={{ color: card.color }}>{card.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Allocation Breakdown */}
      <div className="p-4 rounded-xl border border-white/5 bg-[#12121A]">
        <h4 className="text-xs text-[#8888AA] mb-3 uppercase tracking-wider">Allocation Breakdown</h4>
        <div className="space-y-2">
          {analytics.allocations.map((a) => (
            <div key={a.symbol} className="flex items-center gap-3">
              <span className="text-xs text-white font-medium w-12">{a.symbol}</span>
              <div className="flex-1 h-2 bg-[#0A0A0F] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${a.percent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-[#00FF88] to-[#00D4FF]"
                />
              </div>
              <span className="text-xs text-[#8888AA] w-12 text-right">{a.percent.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Warning */}
      {analytics.isConcentrated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 rounded-xl border border-[#FFaa00]/20 bg-[#FFaa00]/5 flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-[#FFaa00] shrink-0 mt-0.5" />
          <div className="text-xs text-[#FFaa00]">
            <strong>High Concentration Risk:</strong> {analytics.topHolding?.symbol} makes up{' '}
            {analytics.topHolding?.percent.toFixed(1)}% of your portfolio. Consider diversifying to reduce risk.
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
