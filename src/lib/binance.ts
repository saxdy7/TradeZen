// Binance WebSocket and REST API helpers
// All data comes from real Binance & CoinGecko public APIs

export const BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream';

export const TRACKED_SYMBOLS = [
  'btcusdt', 'ethusdt', 'bnbusdt', 'solusdt', 'xrpusdt',
  'dogeusdt', 'adausdt', 'avaxusdt', 'dotusdt', 'maticusdt',
  'linkusdt', 'uniusdt', 'ltcusdt', 'atomusdt', 'etcusdt',
  'xlmusdt', 'nearusdt', 'aptusdt', 'filusdt', 'arbusdt',
];

export const MAIN_SYMBOLS = ['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt'];

export const COIN_NAMES: Record<string, string> = {
  btcusdt: 'Bitcoin',
  ethusdt: 'Ethereum',
  bnbusdt: 'BNB',
  solusdt: 'Solana',
  xrpusdt: 'XRP',
  dogeusdt: 'Dogecoin',
  adausdt: 'Cardano',
  avaxusdt: 'Avalanche',
  dotusdt: 'Polkadot',
  maticusdt: 'Polygon',
  linkusdt: 'Chainlink',
  uniusdt: 'Uniswap',
  ltcusdt: 'Litecoin',
  atomusdt: 'Cosmos',
  etcusdt: 'Ethereum Classic',
  xlmusdt: 'Stellar',
  nearusdt: 'NEAR Protocol',
  aptusdt: 'Aptos',
  filusdt: 'Filecoin',
  arbusdt: 'Arbitrum',
};

export const COIN_ICONS: Record<string, string> = {
  btcusdt: '₿',
  ethusdt: 'Ξ',
  bnbusdt: '◆',
  solusdt: '◎',
  xrpusdt: '✕',
  dogeusdt: 'Ð',
  adausdt: '₳',
  avaxusdt: '▲',
  dotusdt: '●',
  maticusdt: '⬡',
  linkusdt: '⬢',
  uniusdt: '🦄',
  ltcusdt: 'Ł',
  atomusdt: '⚛',
  etcusdt: 'ξ',
  xlmusdt: '✦',
  nearusdt: 'Ⓝ',
  aptusdt: '◈',
  filusdt: '⨏',
  arbusdt: '🔵',
};

export function getBinanceWSUrl(symbols: string[]): string {
  const streams = symbols.map((s) => `${s}@ticker`).join('/');
  return `${BINANCE_WS_URL}?streams=${streams}`;
}

// WebSocket URL for live kline/candlestick stream (used by TradingChart)
export function getBinanceKlineWSUrl(symbol: string, interval: string): string {
  return `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`;
}

export async function fetchBinancePrice(symbol: string): Promise<number> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const price = parseFloat(data.price);
    return isNaN(price) ? 0 : price;
  } catch (e) {
    console.warn(`[Binance] Failed to fetch price for ${symbol}:`, e);
    return 0;
  }
}

// Fetch full 24h ticker stats for a symbol (high, low, volume, etc.)
export async function fetchBinance24hTicker(symbol: string) {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`[Binance] Failed to fetch 24h ticker for ${symbol}:`, e);
    return null;
  }
}

export async function fetchBinanceKlines(
  symbol: string,
  interval: string = '1h',
  limit: number = 100
) {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.map((k: string[]) => ({
      time: Math.floor(Number(k[0]) / 1000),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  } catch (e) {
    console.warn(`[Binance] Failed to fetch klines for ${symbol}:`, e);
    return [];
  }
}

// ===== Binance Order Book (free, no API key) =====

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastUpdateId: number;
}

export async function fetchOrderBook(symbol: string, limit: number = 20): Promise<OrderBook | null> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/depth?symbol=${symbol.toUpperCase()}&limit=${limit}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const mapEntries = (entries: [string, string][]): OrderBookEntry[] => {
      let cumTotal = 0;
      return entries.map(([p, q]) => {
        const price = parseFloat(p);
        const quantity = parseFloat(q);
        cumTotal += quantity;
        return { price, quantity, total: cumTotal };
      });
    };

    return {
      bids: mapEntries(data.bids),
      asks: mapEntries(data.asks).reverse(),
      lastUpdateId: data.lastUpdateId,
    };
  } catch (e) {
    console.warn(`[Binance] Failed to fetch order book for ${symbol}:`, e);
    return null;
  }
}

// ===== Binance Recent Trades (free, no API key) =====

