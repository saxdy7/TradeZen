'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, Copy, Check, RefreshCw, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '@/types';
import type { AIPersona } from '@/lib/groq';

const PROMPT_CATEGORIES: Record<string, { icon: string; prompts: string[] }> = {
  'Analysis': {
    icon: '📊',
    prompts: [
      'Full technical analysis of BTC right now',
      'Which coins are showing bullish divergence?',
      'What are the key support/resistance levels for ETH?',
      'Give me a market overview with top movers',
    ],
  },
  'Trading': {
    icon: '💰',
    prompts: [
      'Give me a swing trade setup for SOL',
      'Best scalping strategy for current market?',
      'Create a DCA strategy for a $1000 portfolio',
      'How to set stop losses for altcoins?',
    ],
  },
  'Learn': {
    icon: '🎓',
    prompts: [
      'Explain RSI divergence with examples',
      'How do perpetual futures work?',
      'What is impermanent loss in DeFi?',
      'Teach me Elliott Wave basics',
    ],
  },
  'Alpha': {
    icon: '🔥',
    prompts: [
      'What crypto narratives are trending?',
      'Best airdrop farming strategies right now?',
      'Which low-cap coins have strong fundamentals?',
      'Smart money movements this week?',
    ],
  },
};

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onRegenerateLastResponse?: () => void;
  isLoading: boolean;
  streamingContent: string;
  persona?: AIPersona;
}

export default function ChatInterface({
  messages,
  onSendMessage,
  onRegenerateLastResponse,
  isLoading,
  streamingContent,
  persona,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Analysis');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt);
  };

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const lastAssistantIndex = [...messages].reverse().findIndex((m) => m.role === 'assistant');
  const canRegenerate = lastAssistantIndex !== -1 && !isLoading && messages[messages.length - 1]?.role === 'assistant';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-xl border border-white/5 bg-[#12121A] overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Welcome message */}
          {messages.length === 0 && !streamingContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00FF88]/20 to-[#00D4FF]/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-[#00FF88]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                TradeZen AI Mentor
              </h3>
              <p className="text-xs text-[#8888AA] max-w-sm mx-auto mb-6">
                Your pro-level crypto AI — technical analysis, trade signals, education, and alpha. Pick a category below or type anything.
              </p>

              {/* Category Tabs */}
              <div className="flex justify-center gap-2 mb-4">
                {Object.entries(PROMPT_CATEGORIES).map(([cat, { icon }]) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeCategory === cat
                        ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30'
                        : 'text-[#8888AA] border border-white/10 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {icon} {cat}
                  </button>
                ))}
              </div>

              {/* Quick Prompts */}
              <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                {PROMPT_CATEGORIES[activeCategory]?.prompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="px-3 py-2 rounded-xl border border-white/10 text-xs text-[#8888AA] hover:text-[#00FF88] hover:border-[#00FF88]/30 hover:bg-[#00FF88]/5 transition-all text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Chat messages */}
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-[#0A0A0F]" />
                  </div>
                )}
                <div className="max-w-[80%] space-y-1">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#00FF88]/10 text-white border border-[#00FF88]/20'
                        : 'bg-white/[0.03] text-white/90 border border-white/5'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2 prose-li:my-0.5 prose-pre:bg-[#0A0A0F] prose-pre:border prose-pre:border-white/10 prose-code:text-[#00FF88] prose-strong:text-white prose-a:text-[#00D4FF] prose-table:text-xs prose-th:text-[#8888AA] prose-th:border-b prose-th:border-white/10 prose-td:border-b prose-td:border-white/5">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                  {/* Message meta */}
                  <div className={`flex items-center gap-2 px-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-[#555] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTime(msg.created_at)}
                    </span>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-[#8888AA] hover:text-white"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-[#00FF88]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming response */}
          {streamingContent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 justify-start"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-[#0A0A0F]" />
              </div>
              <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-white/[0.03] text-white/90 border border-white/5">
                <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2 prose-li:my-0.5 prose-pre:bg-[#0A0A0F] prose-pre:border prose-pre:border-white/10 prose-code:text-[#00FF88] prose-strong:text-white">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                </div>
                <span className="inline-block w-1.5 h-4 bg-[#00FF88] animate-pulse ml-0.5" />
              </div>
            </motion.div>
          )}

          {/* Typing indicator */}
          {isLoading && !streamingContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 items-start"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-[#0A0A0F]" />
              </div>
              <div className="flex gap-1 py-3 px-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-2 h-2 rounded-full bg-[#8888AA] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#8888AA] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#8888AA] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}

          {/* Regenerate button */}
          {canRegenerate && onRegenerateLastResponse && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center"
            >
              <button
                onClick={onRegenerateLastResponse}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-xs text-[#8888AA] hover:text-[#00FF88] hover:border-[#00FF88]/30 transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate response
              </button>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick prompts when messages exist */}
      {messages.length > 0 && (
        <div className="px-4 py-2 border-t border-white/5 flex gap-2 overflow-x-auto">
          {PROMPT_CATEGORIES[activeCategory]?.prompts.slice(0, 3).map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleQuickPrompt(prompt)}
              className="px-3 py-1 rounded-full border border-white/10 text-xs text-[#8888AA] hover:text-[#00FF88] hover:border-[#00FF88]/30 transition-all whitespace-nowrap flex-shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-white/5">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about crypto, trading, analysis..."
          className="flex-1 bg-[#0A0A0F] border-white/10 text-white placeholder:text-[#555]"
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-[#00FF88] hover:bg-[#00FF88]/80 text-[#0A0A0F] px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
