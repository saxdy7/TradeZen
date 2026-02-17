'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useCrypto } from '@/contexts/CryptoContext';
import { COIN_NAMES } from '@/lib/binance';
import { AI_PERSONAS, type AIPersona } from '@/lib/groq';
import { usePortfolio } from '@/hooks/usePortfolio';
import ChatInterface from '@/components/mentor/ChatInterface';
import MentorToolbar from '@/components/mentor/MentorToolbar';
import { Sparkles } from 'lucide-react';
import type { ChatMessage } from '@/types';

export default function MentorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [persona, setPersona] = useState<AIPersona>('analyst');
  const [portfolioEnabled, setPortfolioEnabled] = useState(false);
  const supabase = createClient();
  const { tickers, globalMarket } = useCrypto();
  const { holdings } = usePortfolio();

  // Build live market context snapshot for AI
  const buildMarketContext = useCallback(() => {
    const topCoins = Object.values(tickers)
      .map((t) => ({
        name: COIN_NAMES[t.symbol] || t.symbol.replace('usdt', '').toUpperCase(),
        symbol: t.symbol.replace('usdt', '').toUpperCase(),
        price: parseFloat(t.price),
        change24h: parseFloat(t.priceChangePercent),
        volume: parseFloat(t.quoteVolume),
        high: parseFloat(t.highPrice),
        low: parseFloat(t.lowPrice),
      }))
      .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));

    const gainers = topCoins.filter((c) => c.change24h > 0).slice(0, 8);
    const losers = topCoins.filter((c) => c.change24h < 0).slice(0, 8);

    let ctx = '\n[LIVE MARKET DATA — REAL-TIME FROM BINANCE]\n';
    if (globalMarket) {
      ctx += `Total Market Cap: $${(globalMarket.totalMarketCap / 1e12).toFixed(2)}T | 24h Volume: $${(globalMarket.totalVolume24h / 1e9).toFixed(1)}B | BTC Dominance: ${globalMarket.btcDominance.toFixed(1)}%\n`;
    }

    // Always include top coins with more data
    const keyCoins = ['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt', 'xrpusdt'];
    ctx += '\nKey Coins:\n';
    keyCoins.forEach((sym) => {
      const t = tickers[sym];
      if (t) {
        const price = parseFloat(t.price);
        const change = parseFloat(t.priceChangePercent);
        const high = parseFloat(t.highPrice);
        const low = parseFloat(t.lowPrice);
        const vol = parseFloat(t.quoteVolume);
        const name = COIN_NAMES[sym] || sym;
        ctx += `${name}: $${price.toLocaleString('en-US', { maximumFractionDigits: 4 })} (${change >= 0 ? '+' : ''}${change.toFixed(2)}%) | H: $${high.toLocaleString()} L: $${low.toLocaleString()} | Vol: $${(vol / 1e6).toFixed(1)}M\n`;
      }
    });

    if (gainers.length) {
      ctx += '\nTop Gainers: ' + gainers.map((c) => `${c.symbol} $${c.price.toLocaleString('en-US', { maximumFractionDigits: 4 })} (+${c.change24h.toFixed(2)}%)`).join(', ') + '\n';
    }
    if (losers.length) {
      ctx += 'Top Losers: ' + losers.map((c) => `${c.symbol} $${c.price.toLocaleString('en-US', { maximumFractionDigits: 4 })} (${c.change24h.toFixed(2)}%)`).join(', ') + '\n';
    }

    return ctx;
  }, [tickers, globalMarket]);

  // Build portfolio context
  const buildPortfolioContext = useCallback(() => {
    if (!portfolioEnabled || holdings.length === 0) return '';

    let ctx = '';
    const totalInvested = holdings.reduce((s, h) => s + h.buy_price * h.amount, 0);

    ctx += `Holdings (${holdings.length} coins, $${totalInvested.toLocaleString()} invested):\n`;
    holdings.forEach((h) => {
      const currentTicker = tickers[`${h.coin_symbol.toLowerCase()}usdt`];
      const currentPrice = currentTicker ? parseFloat(currentTicker.price) : h.buy_price;
      const value = currentPrice * h.amount;
      const pnl = value - h.buy_price * h.amount;
      const pnlPct = h.buy_price > 0 ? (pnl / (h.buy_price * h.amount)) * 100 : 0;
      ctx += `- ${h.coin_symbol} (${h.coin_name}): ${h.amount} units @ $${h.buy_price} → Now $${currentPrice.toLocaleString()} | Value: $${value.toFixed(2)} | P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPct.toFixed(2)}%)\n`;
    });

    return ctx;
  }, [portfolioEnabled, holdings, tickers]);

  // Load chat history from Supabase
  const loadChatHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      if (data) {
        setMessages(data.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          created_at: m.created_at,
        })));
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  }, [supabase]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  const saveChatMessage = async (role: 'user' | 'assistant', content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('chat_history').insert({
        user_id: user.id,
        role,
        content,
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  };

  const sendToAI = async (userContent: string, extraMessages: ChatMessage[] = [], analysisRequest?: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
      created_at: new Date().toISOString(),
    };

    const allMessages = [...extraMessages, userMessage];
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');

    await saveChatMessage('user', userContent);

    try {
      const response = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, ...allMessages].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          marketContext: buildMarketContext(),
          portfolioContext: buildPortfolioContext(),
          persona,
          analysisRequest,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                  setStreamingContent(fullContent);
                }
              } catch {
                // Ignore parse errors from SSE
              }
            }
          }
        }
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullContent,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent('');

      await saveChatMessage('assistant', fullContent);
    } catch (err) {
      console.error('Error:', err);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingContent('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    await sendToAI(content);
  };

  const handleQuickAnalyze = async (coin: string) => {
    const ticker = tickers[`${coin.toLowerCase()}usdt`];
    let priceInfo = '';
    if (ticker) {
      priceInfo = ` (currently at $${parseFloat(ticker.price).toLocaleString()}, ${parseFloat(ticker.priceChangePercent).toFixed(2)}% 24h)`;
    }
    await sendToAI(
      `Give me a comprehensive analysis of ${coin}${priceInfo}`,
      [],
      `Provide a full professional analysis of ${coin}${priceInfo}. Include: 1) Current trend assessment 2) Key support/resistance levels 3) Technical indicator interpretation 4) A potential trade setup with entry/TP/SL 5) Risk factors. Use the live market data.`
    );
  };

  const handleRegenerateLastResponse = async () => {
    if (messages.length < 2) return;
    // Remove last assistant message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;
    setMessages((prev) => prev.slice(0, -1));
    await sendToAI(lastUserMsg.content);
  };

  const handleClearChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('chat_history').delete().eq('user_id', user.id);
      setMessages([]);
    } catch (err) {
      console.error('Error clearing chat:', err);
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const text = messages
      .map((m) => `[${m.role.toUpperCase()}] ${new Date(m.created_at).toLocaleString()}\n${m.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradezen-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentPersona = AI_PERSONAS[persona];

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#0A0A0F]" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
              AI Mentor
            </h1>
            <p className="text-xs text-[#8888AA]">
              {currentPersona.icon} {currentPersona.name} Mode • Llama 3.3 70B • Live Market Data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
          <span className="text-xs text-[#00FF88]">Online</span>
        </div>
      </div>

      {/* Toolbar + Chat Container */}
      <div className="rounded-xl border border-white/5 bg-[#12121A] overflow-hidden">
        <MentorToolbar
          persona={persona}
          onPersonaChange={setPersona}
          portfolioEnabled={portfolioEnabled}
          onTogglePortfolio={() => setPortfolioEnabled(!portfolioEnabled)}
          onClearChat={handleClearChat}
          onExportChat={handleExportChat}
          onQuickAnalyze={handleQuickAnalyze}
          isLoading={isLoading}
        />
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onRegenerateLastResponse={handleRegenerateLastResponse}
          isLoading={isLoading}
          streamingContent={streamingContent}
          persona={persona}
        />
      </div>
    </div>
  );
}
