'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PortfolioFormData } from '@/types';
import { COIN_NAMES } from '@/lib/binance';

interface HoldingFormProps {
  onSubmit: (data: PortfolioFormData) => Promise<void>;
}

export default function HoldingForm({ onSubmit }: HoldingFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PortfolioFormData>({
    coin_symbol: '',
    coin_name: '',
    amount: 0,
    buy_price: 0,
  });

  const handleSymbolChange = (value: string) => {
    const upper = value.toUpperCase();
    const key = `${value.toLowerCase()}usdt`;
    setFormData({
      ...formData,
      coin_symbol: upper,
      coin_name: COIN_NAMES[key] || upper,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.coin_symbol || !formData.amount || !formData.buy_price) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ coin_symbol: '', coin_name: '', amount: 0, buy_price: 0 });
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={() => setOpen(!open)}
        className="bg-[#00FF88] hover:bg-[#00FF88]/80 text-[#0A0A0F] font-medium"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Holding
      </Button>

      {open && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleSubmit}
          className="mt-4 p-4 rounded-xl border border-white/5 bg-[#12121A] space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#8888AA] mb-1 block">Coin Symbol</label>
              <Input
                placeholder="BTC"
                value={formData.coin_symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="bg-[#0A0A0F] border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#8888AA] mb-1 block">Coin Name</label>
              <Input
                placeholder="Bitcoin"
                value={formData.coin_name}
                onChange={(e) => setFormData({ ...formData, coin_name: e.target.value })}
                className="bg-[#0A0A0F] border-white/10 text-white"
              />
            </div>
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
            <div>
              <label className="text-xs text-[#8888AA] mb-1 block">Buy Price ($)</label>
              <Input
                type="number"
                step="any"
                placeholder="42000"
                value={formData.buy_price || ''}
                onChange={(e) => setFormData({ ...formData, buy_price: parseFloat(e.target.value) || 0 })}
                className="bg-[#0A0A0F] border-white/10 text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#00FF88] hover:bg-[#00FF88]/80 text-[#0A0A0F]"
            >
              {loading ? 'Adding...' : 'Add to Portfolio'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-white/10 text-[#8888AA] hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </motion.form>
      )}
    </div>
  );
}
