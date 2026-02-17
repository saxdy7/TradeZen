// Binance WebSocket and REST API helpers

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

export async function fetchBinancePrice(symbol: string): Promise<number> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`
    );
    const data = await res.json();
    return parseFloat(data.price);
  } catch {
    return 0;
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
    const data = await res.json();
    return data.map((k: string[]) => ({
      time: k[0] / 1000,
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  } catch {
    return [];
  }
}
