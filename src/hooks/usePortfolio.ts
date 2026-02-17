'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { PortfolioHolding, PortfolioFormData, PortfolioTransaction } from '@/types';

export function usePortfolio() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchHoldings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHoldings(data || []);
    } catch (err) {
      console.error('Error fetching holdings:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchTransactions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        // Table might not exist yet — that's ok
        console.warn('Transactions table may not exist:', error.message);
        return;
      }
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  }, [supabase]);

  const logTransaction = async (type: 'buy' | 'sell', formData: PortfolioFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('transactions').insert({
        user_id: user.id,
        coin_symbol: formData.coin_symbol.toUpperCase(),
        coin_name: formData.coin_name,
        type,
        amount: formData.amount,
        price: formData.buy_price,
        total_value: formData.amount * formData.buy_price,
        notes: formData.notes || null,
      }).then(() => fetchTransactions());
    } catch {
      // Silently fail if transactions table doesn't exist
    }
  };

  const addHolding = async (formData: PortfolioFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('portfolio').insert({
        user_id: user.id,
        coin_symbol: formData.coin_symbol.toUpperCase(),
        coin_name: formData.coin_name,
        amount: formData.amount,
        buy_price: formData.buy_price,
      });

      if (error) throw error;
      logTransaction('buy', formData).catch(() => {});
      await fetchHoldings();
    } catch (err) {
      console.error('Error adding holding:', err);
      throw err;
    }
  };

  const updateHolding = async (id: string, updates: Partial<PortfolioFormData>) => {
    try {
      const { error } = await supabase
        .from('portfolio')
        .update({
          ...(updates.coin_symbol && { coin_symbol: updates.coin_symbol.toUpperCase() }),
          ...(updates.coin_name && { coin_name: updates.coin_name }),
          ...(updates.amount !== undefined && { amount: updates.amount }),
          ...(updates.buy_price !== undefined && { buy_price: updates.buy_price }),
        })
        .eq('id', id);

      if (error) throw error;
      await fetchHoldings();
    } catch (err) {
      console.error('Error updating holding:', err);
      throw err;
    }
  };

  const deleteHolding = async (id: string) => {
    try {
      // Log as sell transaction before deleting (non-blocking)
      const holding = holdings.find((h) => h.id === id);
      if (holding) {
        logTransaction('sell', {
          coin_symbol: holding.coin_symbol,
          coin_name: holding.coin_name,
          amount: holding.amount,
          buy_price: holding.current_price || holding.buy_price,
        }).catch(() => {});
      }

      const { error } = await supabase
        .from('portfolio')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchHoldings();
    } catch (err) {
      console.error('Error deleting holding:', err);
      throw err;
    }
  };

  const exportCSV = () => {
    if (holdings.length === 0) return;
    const headers = ['Coin Symbol', 'Coin Name', 'Amount', 'Buy Price', 'Buy Date', 'Notes', 'Added'];
    const rows = holdings.map((h) => [
      h.coin_symbol,
      h.coin_name,
      h.amount,
      h.buy_price,
      h.buy_date || '',
      h.notes || '',
      h.created_at,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradezen-portfolio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchHoldings();
    fetchTransactions();
  }, [fetchHoldings, fetchTransactions]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('portfolio_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'portfolio' },
        () => {
          fetchHoldings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchHoldings]);

  return { holdings, transactions, loading, addHolding, updateHolding, deleteHolding, fetchHoldings, exportCSV };
}
