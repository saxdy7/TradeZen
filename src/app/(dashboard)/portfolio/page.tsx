'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolio } from '@/hooks/usePortfolio';
import { fetchBinancePrice } from '@/lib/binance';
import HoldingForm from '@/components/portfolio/HoldingForm';
import PortfolioPie from '@/components/portfolio/PortfolioPie';
import PortfolioPerformance from '@/components/portfolio/PortfolioPerformance';
import PortfolioAnalytics from '@/components/portfolio/PortfolioAnalytics';
import TransactionHistory from '@/components/portfolio/TransactionHistory';
import {
  Trash2, TrendingUp, TrendingDown, DollarSign, Wallet, Download,
  Edit3, Search, ArrowUpDown, BarChart3, History, PieChart, LayoutGrid,
  Coins, Clock,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PortfolioHolding } from '@/types';

type TabKey = 'overview' | 'analytics' | 'transactions';
type SortKey = 'value' | 'pnl' | 'pnl_percent' | 'amount' | 'name';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'transactions', label: 'Transactions', icon: History },
];

export default function PortfolioPage() {
  const { holdings, transactions, loading, addHolding, updateHolding, deleteHolding, exportCSV } = usePortfolio();
  const [enrichedHoldings, setEnrichedHoldings] = useState<PortfolioHolding[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [editHolding, setEditHolding] = useState<PortfolioHolding | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('value');
  const [sortAsc, setSortAsc] = useState(false);

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
      const interval = setInterval(enrichHoldings, 15000);
      return () => clearInterval(interval);
    } else {
      setEnrichedHoldings([]);
    }
  }, [holdings]);

  // Sort & filter holdings
  const filteredHoldings = useMemo(() => {
    let result = [...enrichedHoldings];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (h) =>
          h.coin_symbol.toLowerCase().includes(q) ||
          h.coin_name.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA = 0, valB = 0;
      switch (sortKey) {
        case 'value':
          valA = a.current_value || 0;
          valB = b.current_value || 0;
          break;
        case 'pnl':
          valA = a.pnl || 0;
          valB = b.pnl || 0;
          break;
        case 'pnl_percent':
          valA = a.pnl_percent || 0;
          valB = b.pnl_percent || 0;
          break;
        case 'amount':
          valA = a.amount;
          valB = b.amount;
          break;
        case 'name':
          return sortAsc
            ? a.coin_name.localeCompare(b.coin_name)
            : b.coin_name.localeCompare(a.coin_name);
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    return result;
  }, [enrichedHoldings, searchQuery, sortKey, sortAsc]);

  const totalValue = enrichedHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);
  const totalInvested = enrichedHoldings.reduce((sum, h) => sum + h.buy_price * h.amount, 0);
  const totalPnl = totalValue - totalInvested;
  const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  // Best performer
  const bestPerformer = enrichedHoldings.length > 0
    ? enrichedHoldings.reduce((best, h) =>
        (h.pnl_percent || 0) > (best.pnl_percent || 0) ? h : best
      )
    : null;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
            Portfolio
          </h1>
          <p className="text-xs lg:text-sm text-[#8888AA] mt-1">
            Track, analyze &amp; manage your crypto holdings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {enrichedHoldings.length > 0 && (
            <Button
              onClick={exportCSV}
              variant="outline"
              className="border-white/10 text-[#8888AA] hover:text-white text-xs h-9"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
          )}
          <HoldingForm
            onSubmit={addHolding}
            onUpdate={updateHolding}
            editHolding={editHolding}
            onCancelEdit={() => setEditHolding(null)}
          />
        </div>
      </div>

      {/* Summary Cards — 5 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/5 bg-[#12121A] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-[#00D4FF]" />
            <span className="text-[10px] text-[#8888AA] uppercase tracking-wider">Total Value</span>
          </div>
          <p className="text-lg lg:text-xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-white/5 bg-[#12121A] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-[#FFD93D]" />
            <span className="text-[10px] text-[#8888AA] uppercase tracking-wider">Invested</span>
          </div>
          <p className="text-lg lg:text-xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
            ${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-white/5 bg-[#12121A] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            {totalPnl >= 0 ? (
              <TrendingUp className="w-4 h-4 text-[#00FF88]" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className="text-[10px] text-[#8888AA] uppercase tracking-wider">Total P&L</span>
          </div>
          <p className={`text-lg lg:text-xl font-bold font-[family-name:var(--font-space-grotesk)] ${totalPnl >= 0 ? 'text-[#00FF88]' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs ml-1">({totalPnlPercent.toFixed(2)}%)</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-white/5 bg-[#12121A] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-[#A78BFA]" />
            <span className="text-[10px] text-[#8888AA] uppercase tracking-wider">Holdings</span>
          </div>
          <p className="text-lg lg:text-xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
            {enrichedHoldings.length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-white/5 bg-[#12121A] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#00FF88]" />
            <span className="text-[10px] text-[#8888AA] uppercase tracking-wider">Top Gainer</span>
          </div>
          <p className="text-lg lg:text-xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
            {bestPerformer ? bestPerformer.coin_symbol : '—'}
          </p>
          {bestPerformer && (
            <span className="text-[10px] text-[#00FF88]">
              +{(bestPerformer.pnl_percent || 0).toFixed(2)}%
            </span>
          )}
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#0A0A0F] rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-[#12121A] text-[#00FF88] shadow-lg'
                : 'text-[#8888AA] hover:text-white'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Performance Chart + Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <PortfolioPerformance holdings={enrichedHoldings} />
              </div>
              <div>
                <PortfolioPie holdings={enrichedHoldings} />
              </div>
            </div>

            {/* Holdings Table */}
            <div className="rounded-xl border border-white/5 bg-[#12121A] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#00D4FF]" />
                  Your Holdings
                </h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#8888AA]" />
                    <Input
                      placeholder="Filter holdings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-[#0A0A0F] border-white/10 text-white text-xs pl-7 h-7 w-40"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-[#8888AA] text-sm">Loading...</div>
              ) : filteredHoldings.length === 0 ? (
                <div className="p-8 text-center text-[#8888AA] text-sm">
                  {enrichedHoldings.length === 0
                    ? 'No holdings yet. Add your first crypto holding!'
                    : 'No holdings match your search.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th
                          className="text-left text-xs text-[#8888AA] font-medium px-4 py-3 cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('name')}
                        >
                          Coin {sortKey === 'name' && <ArrowUpDown className="w-3 h-3 inline ml-1" />}
                        </th>
                        <th
                          className="text-right text-xs text-[#8888AA] font-medium px-4 py-3 cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('amount')}
                        >
                          Amount {sortKey === 'amount' && <ArrowUpDown className="w-3 h-3 inline ml-1" />}
                        </th>
                        <th className="text-right text-xs text-[#8888AA] font-medium px-4 py-3">Buy Price</th>
                        <th className="text-right text-xs text-[#8888AA] font-medium px-4 py-3">Current</th>
                        <th
                          className="text-right text-xs text-[#8888AA] font-medium px-4 py-3 cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('value')}
                        >
                          Value {sortKey === 'value' && <ArrowUpDown className="w-3 h-3 inline ml-1" />}
                        </th>
                        <th
                          className="text-right text-xs text-[#8888AA] font-medium px-4 py-3 cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('pnl')}
                        >
                          P&L {sortKey === 'pnl' && <ArrowUpDown className="w-3 h-3 inline ml-1" />}
                        </th>
                        <th className="text-right text-xs text-[#8888AA] font-medium px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHoldings.map((h) => {
                        const isPositive = (h.pnl || 0) >= 0;
                        return (
                          <motion.tr
                            key={h.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-b border-white/5 hover:bg-white/[0.02] group"
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-white">{h.coin_name}</p>
                                <p className="text-xs text-[#8888AA]">
                                  {h.coin_symbol}
                                  {h.notes && (
                                    <span className="ml-1 text-[#555]" title={h.notes}>
                                      📝
                                    </span>
                                  )}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-white font-mono">
                              {h.amount}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-white font-mono">
                              ${h.buy_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-white font-mono">
                              ${(h.current_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-white font-mono">
                              ${(h.current_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`text-sm font-medium font-mono ${isPositive ? 'text-[#00FF88]' : 'text-red-400'}`}>
                                {isPositive ? '+' : ''}{(h.pnl || 0).toFixed(2)}
                                <span className="text-xs ml-1">({(h.pnl_percent || 0).toFixed(2)}%)</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setEditHolding(h)}
                                  className="p-1.5 rounded-lg text-[#8888AA] hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-all"
                                  title="Edit holding"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteHolding(h.id)}
                                  className="p-1.5 rounded-lg text-[#8888AA] hover:text-red-400 hover:bg-red-400/10 transition-all"
                                  title="Delete holding"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <PortfolioAnalytics holdings={enrichedHoldings} />
          </motion.div>
        )}

        {activeTab === 'transactions' && (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <TransactionHistory transactions={transactions} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
