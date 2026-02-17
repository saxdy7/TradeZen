'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getBinanceWSUrl, COIN_NAMES, COIN_ICONS } from '@/lib/binance';
import type { CryptoTicker } from '@/types';

interface UseBinanceWSOptions {
  symbols: string[];
}

export function useBinanceWS({ symbols }: UseBinanceWSOptions) {
  const [tickers, setTickers] = useState<Record<string, CryptoTicker>>({});
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = getBinanceWSUrl(symbols);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const data = message.data;
        if (!data) return;

        const symbolKey = data.s?.toLowerCase();
        if (!symbolKey) return;

        setTickers((prev) => ({
          ...prev,
          [symbolKey]: {
            symbol: symbolKey,
            price: data.c,
            priceChange: data.p,
            priceChangePercent: data.P,
            highPrice: data.h,
            lowPrice: data.l,
            volume: data.v,
            quoteVolume: data.q,
          },
        }));
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [symbols]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const tickerList = Object.values(tickers).map((t) => ({
    ...t,
    name: COIN_NAMES[t.symbol] || t.symbol.replace('usdt', '').toUpperCase(),
    icon: COIN_ICONS[t.symbol] || '●',
  }));

  return { tickers, tickerList, isConnected };
}