export interface RecentTrade {
  id: number;
  price: number;
  qty: number;
  quoteQty: number;
  time: number;
  isBuyerMaker: boolean;
}

export async function fetchRecentTrades(symbol: string, limit: number = 30): Promise<RecentTrade[]> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/trades?symbol=${symbol.toUpperCase()}&limit=${limit}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.map((t: { id: number; price: string; qty: string; quoteQty: string; time: number; isBuyerMaker: boolean }) => ({
      id: t.id,
      price: parseFloat(t.price),
      qty: parseFloat(t.qty),
      quoteQty: parseFloat(t.quoteQty),
      time: t.time,
      isBuyerMaker: t.isBuyerMaker,
    }));
  } catch (e) {
    console.warn(`[Binance] Failed to fetch recent trades for ${symbol}:`, e);
    return [];
  }
}

// ===== Binance Trade WebSocket (live stream of trades) =====
export function getBinanceTradeWSUrl(symbol: string): string {
  return `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`;
}

// ===== Binance Depth WebSocket (live order book updates) =====
export function getBinanceDepthWSUrl(symbol: string): string {
  return `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth20@100ms`;
}

// ===== CoinGecko API — Global market stats (free, no API key required) =====

export interface GlobalMarketData {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  activeCryptocurrencies: number;
  marketCapChangePercent24h: number;
}

export async function fetchGlobalMarketData(): Promise<GlobalMarketData | null> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/global');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const d = json.data;
    return {
      totalMarketCap: d.total_market_cap?.usd ?? 0,
      totalVolume24h: d.total_volume?.usd ?? 0,
      btcDominance: d.market_cap_percentage?.btc ?? 0,
      ethDominance: d.market_cap_percentage?.eth ?? 0,
      activeCryptocurrencies: d.active_cryptocurrencies ?? 0,
      marketCapChangePercent24h: d.market_cap_change_percentage_24h_usd ?? 0,
    };
  } catch (e) {
    console.warn('[CoinGecko] Failed to fetch global market data:', e);
    return null;
  }
}

// CoinGecko coin ID mapping (for market cap lookups)
const COINGECKO_IDS: Record<string, string> = {
  btcusdt: 'bitcoin',
  ethusdt: 'ethereum',
  bnbusdt: 'binancecoin',
  solusdt: 'solana',
  xrpusdt: 'ripple',
  dogeusdt: 'dogecoin',
  adausdt: 'cardano',
  avaxusdt: 'avalanche-2',
  dotusdt: 'polkadot',
  maticusdt: 'matic-network',
  linkusdt: 'chainlink',
  uniusdt: 'uniswap',
  ltcusdt: 'litecoin',
  atomusdt: 'cosmos',
  etcusdt: 'ethereum-classic',
  xlmusdt: 'stellar',
  nearusdt: 'near',
  aptusdt: 'aptos',
  filusdt: 'filecoin',
  arbusdt: 'arbitrum',
};

export interface CoinMarketInfo {
  id: string;
  symbol: string;
  marketCap: number;
  marketCapRank: number;
  totalVolume: number;
  circulatingSupply: number;
  ath: number;
  athChangePercent: number;
  sparkline7d: number[];
}

// Fetch market data for all tracked coins in one CoinGecko call
export async function fetchCoinMarketData(): Promise<Record<string, CoinMarketInfo>> {
  try {
    const ids = Object.values(COINGECKO_IDS).join(',');
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const coins = await res.json();

    const result: Record<string, CoinMarketInfo> = {};
    for (const coin of coins) {
      // Reverse-lookup the symbol key (e.g. 'bitcoin' → 'btcusdt')
      const symbolKey = Object.entries(COINGECKO_IDS).find(([, v]) => v === coin.id)?.[0];
      if (symbolKey) {
        result[symbolKey] = {
          id: coin.id,
          symbol: symbolKey,
          marketCap: coin.market_cap ?? 0,
          marketCapRank: coin.market_cap_rank ?? 0,
          totalVolume: coin.total_volume ?? 0,
          circulatingSupply: coin.circulating_supply ?? 0,
          ath: coin.ath ?? 0,
          athChangePercent: coin.ath_change_percentage ?? 0,
          sparkline7d: coin.sparkline_in_7d?.price ?? [],
        };
      }
    }
    return result;
  } catch (e) {
    console.warn('[CoinGecko] Failed to fetch coin market data:', e);
    return {};
  }
}
