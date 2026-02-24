// Binance WebSocket and REST API helpers
// All data comes from real Binance & CoinGecko public APIs

export const BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream';

export const TRACKED_SYMBOLS = [
  // Top 50 by market cap + volume
  'btcusdt', 'ethusdt', 'bnbusdt', 'solusdt', 'xrpusdt',
  'dogeusdt', 'adausdt', 'avaxusdt', 'dotusdt', 'maticusdt',
  'linkusdt', 'uniusdt', 'ltcusdt', 'atomusdt', 'etcusdt',
  'xlmusdt', 'nearusdt', 'aptusdt', 'filusdt', 'arbusdt',
  // 20 more coins
  'trxusdt', 'shibusdt', 'bchusdt', 'icpusdt', 'suiusdt',
  'hbarusdt', 'vetusdt', 'opusdt', 'injusdt', 'seiusdt',
  'tiausdt', 'ftmusdt', 'thetausdt', 'algousdt', 'renderusdt',
  'grtusdt', 'imxusdt', 'aaveusdt', 'mkrusdt', 'snxusdt',
  // 10 more popular coins
  'wldusdt', 'pendleusdt', 'jupusdt', 'ondousdt', 'enausdt',
  'stxusdt', 'ldousdt', 'runeusdt', 'fetusdt', 'pepeusdt',
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
  trxusdt: 'TRON',
  shibusdt: 'Shiba Inu',
  bchusdt: 'Bitcoin Cash',
  icpusdt: 'Internet Computer',
  suiusdt: 'Sui',
  hbarusdt: 'Hedera',
  vetusdt: 'VeChain',
  opusdt: 'Optimism',
  injusdt: 'Injective',
  seiusdt: 'Sei',
  tiausdt: 'Celestia',
  ftmusdt: 'Fantom',
  thetausdt: 'Theta Network',
  algousdt: 'Algorand',
  renderusdt: 'Render',
  grtusdt: 'The Graph',
  imxusdt: 'Immutable',
  aaveusdt: 'Aave',
  mkrusdt: 'Maker',
  snxusdt: 'Synthetix',
  wldusdt: 'Worldcoin',
  pendleusdt: 'Pendle',
  jupusdt: 'Jupiter',
  ondousdt: 'Ondo',
  enausdt: 'Ethena',
  stxusdt: 'Stacks',
  ldousdt: 'Lido DAO',
  runeusdt: 'THORChain',
  fetusdt: 'Fetch.ai',
  pepeusdt: 'Pepe',
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
  trxusdt: '♦',
  shibusdt: '🐕',
  bchusdt: '₿',
  icpusdt: '∞',
  suiusdt: '💧',
  hbarusdt: 'ℏ',
  vetusdt: 'V',
  opusdt: '🔴',
  injusdt: '💉',
  seiusdt: '🌊',
  tiausdt: '☀',
  ftmusdt: '👻',
  thetausdt: 'θ',
  algousdt: 'Å',
  renderusdt: '🎨',
  grtusdt: '📊',
  imxusdt: '🛡',
  aaveusdt: '👻',
  mkrusdt: 'Ⓜ',
  snxusdt: '⚡',
  wldusdt: '🌍',
  pendleusdt: '⏳',
  jupusdt: '🪐',
  ondousdt: '🏦',
  enausdt: '🔮',
  stxusdt: '📦',
  ldousdt: '💎',
  runeusdt: 'ᚱ',
  fetusdt: '🤖',
  pepeusdt: '🐸',
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
  trxusdt: 'tron',
  shibusdt: 'shiba-inu',
  bchusdt: 'bitcoin-cash',
  icpusdt: 'internet-computer',
  suiusdt: 'sui',
  hbarusdt: 'hedera-hashgraph',
  vetusdt: 'vechain',
  opusdt: 'optimism',
  injusdt: 'injective-protocol',
  seiusdt: 'sei-network',
  tiausdt: 'celestia',
  ftmusdt: 'fantom',
  thetausdt: 'theta-token',
  algousdt: 'algorand',
  renderusdt: 'render-token',
  grtusdt: 'the-graph',
  imxusdt: 'immutable-x',
  aaveusdt: 'aave',
  mkrusdt: 'maker',
  snxusdt: 'havven',
  wldusdt: 'worldcoin-wld',
  pendleusdt: 'pendle',
  jupusdt: 'jupiter-exchange-solana',
  ondousdt: 'ondo-finance',
  enausdt: 'ethena',
  stxusdt: 'blockstack',
  ldousdt: 'lido-dao',
  runeusdt: 'thorchain',
  fetusdt: 'fetch-ai',
  pepeusdt: 'pepe',
};

