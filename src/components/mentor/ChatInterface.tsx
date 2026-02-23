'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, Copy, Check, RefreshCw, Clock, Code2, Table2, ListOrdered, Hash, Quote, FileCode, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '@/types';
import type { AIPersona } from '@/lib/ai-personas';

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

// ═══════════════════════════════════════════════
// PRO MARKDOWN COMPONENTS
// ═══════════════════════════════════════════════
const mdComponents: Components = {
  // ── Headers with gradient accents ──
  h1: ({ children }) => (
    <div className="mt-4 mb-3 pb-2 border-b border-[#00FF88]/20">
      <h1 className="text-lg font-bold text-white flex items-center gap-2 font-[family-name:var(--font-space-grotesk)]">
        <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[#00FF88] to-[#00D4FF] flex-shrink-0" />
        {children}
      </h1>
    </div>
  ),
  h2: ({ children }) => (
    <div className="mt-4 mb-2 pb-1.5 border-b border-white/5">
      <h2 className="text-[15px] font-bold text-white flex items-center gap-2 font-[family-name:var(--font-space-grotesk)]">
        <span className="w-1 h-4 rounded-full bg-[#00D4FF] flex-shrink-0" />
        {children}
      </h2>
    </div>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-[#00D4FF] mt-3 mb-1.5 flex items-center gap-1.5">
      <Hash className="w-3.5 h-3.5 text-[#00D4FF]/50" />
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-[#FFD93D] mt-2 mb-1">{children}</h4>
  ),

  // ── Paragraph ──
  p: ({ children }) => (
    <p className="text-[13px] text-white/80 leading-relaxed my-1.5">{children}</p>
  ),

  // ── Strong / emphasis ──
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
  em: ({ children }) => <em className="text-[#00D4FF] not-italic font-medium">{children}</em>,

  // ── Links ──
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#00D4FF] hover:text-[#00FF88] underline underline-offset-2 transition-colors">
      {children}
    </a>
  ),

  // ── Unordered list ──
  ul: ({ children }) => <ul className="my-2 space-y-1 pl-1">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 space-y-1 pl-1 counter-reset-[item]">{children}</ol>,
  li: ({ children, ...props }) => {
    // Detect if parent is ordered via index prop
    return (
      <li className="flex items-start gap-2 text-[13px] text-white/80">
        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00FF88]/60 flex-shrink-0" />
        <span className="flex-1 leading-relaxed">{children}</span>
      </li>
    );
  },

  // ── Blockquote ──
  blockquote: ({ children }) => (
    <blockquote className="my-3 pl-3 border-l-2 border-[#FFD93D]/40 bg-[#FFD93D]/5 rounded-r-lg py-2 pr-3">
      <div className="text-[13px] text-[#FFD93D]/80">{children}</div>
    </blockquote>
  ),

  // ── Horizontal rule ──
  hr: () => (
    <div className="my-3 border-t border-white/5" />
  ),

  // ── Code blocks ──
  pre: ({ children }) => (
    <div className="my-3 rounded-lg border border-white/10 bg-[#0A0A0F] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-b border-white/5">
        <span className="flex items-center gap-1.5 text-[10px] text-[#8888AA]">
          <FileCode className="w-3 h-3" /> Code
        </span>
      </div>
      <div className="p-3 overflow-x-auto">
        {children}
      </div>
    </div>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className="text-xs font-mono text-[#00FF88] leading-relaxed whitespace-pre-wrap break-words">
          {children}
        </code>
      );
    }
    // Inline code
    return (
      <code className="px-1.5 py-0.5 rounded bg-[#00FF88]/10 text-[#00FF88] text-xs font-mono">
        {children}
      </code>
    );
  },

  // ── Tables ──
  table: ({ children }) => (
    <div className="my-3 rounded-lg border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">{children}</table>
      </div>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/[0.03] border-b border-white/10">{children}</thead>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-white/[0.02] transition-colors">{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#8888AA] uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-xs text-white/80">{children}</td>
  ),

  // ── Images ──
  img: ({ src, alt }) => (
    <img src={src} alt={alt || ''} className="rounded-lg border border-white/10 max-w-full my-2" />
  ),
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
                        : 'bg-[#0E0E18] text-white/90 border border-white/5'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{msg.content}</ReactMarkdown>
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
              <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-[#0E0E18] text-white/90 border border-white/5">
                <div className="max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{streamingContent}</ReactMarkdown>
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
