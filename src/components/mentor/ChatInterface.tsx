'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ChatMessage } from '@/types';

const QUICK_PROMPTS = [
  'Should I buy BTC now?',
  'Explain DeFi',
  'Best coins this week?',
  'What is a stop loss?',
  'How to read candlestick charts?',
  'Risk management tips',
];

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  streamingContent: string;
}

export default function ChatInterface({
  messages,
  onSendMessage,
  isLoading,
  streamingContent,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-xl border border-white/5 bg-[#12121A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#0A0A0F]" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">TradeZen AI Mentor</p>
          <p className="text-xs text-[#8888AA]">Powered by Llama 3.3 70B</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
          <span className="text-xs text-[#00FF88]">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && !streamingContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00FF88]/20 to-[#00D4FF]/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-[#00FF88]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Welcome to TradeZen AI Mentor
              </h3>
              <p className="text-sm text-[#8888AA] max-w-md mx-auto">
                I&apos;m your personal crypto trading mentor. Ask me about market analysis,
                trading strategies, risk management, or any crypto concept!
              </p>

              {/* Quick prompts */}
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="px-3 py-1.5 rounded-full border border-white/10 text-xs text-[#8888AA] hover:text-[#00FF88] hover:border-[#00FF88]/30 transition-all"
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
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-[#0A0A0F]" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#00FF88]/10 text-white border border-[#00FF88]/20'
                      : 'bg-white/5 text-white/90 border border-white/5'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-[#0A0A0F]" />
              </div>
              <div className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-white/5 text-white/90 border border-white/5">
                <div className="whitespace-pre-wrap">{streamingContent}</div>
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick prompts (shown when there are messages) */}
      {messages.length > 0 && (
        <div className="px-4 py-2 border-t border-white/5 flex gap-2 overflow-x-auto">
          {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your crypto mentor..."
          className="flex-1 bg-[#0A0A0F] border-white/10 text-white placeholder:text-[#8888AA]"
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
