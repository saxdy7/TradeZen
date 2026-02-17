'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { PortfolioHolding, PortfolioFormData } from '@/types';

export function usePortfolio() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
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
      await fetchHoldings();
    } catch (err) {
      console.error('Error adding holding:', err);
      throw err;
    }
  };

  const deleteHolding = async (id: string) => {
    try {
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

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

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

  return { holdings, loading, addHolding, deleteHolding, fetchHoldings };
}
