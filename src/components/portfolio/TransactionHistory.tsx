'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ArrowDownCircle, ArrowUpCircle, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { PortfolioTransaction } from '@/types';

interface TransactionHistoryProps {
  transactions: PortfolioTransaction[];
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = filter === 'all' || t.type === filter;
      const matchSearch =
        !search ||
        t.coin_symbol.toLowerCase().includes(search.toLowerCase()) ||
        t.coin_name.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [transactions, filter, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <History className="w-4 h-4 text-[#00D4FF]" />
          Transaction History
        </h3>
        <span className="text-xs text-[#8888AA]">{filtered.length} transactions</span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 bg-[#0A0A0F] rounded-lg p-1">
          {(['all', 'buy', 'sell'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                filter === f
                  ? f === 'buy'
                    ? 'bg-[#00FF88]/20 text-[#00FF88]'
                    : f === 'sell'
                    ? 'bg-red-400/20 text-red-400'
                    : 'bg-[#00D4FF]/20 text-[#00D4FF]'
                  : 'text-[#8888AA] hover:text-white'
              }`}
            >
              <Filter className="w-3 h-3 inline mr-1" />
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#8888AA]" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#0A0A0F] border-white/10 text-white text-xs pl-7 h-7"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-[#8888AA] text-sm">
              {transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
            </div>
          ) : (
            filtered.map((tx, i) => (
              <motion.div
                key={tx.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.03 }}
                className="p-3 rounded-xl border border-white/5 bg-[#12121A] flex items-center gap-3 hover:border-white/10 transition-colors"
              >
                {/* Type Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    tx.type === 'buy' ? 'bg-[#00FF88]/10' : 'bg-red-400/10'
                  }`}
                >
                  {tx.type === 'buy' ? (
                    <ArrowDownCircle className="w-4 h-4 text-[#00FF88]" />
                  ) : (
                    <ArrowUpCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{tx.coin_symbol}</span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase ${
                        tx.type === 'buy'
                          ? 'bg-[#00FF88]/10 text-[#00FF88]'
                          : 'bg-red-400/10 text-red-400'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8888AA] mt-0.5">
                    {tx.amount} × ${tx.price?.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    {tx.notes && <span className="ml-2 text-[#555]">• {tx.notes}</span>}
                  </div>
                </div>

                {/* Value + Date */}
                <div className="text-right shrink-0">
                  <div className="text-white text-sm font-mono">
                    ${tx.total_value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-[#8888AA]">
                    {new Date(tx.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
