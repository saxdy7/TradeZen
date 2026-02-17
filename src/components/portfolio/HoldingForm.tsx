'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Zap, X, Calendar, StickyNote, Edit3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PortfolioFormData, PortfolioHolding } from '@/types';
import { TRACKED_SYMBOLS, COIN_NAMES, fetchBinancePrice } from '@/lib/binance';

// Build coin options list from tracked symbols
const COIN_OPTIONS = TRACKED_SYMBOLS.map((s) => {
  const symbol = s.replace('usdt', '').toUpperCase();
  return { symbol, name: COIN_NAMES[s] || symbol, key: s };
});

interface HoldingFormProps {
  onSubmit: (data: PortfolioFormData) => Promise<void>;
  onUpdate?: (id: string, data: Partial<PortfolioFormData>) => Promise<void>;
  editHolding?: PortfolioHolding | null;
  onCancelEdit?: () => void;
}

export default function HoldingForm({ onSubmit, onUpdate, editHolding, onCancelEdit }: HoldingFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<PortfolioFormData>({
    coin_symbol: '',
    coin_name: '',
    amount: 0,
    buy_price: 0,
    buy_date: '',
    notes: '',
  });

  const isEditing = !!editHolding;

  // Populate form when editing
  useEffect(() => {
    if (editHolding) {
      setFormData({
        coin_symbol: editHolding.coin_symbol,
        coin_name: editHolding.coin_name,
        amount: editHolding.amount,
        buy_price: editHolding.buy_price,
        buy_date: editHolding.buy_date || '',
        notes: editHolding.notes || '',
      });
      setSearchQuery(`${editHolding.coin_symbol} - ${editHolding.coin_name}`);
      setOpen(true);
    }
  }, [editHolding]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCoins = useMemo(() => {
    if (!searchQuery) return COIN_OPTIONS;
    const q = searchQuery.toLowerCase();
    return COIN_OPTIONS.filter(
      (c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const selectCoin = (coin: (typeof COIN_OPTIONS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      coin_symbol: coin.symbol,
      coin_name: coin.name,
    }));
    setSearchQuery(`${coin.symbol} - ${coin.name}`);
    setShowDropdown(false);
  };

  const fetchCurrentPrice = async () => {
    if (!formData.coin_symbol) return;
    setFetchingPrice(true);
    try {
      const pair = `${formData.coin_symbol.toLowerCase()}usdt`;
      const price = await fetchBinancePrice(pair);
      if (price) {
        setFormData((prev) => ({ ...prev, buy_price: parseFloat(price.toFixed(6)) }));
      }
    } catch (err) {
      console.error('Price fetch failed:', err);
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.coin_symbol || !formData.amount || !formData.buy_price) return;

    setLoading(true);
    try {
      if (isEditing && editHolding && onUpdate) {
        await onUpdate(editHolding.id, formData);
        onCancelEdit?.();
      } else {
        await onSubmit(formData);
      }
      setFormData({ coin_symbol: '', coin_name: '', amount: 0, buy_price: 0, buy_date: '', notes: '' });
      setSearchQuery('');
      if (!isEditing) setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ coin_symbol: '', coin_name: '', amount: 0, buy_price: 0, buy_date: '', notes: '' });
    setSearchQuery('');
    setOpen(false);
    onCancelEdit?.();
  };

  return (
    <div>
      {!isEditing && (
        <Button
          onClick={() => setOpen(!open)}
          className="bg-[#00FF88] hover:bg-[#00FF88]/80 text-[#0A0A0F] font-medium"
        >
          {open ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {open ? 'Close' : 'Add Holding'}
        </Button>
      )}

      <AnimatePresence>
        {open && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="mt-4 p-5 rounded-xl border border-white/5 bg-[#12121A] space-y-4"
          >
            {isEditing && (
              <div className="flex items-center gap-2 text-[#00D4FF] text-sm font-medium mb-1">
                <Edit3 className="w-4 h-4" />
                Editing {editHolding?.coin_symbol} holding
              </div>
            )}

            {/* Coin Search Dropdown */}
            <div ref={dropdownRef} className="relative">
              <label className="text-xs text-[#8888AA] mb-1 block">
                <Search className="w-3 h-3 inline mr-1" />
                Search Coin
              </label>
              <Input
                placeholder="Search by name or symbol..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="bg-[#0A0A0F] border-white/10 text-white"
                disabled={isEditing}
              />
              {showDropdown && !isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#0A0A0F] shadow-xl"
                >
                  {filteredCoins.length === 0 ? (
                    <div className="p-3 text-sm text-[#8888AA]">No coins found</div>
                  ) : (
                    filteredCoins.map((coin) => (
                      <button
                        key={coin.key}
                        type="button"
                        onClick={() => selectCoin(coin)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-[#1A1A2E] transition-colors flex items-center justify-between group"
                      >
                        <span className="text-white font-medium group-hover:text-[#00FF88]">
                          {coin.symbol}
                        </span>
                        <span className="text-[#8888AA] text-xs">{coin.name}</span>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Amount */}
              <div>
                <label className="text-xs text-[#8888AA] mb-1 block">Amount</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="0.5"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="bg-[#0A0A0F] border-white/10 text-white"
                />
              </div>

              {/* Buy Price + auto-fetch */}
              <div>
                <label className="text-xs text-[#8888AA] mb-1 block">Buy Price ($)</label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    step="any"
                    placeholder="42000"
                    value={formData.buy_price || ''}
                    onChange={(e) => setFormData({ ...formData, buy_price: parseFloat(e.target.value) || 0 })}
                    className="bg-[#0A0A0F] border-white/10 text-white flex-1"
                  />
                  <Button
                    type="button"
                    onClick={fetchCurrentPrice}
                    disabled={!formData.coin_symbol || fetchingPrice}
                    className="bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 text-[#00D4FF] px-2 shrink-0"
                    title="Fetch current price"
                  >
                    <Zap className={`w-4 h-4 ${fetchingPrice ? 'animate-pulse' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Buy Date */}
              <div>
                <label className="text-xs text-[#8888AA] mb-1 block">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Buy Date
                </label>
                <Input
                  type="date"
                  value={formData.buy_date || ''}
                  onChange={(e) => setFormData({ ...formData, buy_date: e.target.value })}
                  className="bg-[#0A0A0F] border-white/10 text-white"
                />
              </div>

              {/* Total Value Preview */}
              <div>
                <label className="text-xs text-[#8888AA] mb-1 block">Total Value</label>
                <div className="h-9 flex items-center px-3 rounded-md bg-[#0A0A0F] border border-white/10 text-[#00FF88] font-mono text-sm">
                  ${(formData.amount * formData.buy_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-[#8888AA] mb-1 block">
                <StickyNote className="w-3 h-3 inline mr-1" />
                Notes (optional)
              </label>
              <textarea
                placeholder="DCA buy, swing trade, long-term hold..."
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full h-16 resize-none rounded-md bg-[#0A0A0F] border border-white/10 text-white text-sm px-3 py-2 placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#00FF88]/50"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading || !formData.coin_symbol}
                className="bg-[#00FF88] hover:bg-[#00FF88]/80 text-[#0A0A0F] font-medium"
              >
                {loading ? (isEditing ? 'Saving...' : 'Adding...') : isEditing ? 'Save Changes' : 'Add to Portfolio'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="border-white/10 text-[#8888AA] hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
