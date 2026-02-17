'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlerts } from '@/hooks/useAlerts';
import { useBinanceWS } from '@/hooks/useBinanceWS';
import { TRACKED_SYMBOLS, COIN_NAMES } from '@/lib/binance';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, Trash2, Plus, ArrowUp, ArrowDown, Check } from 'lucide-react';
import type { AlertFormData } from '@/types';

export default function AlertsPage() {
  const { alerts, loading, addAlert, deleteAlert, triggerAlert } = useAlerts();
  const { tickers } = useBinanceWS({ symbols: TRACKED_SYMBOLS });
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [formData, setFormData] = useState<AlertFormData>({
    coin_symbol: 'BTC',
    target_price: 0,
    direction: 'above',
  });

  // Check alerts against current prices
  const checkAlerts = useCallback(() => {
    alerts
      .filter((a) => !a.is_triggered)
      .forEach((alert) => {
        const ticker = tickers[`${alert.coin_symbol.toLowerCase()}usdt`];
        if (!ticker) return;

        const currentPrice = parseFloat(ticker.price);
        const triggered =
          (alert.direction === 'above' && currentPrice >= alert.target_price) ||
          (alert.direction === 'below' && currentPrice <= alert.target_price);

        if (triggered) {
          triggerAlert(alert.id);
          setNotification(
            `🔔 ${alert.coin_symbol} hit $${alert.target_price.toLocaleString()} (${alert.direction})!`
          );
          setTimeout(() => setNotification(null), 5000);
        }
      });
  }, [alerts, tickers, triggerAlert]);

  useEffect(() => {
    const interval = setInterval(checkAlerts, 10000);
    return () => clearInterval(interval);
  }, [checkAlerts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.coin_symbol || !formData.target_price) return;

    try {
      await addAlert(formData);
      setFormData({ coin_symbol: 'BTC', target_price: 0, direction: 'above' });
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const activeAlerts = alerts.filter((a) => !a.is_triggered);
  const triggeredAlerts = alerts.filter((a) => a.is_triggered);

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/20 text-[#00FF88] text-sm font-medium shadow-lg"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
            Price Alerts
          </h1>
          <p className="text-sm text-[#8888AA] mt-1">
            Get notified when prices hit your targets
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#00FF88] hover:bg-[#00FF88]/80 text-[#0A0A0F] font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Alert
        </Button>
      </div>

      {/* Add Alert Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="rounded-xl border border-white/5 bg-[#12121A] p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-[#8888AA] mb-1.5 block">Coin Symbol</label>
                <select
                  value={formData.coin_symbol}
                  onChange={(e) => setFormData({ ...formData, coin_symbol: e.target.value })}
                  className="w-full h-9 rounded-md bg-[#0A0A0F] border border-white/10 text-white text-sm px-3"
                >
                  {TRACKED_SYMBOLS.map((s) => {
                    const sym = s.replace('usdt', '').toUpperCase();
                    return (
                      <option key={sym} value={sym}>
                        {sym} - {COIN_NAMES[s] || sym}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8888AA] mb-1.5 block">Target Price ($)</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="50000"
                  value={formData.target_price || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, target_price: parseFloat(e.target.value) || 0 })
                  }
                  className="bg-[#0A0A0F] border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-[#8888AA] mb-1.5 block">Direction</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, direction: 'above' })}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-sm ${
                      formData.direction === 'above'
                        ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20'
                        : 'bg-[#0A0A0F] text-[#8888AA] border border-white/10'
                    }`}
                  >
                    <ArrowUp className="w-3 h-3" /> Above
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, direction: 'below' })}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-sm ${
                      formData.direction === 'below'
                        ? 'bg-red-400/10 text-red-400 border border-red-400/20'
                        : 'bg-[#0A0A0F] text-[#8888AA] border border-white/10'
                    }`}
                  >
                    <ArrowDown className="w-3 h-3" /> Below
                  </button>
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  className="w-full bg-[#00FF88] hover:bg-[#00FF88]/80 text-[#0A0A0F]"
                >
                  Create Alert
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Active Alerts */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-[#00D4FF]" />
          <h2 className="text-sm font-medium text-white">Active Alerts ({activeAlerts.length})</h2>
        </div>

        {loading ? (
          <div className="text-center text-[#8888AA] text-sm py-8">Loading...</div>
        ) : activeAlerts.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-[#12121A] p-8 text-center text-[#8888AA] text-sm">
            No active alerts. Create one to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeAlerts.map((alert, i) => {
              const ticker = tickers[`${alert.coin_symbol.toLowerCase()}usdt`];
              const currentPrice = ticker ? parseFloat(ticker.price) : 0;

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-white/5 bg-[#12121A] p-4 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{alert.coin_symbol}/USDT</p>
                      <div className="flex items-center gap-1 mt-1">
                        {alert.direction === 'above' ? (
                          <ArrowUp className="w-3 h-3 text-[#00FF88]" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-red-400" />
                        )}
                        <span className={`text-xs ${alert.direction === 'above' ? 'text-[#00FF88]' : 'text-red-400'}`}>
                          {alert.direction === 'above' ? 'Above' : 'Below'} ${alert.target_price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#8888AA] hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {currentPrice > 0 && (
                    <div className="mt-3 text-xs text-[#8888AA]">
                      Current: ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BellRing className="w-4 h-4 text-[#FFD93D]" />
            <h2 className="text-sm font-medium text-white">Triggered ({triggeredAlerts.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {triggeredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-xl border border-[#00FF88]/10 bg-[#00FF88]/5 p-4 relative group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#00FF88]" />
                      <p className="text-sm font-medium text-white">{alert.coin_symbol}/USDT</p>
                    </div>
                    <p className="text-xs text-[#8888AA] mt-1">
                      Target ${alert.target_price.toLocaleString()} ({alert.direction})
                    </p>
                  </div>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#8888AA] hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
