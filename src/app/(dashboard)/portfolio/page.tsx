'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePortfolio } from '@/hooks/usePortfolio';
import { fetchBinancePrice } from '@/lib/binance';
import HoldingForm from '@/components/portfolio/HoldingForm';
import PortfolioPie from '@/components/portfolio/PortfolioPie';
import { Trash2, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import type { PortfolioHolding } from '@/types';

export default function PortfolioPage() {
  const { holdings, loading, addHolding, deleteHolding } = usePortfolio();
  const [enrichedHoldings, setEnrichedHoldings] = useState<PortfolioHolding[]>([]);

  // Enrich holdings with current prices
  useEffect(() => {
    const enrichHoldings = async () => {
      const enriched = await Promise.all(
        holdings.map(async (h) => {
          const currentPrice = await fetchBinancePrice(`${h.coin_symbol}USDT`);
          const currentValue = currentPrice * h.amount;
          const investedValue = h.buy_price * h.amount;
          const pnl = currentValue - investedValue;
          const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

          return {
            ...h,
            current_price: currentPrice,
            current_value: currentValue,
            pnl,
            pnl_percent: pnlPercent,
          };
        })
      );
      setEnrichedHoldings(enriched);
    };

    if (holdings.length > 0) {
      enrichHoldings();
      const interval = setInterval(enrichHoldings, 15000); // Update every 15 seconds
      return () => clearInterval(interval);
    } else {
      setEnrichedHoldings([]);
    }
  }, [holdings]);

  const totalValue = enrichedHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);
  const totalInvested = enrichedHoldings.reduce((sum, h) => sum + h.buy_price * h.amount, 0);
  const totalPnl = totalValue - totalInvested;
  const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
            Portfolio
          </h1>
          <p className="text-sm text-[#8888AA] mt-1">Track your crypto holdings</p>
        </div>
        <HoldingForm onSubmit={addHolding} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/5 bg-[#12121A] p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-[#00D4FF]" />
            <span className="text-xs text-[#8888AA]">Total Value</span>
          </div>
          <p className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-white/5 bg-[#12121A] p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-[#FFD93D]" />
            <span className="text-xs text-[#8888AA]">Total Invested</span>
          </div>
          <p className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
            ${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-white/5 bg-[#12121A] p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            {totalPnl >= 0 ? (
              <TrendingUp className="w-4 h-4 text-[#00FF88]" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className="text-xs text-[#8888AA]">Total P&L</span>
          </div>
          <p className={`text-2xl font-bold font-[family-name:var(--font-space-grotesk)] ${totalPnl >= 0 ? 'text-[#00FF88]' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            <span className="text-sm ml-1">({totalPnlPercent.toFixed(2)}%)</span>
          </p>
        </motion.div>
      </div>

      {/* Portfolio Distribution + Holdings Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PortfolioPie holdings={enrichedHoldings} />
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/5 bg-[#12121A] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <h3 className="text-sm font-medium text-white">Your Holdings</h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-[#8888AA] text-sm">Loading...</div>
            ) : enrichedHoldings.length === 0 ? (
              <div className="p-8 text-center text-[#8888AA] text-sm">
                No holdings yet. Add your first crypto holding!
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs text-[#8888AA] font-medium px-4 py-3">Coin</th>
                    <th className="text-right text-xs text-[#8888AA] font-medium px-4 py-3">Amount</th>
                    <th className="text-right text-xs text-[#8888AA] font-medium px-4 py-3">Buy Price</th>
                    <th className="text-right text-xs text-[#8888AA] font-medium px-4 py-3">Current</th>
                    <th className="text-right text-xs text-[#8888AA] font-medium px-4 py-3">Value</th>
                    <th className="text-right text-xs text-[#8888AA] font-medium px-4 py-3">P&L</th>
                    <th className="text-right text-xs text-[#8888AA] font-medium px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedHoldings.map((h) => {
                    const isPositive = (h.pnl || 0) >= 0;
                    return (
                      <motion.tr
                        key={h.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-white/5 hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-white">{h.coin_name}</p>
                            <p className="text-xs text-[#8888AA]">{h.coin_symbol}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-white">{h.amount}</td>
                        <td className="px-4 py-3 text-right text-sm text-white">
                          ${h.buy_price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-white">
                          ${(h.current_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-white">
                          ${(h.current_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-medium ${isPositive ? 'text-[#00FF88]' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{(h.pnl || 0).toFixed(2)}
                            <span className="text-xs ml-1">({(h.pnl_percent || 0).toFixed(2)}%)</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => deleteHolding(h.id)}
                            className="p-1.5 rounded-lg text-[#8888AA] hover:text-red-400 hover:bg-red-400/10 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
