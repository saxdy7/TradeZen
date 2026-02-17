'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Trash2, Download, Briefcase, ChevronDown,
  BarChart3, Zap, Search, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AI_PERSONAS, type AIPersona } from '@/lib/groq';
import { TRACKED_SYMBOLS, COIN_NAMES } from '@/lib/binance';

const COIN_LIST = TRACKED_SYMBOLS.slice(0, 20).map((s) => ({
  symbol: s.replace('usdt', '').toUpperCase(),
  name: COIN_NAMES[s] || s,
  key: s,
}));

interface MentorToolbarProps {
  persona: AIPersona;
  onPersonaChange: (p: AIPersona) => void;
  portfolioEnabled: boolean;
  onTogglePortfolio: () => void;
  onClearChat: () => void;
  onExportChat: () => void;
  onQuickAnalyze: (coin: string) => void;
  isLoading: boolean;
}

export default function MentorToolbar({
  persona,
  onPersonaChange,
  portfolioEnabled,
  onTogglePortfolio,
  onClearChat,
  onExportChat,
  onQuickAnalyze,
  isLoading,
}: MentorToolbarProps) {
  const [showPersonas, setShowPersonas] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [coinSearch, setCoinSearch] = useState('');

  const currentPersona = AI_PERSONAS[persona];

  const filteredCoins = coinSearch
    ? COIN_LIST.filter(
        (c) =>
          c.symbol.toLowerCase().includes(coinSearch.toLowerCase()) ||
          c.name.toLowerCase().includes(coinSearch.toLowerCase())
      )
    : COIN_LIST;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-[#0E0E16]">
      {/* Persona Selector */}
      <div className="relative">
        <button
          onClick={() => { setShowPersonas(!showPersonas); setShowCoins(false); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12121A] border border-white/10 hover:border-[#00FF88]/30 transition-colors text-xs"
        >
          <span>{currentPersona.icon}</span>
          <span className="text-white font-medium">{currentPersona.name}</span>
          <ChevronDown className={`w-3 h-3 text-[#8888AA] transition-transform ${showPersonas ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showPersonas && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              className="absolute top-full mt-1 left-0 z-50 w-64 rounded-xl border border-white/10 bg-[#0A0A0F] shadow-2xl overflow-hidden"
            >
              {(Object.entries(AI_PERSONAS) as [AIPersona, typeof AI_PERSONAS.analyst][]).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => { onPersonaChange(key); setShowPersonas(false); }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                    persona === key ? 'bg-[#00FF88]/5 border-l-2 border-[#00FF88]' : ''
                  }`}
                >
                  <span className="text-lg mt-0.5">{p.icon}</span>
                  <div>
                    <div className="text-sm text-white font-medium">{p.name}</div>
                    <div className="text-[10px] text-[#8888AA] mt-0.5">{p.description}</div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Analyze */}
      <div className="relative">
        <button
          onClick={() => { setShowCoins(!showCoins); setShowPersonas(false); }}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 text-[#00D4FF] text-xs font-medium transition-colors disabled:opacity-50"
        >
          <Zap className="w-3 h-3" />
          Quick Analyze
          <ChevronDown className={`w-3 h-3 transition-transform ${showCoins ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showCoins && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              className="absolute top-full mt-1 left-0 z-50 w-56 rounded-xl border border-white/10 bg-[#0A0A0F] shadow-2xl overflow-hidden"
            >
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#8888AA]" />
                  <input
                    value={coinSearch}
                    onChange={(e) => setCoinSearch(e.target.value)}
                    placeholder="Search coin..."
                    className="w-full bg-[#12121A] border border-white/10 rounded-lg text-xs text-white px-7 py-1.5 focus:outline-none focus:border-[#00D4FF]/30"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredCoins.map((coin) => (
                  <button
                    key={coin.key}
                    onClick={() => {
                      onQuickAnalyze(coin.symbol);
                      setShowCoins(false);
                      setCoinSearch('');
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-[#00FF88]" />
                      <span className="text-xs text-white font-medium">{coin.symbol}</span>
                    </div>
                    <span className="text-[10px] text-[#8888AA]">{coin.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Portfolio Context Toggle */}
      <button
        onClick={onTogglePortfolio}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          portfolioEnabled
            ? 'bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30'
            : 'bg-[#12121A] text-[#8888AA] border border-white/10 hover:text-white'
        }`}
        title="Share your portfolio with the AI for personalized advice"
      >
        <Briefcase className="w-3 h-3" />
        Portfolio
        {portfolioEnabled && <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />}
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <Button
        onClick={onExportChat}
        variant="ghost"
        size="sm"
        className="text-[#8888AA] hover:text-white h-7 px-2"
        title="Export chat"
      >
        <Download className="w-3.5 h-3.5" />
      </Button>
      <Button
        onClick={onClearChat}
        variant="ghost"
        size="sm"
        className="text-[#8888AA] hover:text-red-400 h-7 px-2"
        title="Clear chat"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