// Export COINGECKO_IDS for use in other components
export { COINGECKO_IDS };

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

// ===== Detailed Coin Info (for coin detail page) =====
export interface CoinDetailInfo {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  marketCapRank: number;
  marketCap: number;
  totalVolume: number;
  circulatingSupply: number;
  totalSupply: number | null;
  maxSupply: number | null;
  ath: number;
  athDate: string;
  athChangePercent: number;
  atl: number;
  atlDate: string;
  atlChangePercent: number;
  priceChangePercent24h: number;
  priceChangePercent7d: number;
  priceChangePercent30d: number;
  sparkline7d: number[];
  homepage: string;
  twitter: string;
  github: string;
  categories: string[];
  genesisDate: string | null;
}

export async function fetchCoinDetail(symbolKey: string): Promise<CoinDetailInfo | null> {
  const geckoId = COINGECKO_IDS[symbolKey];
  if (!geckoId) return null;
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${geckoId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const c = await res.json();
    return {
      id: c.id,
      name: c.name,
      symbol: c.symbol,
      description: c.description?.en?.slice(0, 600) || '',
      image: c.image?.large || c.image?.small || '',
      marketCapRank: c.market_cap_rank ?? 0,
      marketCap: c.market_data?.market_cap?.usd ?? 0,
      totalVolume: c.market_data?.total_volume?.usd ?? 0,
      circulatingSupply: c.market_data?.circulating_supply ?? 0,
      totalSupply: c.market_data?.total_supply ?? null,
      maxSupply: c.market_data?.max_supply ?? null,
      ath: c.market_data?.ath?.usd ?? 0,
      athDate: c.market_data?.ath_date?.usd ?? '',
      athChangePercent: c.market_data?.ath_change_percentage?.usd ?? 0,
      atl: c.market_data?.atl?.usd ?? 0,
      atlDate: c.market_data?.atl_date?.usd ?? '',
      atlChangePercent: c.market_data?.atl_change_percentage?.usd ?? 0,
      priceChangePercent24h: c.market_data?.price_change_percentage_24h ?? 0,
      priceChangePercent7d: c.market_data?.price_change_percentage_7d ?? 0,
      priceChangePercent30d: c.market_data?.price_change_percentage_30d ?? 0,
      sparkline7d: c.market_data?.sparkline_7d?.price ?? [],
      homepage: c.links?.homepage?.[0] || '',
      twitter: c.links?.twitter_screen_name || '',
      github: c.links?.repos_url?.github?.[0] || '',
      categories: c.categories?.filter(Boolean)?.slice(0, 4) || [],
      genesisDate: c.genesis_date || null,
    };
  } catch (e) {
    console.warn(`[CoinGecko] Failed to fetch detail for ${symbolKey}:`, e);
    return null;
  }
}

// ===== Crypto News from CryptoPanic (free RSS proxy) =====
export interface CryptoNewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  kind: 'news' | 'media';
}

export async function fetchCryptoNews(): Promise<CryptoNewsItem[]> {
  try {
    // Use CryptoPanic free public feed (no API key needed for basic access)
    const res = await fetch(
      'https://cryptopanic.com/api/free/v1/posts/?auth_token=&public=true&kind=news&regions=en&metadata=true',
      { next: { revalidate: 300 } }
    );
    if (res.ok) {
      const json = await res.json();
      return (json.results || []).slice(0, 15).map((item: { title: string; url: string; source: { domain: string }; published_at: string; kind: string }) => ({
        title: item.title,
        url: item.url,
        source: item.source?.domain || 'Unknown',
        publishedAt: item.published_at,
        kind: item.kind || 'news',
      }));
    }
    // Fallback: fetch from CoinGecko status updates (always works)
    return [];
  } catch {
    return [];
  }
}
