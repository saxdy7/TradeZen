// ===== Crypto Types =====
export interface CryptoTicker {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}

export interface CoinData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  logo?: string;
}

export interface PriceCardData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  icon: string;
}

// ===== Chat Types =====
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatHistory {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// ===== Portfolio Types =====
export interface PortfolioHolding {
  id: string;
  user_id: string;
  coin_symbol: string;
  coin_name: string;
  amount: number;
  buy_price: number;
  buy_date?: string;
  notes?: string;
  created_at: string;
  current_price?: number;
  pnl?: number;
  pnl_percent?: number;
  current_value?: number;
}

export interface PortfolioFormData {
  coin_symbol: string;
  coin_name: string;
  amount: number;
  buy_price: number;
  buy_date?: string;
  notes?: string;
}

export interface PortfolioTransaction {
  id: string;
  user_id: string;
  coin_symbol: string;
  coin_name: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total_value: number;
  notes?: string;
  created_at: string;
}

// ===== Alert Types =====
export interface PriceAlert {
  id: string;
  user_id: string;
  coin_symbol: string;
  target_price: number;
  direction: 'above' | 'below';
  is_triggered: boolean;
  created_at: string;
}

export interface AlertFormData {
  coin_symbol: string;
  target_price: number;
  direction: 'above' | 'below';
}

// ===== User Types =====
export interface UserProfile {
  id: string;
  username: string;
  created_at: string;
}

// ===== Binance WebSocket Types =====
export interface BinanceTickerStream {
  stream: string;
  data: {
    e: string;        // Event type
    s: string;        // Symbol
    c: string;        // Close price
    p: string;        // Price change
    P: string;        // Price change percent
    h: string;        // High price
    l: string;        // Low price
    v: string;        // Volume
    q: string;        // Quote volume
  };
}

export interface BinanceMultiStream {
  stream: string;
  data: BinanceTickerStream['data'];
}
