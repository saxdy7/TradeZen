'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCrypto } from '@/contexts/CryptoContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { fetchBinancePrice, MAIN_SYMBOLS, COIN_NAMES, COIN_ICONS } from '@/lib/binance';
import PriceCard from '@/components/crypto/PriceCard';
import TradingChart from '@/components/charts/TradingChart';
import { Activity, TrendingUp, TrendingDown, Wallet, Globe2, BarChart3, Bitcoin, DollarSign, Coins } from 'lucide-react';
import type { PortfolioHolding } from '@/types';

export default function DashboardPage() {
  // Shared context — single WebSocket for all 20 coins
  const { tickers, tickerList, isConnected, globalMarket, coinMarketData } = useCrypto();
  const { holdings } = usePortfolio();

  const [sentiment, setSentiment] = useState<{ value: number; label: string }>({ value: 50, label: 'Neutral' });
  const [enrichedHoldings, setEnrichedHoldings] = useState<PortfolioHolding[]>([]);
  const [selectedChart, setSelectedChart] = useState('BTCUSDT');

  // Fetch live Fear & Greed index
  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const res = await fetch('https://api.alternative.me/fng/?limit=1');
        const json = await res.json();
        if (json.data?.[0]) {
          setSentiment({
            value: parseInt(json.data[0].value, 10),
            label: json.data[0].value_classification,
          });
        }
      } catch {
        // Keep default on error
      }
    };
    fetchSentiment();
  }, []);

  // Enrich portfolio holdings with live prices
  useEffect(() => {
    const enrich = async () => {
      if (holdings.length === 0) { setEnrichedHoldings([]); return; }
      const enriched = await Promise.all(
        holdings.map(async (h) => {
          // Try WebSocket price first, fallback to REST
          const wsPrice = tickers[`${h.coin_symbol.toLowerCase()}usdt`];
          const currentPrice = wsPrice ? parseFloat(wsPrice.price) : await fetchBinancePrice(`${h.coin_symbol}USDT`);
          const currentValue = currentPrice * h.amount;
          const investedValue = h.buy_price * h.amount;
          const pnl = currentValue - investedValue;
          const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
          return { ...h, current_price: currentPrice, current_value: currentValue, pnl, pnl_percent: pnlPercent };
        })
      );
      setEnrichedHoldings(enriched);
    };
    enrich();
  }, [holdings, tickers]);

  // Use ALL 20 tracked coins for Gainers & Losers (not just 4)
  const allTickers = Object.values(tickers)
    .map((t) => ({
      symbol: t.symbol,
      name: COIN_NAMES[t.symbol] || t.symbol.replace('usdt', '').toUpperCase(),
      icon: COIN_ICONS[t.symbol] || '●',
      price: parseFloat(t.price),
      change: parseFloat(t.priceChangePercent),
      volume: parseFloat(t.quoteVolume),
    }))
    .sort((a, b) => b.change - a.change);

  const gainers = allTickers.filter((t) => t.change > 0).slice(0, 5);
  const losers = [...allTickers].sort((a, b) => a.change - b.change).filter((t) => t.change < 0).slice(0, 5);

  // Portfolio summary
  const totalPortfolioValue = enrichedHoldings.reduce((s, h) => s + (h.current_value || 0), 0);
  const totalInvested = enrichedHoldings.reduce((s, h) => s + h.buy_price * h.amount, 0);
  const totalPnl = totalPortfolioValue - totalInvested;
  const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  // Main price cards — only 4 main symbols
  const mainTickers = tickerList.filter((t) => MAIN_SYMBOLS.includes(t.symbol));

  // Format large numbers
  const formatB = (n: number) => {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${n.toLocaleString()}`;
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
            Dashboard
          </h1>
          <p className="text-xs lg:text-sm text-[#8888AA] mt-1">Real-time market data from Binance & CoinGecko</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12121A] border border-white/5">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00FF88]' : 'bg-red-400'} animate-pulse`} />
          <span className="text-xs text-[#8888AA]">
            {isConnected ? `${Object.keys(tickers).length} coins live` : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Global Market Stats Bar */}
      {globalMarket && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 lg:gap-3"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#12121A] border border-white/5">
            <Globe2 className="w-4 h-4 text-[#00D4FF]" />
            <div>
              <p className="text-[10px] text-[#8888AA]">Total Market Cap</p>
              <p className="text-xs font-semibold text-white">{formatB(globalMarket.totalMarketCap)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#12121A] border border-white/5">
            <BarChart3 className="w-4 h-4 text-[#00FF88]" />
            <div>
              <p className="text-[10px] text-[#8888AA]">24h Volume</p>
              <p className="text-xs font-semibold text-white">{formatB(globalMarket.totalVolume24h)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#12121A] border border-white/5">
            <Bitcoin className="w-4 h-4 text-[#F7931A]" />
            <div>
              <p className="text-[10px] text-[#8888AA]">BTC Dominance</p>
              <p className="text-xs font-semibold text-white">{globalMarket.btcDominance.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#12121A] border border-white/5">
            <DollarSign className="w-4 h-4 text-[#627EEA]" />
            <div>
              <p className="text-[10px] text-[#8888AA]">ETH Dominance</p>
              <p className="text-xs font-semibold text-white">{globalMarket.ethDominance.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#12121A] border border-white/5">
            <Coins className="w-4 h-4 text-[#FFD93D]" />
            <div>
              <p className="text-[10px] text-[#8888AA]">Active Coins</p>
              <p className="text-xs font-semibold text-white">{globalMarket.activeCryptocurrencies.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Price Cards — 4 main coins with click-to-chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainTickers.length > 0
          ? mainTickers.map((ticker) => (
              <div key={ticker.symbol} onClick={() => setSelectedChart(ticker.symbol.toUpperCase())} className="cursor-pointer">
                <PriceCard
                  symbol={ticker.symbol}
                  name={ticker.name}
                  price={ticker.price}
                  change={ticker.priceChangePercent}
                  icon={ticker.icon}
                />
              </div>
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl border border-white/5 bg-[#12121A] animate-pulse"
              />
            ))}
      </div>

      {/* Chart + Side Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live TradingView Chart */}
        <div className="lg:col-span-2">
          <TradingChart symbol={selectedChart} interval="1h" />
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Market Sentiment */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl border border-white/5 bg-[#12121A] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-[#00D4FF]" />
              <h3 className="text-sm font-medium text-white">Market Sentiment</h3>
            </div>
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <div className={`text-4xl font-bold font-[family-name:var(--font-space-grotesk)] ${
                  sentiment.value >= 60 ? 'text-[#00FF88]' : sentiment.value >= 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {sentiment.value}
                </div>
                <div className={`text-sm mt-1 ${
                  sentiment.value >= 60 ? 'text-[#00FF88]' : sentiment.value >= 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>{sentiment.label}</div>
                <div className="text-xs text-[#8888AA] mt-1">Fear & Greed Index</div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-[#0A0A0F] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-[#00FF88]"
                style={{ width: `${sentiment.value}%` }}
              />
            </div>
          </motion.div>

          {/* Top Gainers — uses ALL 20 coins */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-white/5 bg-[#12121A] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[#00FF88]" />
              <h3 className="text-sm font-medium text-white">Top Gainers (24h)</h3>
            </div>
            <div className="space-y-2">
              {gainers.length > 0
                ? gainers.map((g) => (
                    <div
                      key={g.symbol}
                      className="flex justify-between items-center cursor-pointer hover:bg-white/[0.02] rounded px-1 py-0.5 transition-colors"
                      onClick={() => setSelectedChart(g.symbol.toUpperCase().replace('USDT', '') + 'USDT')}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{g.icon}</span>
                        <div>
                          <span className="text-xs text-white font-medium">{g.name}</span>
                          <span className="text-[10px] text-[#8888AA] ml-1">${g.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-[#00FF88]">+{g.change.toFixed(2)}%</span>
                    </div>
                  ))
                : <div className="text-xs text-[#8888AA] text-center py-2">Loading 20 coins...</div>}
            </div>
          </motion.div>

          {/* Top Losers — uses ALL 20 coins */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-white/5 bg-[#12121A] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-medium text-white">Top Losers (24h)</h3>
            </div>
            <div className="space-y-2">
              {losers.length > 0
                ? losers.map((l) => (
                    <div
                      key={l.symbol}
                      className="flex justify-between items-center cursor-pointer hover:bg-white/[0.02] rounded px-1 py-0.5 transition-colors"
                      onClick={() => setSelectedChart(l.symbol.toUpperCase().replace('USDT', '') + 'USDT')}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{l.icon}</span>
                        <div>
                          <span className="text-xs text-white font-medium">{l.name}</span>
                          <span className="text-[10px] text-[#8888AA] ml-1">${l.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-red-400">{l.change.toFixed(2)}%</span>
                    </div>
                  ))
                : <div className="text-xs text-[#8888AA] text-center py-2">Loading 20 coins...</div>}
            </div>
          </motion.div>

          {/* Portfolio Summary — REAL DATA */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-white/5 bg-[#12121A] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-[#FFD93D]" />
              <h3 className="text-sm font-medium text-white">Portfolio Summary</h3>
            </div>
            {enrichedHoldings.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#8888AA]">Total Value</span>
                  <span className="text-sm font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                    ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#8888AA]">Total Invested</span>
                  <span className="text-sm text-white">
                    ${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#8888AA]">P&L</span>
                  <span className={`text-sm font-bold ${totalPnl >= 0 ? 'text-[#00FF88]' : 'text-red-400'}`}>
                    {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)} ({totalPnlPercent.toFixed(2)}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#8888AA]">Holdings</span>
                  <span className="text-sm text-white">{enrichedHoldings.length} coins</span>
                </div>
                {/* Mini holdings list */}
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  {enrichedHoldings.slice(0, 4).map((h) => (
                    <div key={h.id} className="flex justify-between items-center">
                      <span className="text-xs text-[#8888AA]">{h.coin_symbol}</span>
                      <span className={`text-xs font-medium ${(h.pnl || 0) >= 0 ? 'text-[#00FF88]' : 'text-red-400'}`}>
                        ${(h.current_value || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {enrichedHoldings.length > 4 && (
                    <p className="text-[10px] text-[#8888AA] text-center">+{enrichedHoldings.length - 4} more</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Wallet className="w-6 h-6 text-[#8888AA] mx-auto mb-2" />
                <p className="text-xs text-[#8888AA]">
                  No holdings yet. Add coins in the Portfolio page to see your summary here.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
