'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Calendar, DollarSign, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchBinanceKlines, MAIN_SYMBOLS, COIN_NAMES } from '@/lib/binance';
import { useCrypto } from '@/contexts/CryptoContext';

export default function DCACalculator() {
    const { tickers } = useCrypto();
    const [symbol, setSymbol] = useState('BTCUSDT');
    const [amount, setAmount] = useState<string>('100');
    const [weeks, setWeeks] = useState<string>('52'); // 1 year default
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ invested: number; currentValue: number; coinAmount: number; pnlPercent: number } | null>(null);

    const calculateDCA = async () => {
        setLoading(true);
        try {
            const numWeeks = parseInt(weeks) || 52;
            const investmentPerWeek = parseFloat(amount) || 100;

            // Fetch weekly klines
            const klines = await fetchBinanceKlines(symbol, '1w', numWeeks);

            let totalInvested = 0;
            let totalCoin = 0;

            for (const k of klines) {
                // fetchBinanceKlines returns { time, open, high, low, close, volume }
                const price = k.close;
                if (price > 0) {
                    totalInvested += investmentPerWeek;
                    totalCoin += investmentPerWeek / price;
                }
            }

            const currentPrice = tickers[symbol]?.price || (klines[klines.length - 1]?.close) || 0;
            const currentValue = totalCoin * currentPrice;
            const pnlPercent = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;

            setResult({
                invested: totalInvested,
                currentValue,
                coinAmount: totalCoin,
                pnlPercent,
            });
        } catch (err) {
            console.error('DCA calculation failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="rounded-2xl border border-white/5 bg-[#12121A] p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#6C5CE7] flex items-center justify-center">
                            <Calculator className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-space-grotesk)]">DCA Calculator</h2>
                            <p className="text-xs text-[#8888AA]">Simulate past Dollar Cost Averaging</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-[#8888AA] font-medium mb-1.5 block">Coin to buy</label>
                            <select
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value)}
                                className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00D4FF]/50"
                            >
                                {MAIN_SYMBOLS.map((s) => (
                                    <option key={s} value={s}>
                                        {COIN_NAMES[s] || s.replace('USDT', '')} ({s.replace('USDT', '')})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-[#8888AA] font-medium mb-1.5 block">Investment per week (USD)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888AA]" />
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-9 bg-[#0A0A0F] border-white/10 focus:border-[#00D4FF]/50 text-white"
                                    placeholder="100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-[#8888AA] font-medium mb-1.5 block">Duration (weeks)</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888AA]" />
                                <Input
                                    type="number"
                                    value={weeks}
                                    onChange={(e) => setWeeks(e.target.value)}
                                    className="pl-9 bg-[#0A0A0F] border-white/10 focus:border-[#00D4FF]/50 text-white"
                                    placeholder="52"
                                />
                            </div>
                            <p className="text-[10px] text-[#555] mt-1 text-right">52 weeks = 1 year. Max 500.</p>
                        </div>

                        <Button
                            onClick={calculateDCA}
                            disabled={loading || !amount || !weeks}
                            className="w-full bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-[#0A0A0F] font-bold"
                        >
                            {loading ? 'Calculating...' : 'Calculate DCA Returns'}
                        </Button>
                    </div>
                </div>

                {/* Results */}
                <div className="rounded-2xl border border-white/5 bg-[#12121A] p-6 flex flex-col justify-center">
                    {result ? (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                            <div className="text-center">
                                <p className="text-[#8888AA] text-sm mb-1">If you invested ${amount} every week for {weeks} weeks,</p>
                                <div className="flex items-center justify-center gap-4 mt-4">
                                    <div>
                                        <p className="text-[#555] text-[10px] uppercase tracking-wide">Total Invested</p>
                                        <p className="text-xl font-bold font-mono text-white">
                                            ${result.invested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-[#333]" />
                                    <div>
                                        <p className="text-[#555] text-[10px] uppercase tracking-wide">Current Value</p>
                                        <p className={`text-2xl font-bold font-mono ${result.pnlPercent >= 0 ? 'text-[#00FF88]' : 'text-red-400'}`}>
                                            ${result.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 p-4 bg-[#0A0A0F] rounded-xl border border-white/5">
                                <div className="text-center">
                                    <p className="text-xs text-[#8888AA] mb-1">Total {symbol.replace('USDT', '')} Bought</p>
                                    <p className="font-mono text-white">{result.coinAmount.toFixed(6)}</p>
                                </div>
                                <div className="text-center border-l border-white/5">
                                    <p className="text-xs text-[#8888AA] mb-1">Return on Investment</p>
                                    <p className={`font-medium flex items-center justify-center gap-1 ${result.pnlPercent >= 0 ? 'text-[#00FF88]' : 'text-red-400'}`}>
                                        {result.pnlPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {result.pnlPercent >= 0 ? '+' : ''}{result.pnlPercent.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="text-center text-[#555] space-y-3">
                            <Calculator className="w-12 h-12 mx-auto opacity-20" />
                            <p className="text-sm">Enter your DCA strategy and calculate historical returns in real-time.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
