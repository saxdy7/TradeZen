'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useBinanceWS } from '@/hooks/useBinanceWS';
import { TRACKED_SYMBOLS, fetchGlobalMarketData, fetchCoinMarketData, type GlobalMarketData, type CoinMarketInfo } from '@/lib/binance';
import type { CryptoTicker } from '@/types';

interface CryptoContextValue {
  tickers: Record<string, CryptoTicker>;
  tickerList: (CryptoTicker & { name: string; icon: string })[];
  isConnected: boolean;
  globalMarket: GlobalMarketData | null;
  coinMarketData: Record<string, CoinMarketInfo>;
  isLoadingMarketData: boolean;
}

const CryptoContext = createContext<CryptoContextValue | null>(null);

export function CryptoProvider({ children }: { children: ReactNode }) {
  // Single WebSocket connection for ALL 20 tracked coins
  const { tickers, tickerList, isConnected } = useBinanceWS({ symbols: TRACKED_SYMBOLS });

  // Global market stats from CoinGecko
  const [globalMarket, setGlobalMarket] = useState<GlobalMarketData | null>(null);
  // Per-coin market data (market cap, rank, sparkline, ATH)
  const [coinMarketData, setCoinMarketData] = useState<Record<string, CoinMarketInfo>>({});
  const [isLoadingMarketData, setIsLoadingMarketData] = useState(true);

  // Fetch CoinGecko data on mount and every 60 seconds
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingMarketData(true);
      const [global, coins] = await Promise.all([
        fetchGlobalMarketData(),
        fetchCoinMarketData(),
      ]);
      if (global) setGlobalMarket(global);
      if (coins) setCoinMarketData(coins);
      setIsLoadingMarketData(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <CryptoContext.Provider
      value={{ tickers, tickerList, isConnected, globalMarket, coinMarketData, isLoadingMarketData }}
    >
      {children}
    </CryptoContext.Provider>
  );
}

export function useCrypto() {
  const ctx = useContext(CryptoContext);
  if (!ctx) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return ctx;
}
