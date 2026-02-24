'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useCrypto } from '@/contexts/CryptoContext';
import { MAIN_SYMBOLS, COIN_NAMES, COIN_ICONS } from '@/lib/binance';
import { Search, TrendingUp, TrendingDown, Filter, ArrowUpDown, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

type SortKey = 'symbol' | 'price' | 'change' | 'volume' | 'high' | 'low';
type SortDir = 'asc' | 'desc';

const FILTER_OPTIONS = ['All', 'Gainers', 'Losers', 'High Volume'] as const;
type FilterOption = typeof FILTER_OPTIONS[number];

export default function ScreenerPage() {
    const { tickers } = useCrypto();
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('change');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [filter, setFilter] = useState<FilterOption>('All');

    const rows = useMemo(() => {
        return MAIN_SYMBOLS
            .map((sym) => {
                const ticker = tickers[sym];
                const baseSymbol = sym.replace('USDT', '').toUpperCase();
                return {
                    symbol: baseSymbol,
                    key: sym,
                    name: COIN_NAMES[sym] || baseSymbol,
                    icon: COIN_ICONS[sym] || '●',
                    price: Number(ticker?.price || 0),
                    change: Number(ticker?.priceChangePercent || 0),
                    volume: Number(ticker?.quoteVolume || 0),
                    high: Number(ticker?.highPrice || 0),
                    low: Number(ticker?.lowPrice || 0),
                };
            })
            .filter((r) => {
                const q = search.toLowerCase();
                const matchSearch = !q || r.symbol.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
                const matchFilter =
                    filter === 'All' ? true :
                        filter === 'Gainers' ? r.change > 0 :
                            filter === 'Losers' ? r.change < 0 :
                                r.volume > 50_000_000;
                return matchSearch && matchFilter;
            })
            .sort((a, b) => {
                let va = 0, vb = 0;
                if (sortKey === 'symbol') return sortDir === 'asc' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
                if (sortKey === 'price') { va = a.price; vb = b.price; }
                if (sortKey === 'change') { va = a.change; vb = b.change; }
                if (sortKey === 'volume') { va = a.volume; vb = b.volume; }
                if (sortKey === 'high') { va = a.high; vb = b.high; }
                if (sortKey === 'low') { va = a.low; vb = b.low; }
                return sortDir === 'asc' ? va - vb : vb - va;
            });
    }, [tickers, search, sortKey, sortDir, filter]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const SortBtn = ({ label, col }: { label: string; col: SortKey }) => (
        <button
            onClick={() => handleSort(col)}
            className={`flex items-center gap-1 hover:text-white transition-colors ${sortKey === col ? 'text-[#00FF88]' : 'text-[#8888AA]'}`}
        >
            {label}
            <ArrowUpDown className="w-3 h-3" />
        </button>
    );

    const gainers = rows.filter(r => r.change > 0).length;
    const losers = rows.filter(r => r.change < 0).length;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#00D4FF] flex items-center justify-center">
                    <Filter className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">Coin Screener</h1>
                    <p className="text-xs text-[#8888AA]">Filter & sort {rows.length} coins by price, change, and volume</p>
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total Coins', value: MAIN_SYMBOLS.length, color: '#00D4FF' },
                    { label: 'Gainers', value: gainers, color: '#00FF88' },
                    { label: 'Losers', value: losers, color: '#FF4466' },
                ].map(s => (
                    <div key={s.label} className="rounded-xl border border-white/5 bg-[#12121A] p-3 text-center">
                        <p className="text-[10px] text-[#8888AA]">{s.label}</p>
                        <p className="text-lg font-bold font-[family-name:var(--font-space-grotesk)]" style={{ color: s.color }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888AA]" />
                    <Input
                        placeholder="Search coin name or symbol..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-[#12121A] border-white/10 text-white placeholder:text-[#555] h-9"
                    />
                </div>
                <div className="flex gap-1 bg-[#0A0A0F] rounded-lg p-1">
                    {FILTER_OPTIONS.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === f ? 'bg-[#12121A] text-[#00FF88] shadow' : 'text-[#8888AA] hover:text-white'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/5 bg-[#12121A] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left px-4 py-3 text-xs font-medium"><SortBtn label="Coin" col="symbol" /></th>
                                <th className="text-right px-4 py-3 text-xs font-medium"><SortBtn label="Price" col="price" /></th>
                                <th className="text-right px-4 py-3 text-xs font-medium"><SortBtn label="24h Change" col="change" /></th>
                                <th className="text-right px-4 py-3 text-xs font-medium"><SortBtn label="24h High" col="high" /></th>
                                <th className="text-right px-4 py-3 text-xs font-medium"><SortBtn label="24h Low" col="low" /></th>
                                <th className="text-right px-4 py-3 text-xs font-medium"><SortBtn label="Volume (USD)" col="volume" /></th>
                                <th className="text-right px-4 py-3 text-xs text-[#8888AA] font-medium">Detail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => {
                                const isPos = r.change >= 0;
                                return (
                                    <motion.tr
                                        key={r.key}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.01 }}
                                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-xl">{r.icon}</span>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{r.symbol}</p>
                                                    <p className="text-[10px] text-[#8888AA]">{r.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-mono text-white">
                                            ${r.price > 0 ? r.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`inline-flex items-center gap-1 text-sm font-medium ${isPos ? 'text-[#00FF88]' : 'text-red-400'}`}>
                                                {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                {isPos ? '+' : ''}{r.change.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-mono text-[#8888AA]">
                                            ${r.high > 0 ? r.high.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-mono text-[#8888AA]">
                                            ${r.low > 0 ? r.low.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-mono text-[#8888AA]">
                                            {r.volume > 0 ? `$${(r.volume / 1e6).toFixed(1)}M` : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/coin/${r.key}`}>
                                                <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#8888AA] hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-all">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </button>
                                            </Link>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {rows.length === 0 && (
                    <div className="p-10 text-center text-[#8888AA] text-sm">No coins match your filter.</div>
                )}
            </motion.div>
        </div>
    );
}
