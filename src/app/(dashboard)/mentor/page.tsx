'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useCrypto } from '@/contexts/CryptoContext';
import { COIN_NAMES } from '@/lib/binance';
import ChatInterface from '@/components/mentor/ChatInterface';
import type { ChatMessage } from '@/types';

export default function MentorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const supabase = createClient();
  const { tickers, globalMarket } = useCrypto();

  // Build live market context snapshot for AI
  const buildMarketContext = useCallback(() => {
    const topCoins = Object.values(tickers)
      .map((t) => ({
        name: COIN_NAMES[t.symbol] || t.symbol.replace('usdt', '').toUpperCase(),
        symbol: t.symbol.replace('usdt', '').toUpperCase(),
        price: parseFloat(t.price),
        change24h: parseFloat(t.priceChangePercent),
      }))
      .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
      .slice(0, 15);

    const gainers = topCoins.filter((c) => c.change24h > 0).slice(0, 5);
    const losers = topCoins.filter((c) => c.change24h < 0).slice(0, 5);

    let ctx = '\n[LIVE MARKET DATA]\n';
    if (globalMarket) {
      ctx += `Total Market Cap: $${(globalMarket.totalMarketCap / 1e12).toFixed(2)}T | 24h Volume: $${(globalMarket.totalVolume24h / 1e9).toFixed(1)}B | BTC Dom: ${globalMarket.btcDominance.toFixed(1)}%\n`;
    }
    if (gainers.length) {
      ctx += 'Top Gainers: ' + gainers.map((c) => `${c.symbol} $${c.price.toLocaleString('en-US', { maximumFractionDigits: 4 })} (+${c.change24h.toFixed(2)}%)`).join(', ') + '\n';
    }
    if (losers.length) {
      ctx += 'Top Losers: ' + losers.map((c) => `${c.symbol} $${c.price.toLocaleString('en-US', { maximumFractionDigits: 4 })} (${c.change24h.toFixed(2)}%)`).join(', ') + '\n';
    }
    // BTC & ETH always
    const btc = tickers['btcusdt'];
    const eth = tickers['ethusdt'];
    if (btc) ctx += `BTC: $${parseFloat(btc.price).toLocaleString('en-US', { minimumFractionDigits: 2 })} (${parseFloat(btc.priceChangePercent).toFixed(2)}%)\n`;
    if (eth) ctx += `ETH: $${parseFloat(eth.price).toLocaleString('en-US', { minimumFractionDigits: 2 })} (${parseFloat(eth.priceChangePercent).toFixed(2)}%)\n`;
    return ctx;
  }, [tickers, globalMarket]);

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

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');

    // Save user message to Supabase
    await saveChatMessage('user', content);

    try {
      const response = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          marketContext: buildMarketContext(),
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

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullContent,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent('');

      // Save assistant message to Supabase
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

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
          AI Mentor
        </h1>
        <p className="text-sm text-[#8888AA] mt-1">
          Your personal crypto trading mentor powered by AI
        </p>
      </div>
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        streamingContent={streamingContent}
      />
    </div>
  );
}
