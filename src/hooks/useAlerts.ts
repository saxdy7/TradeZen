'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { PriceAlert, AlertFormData } from '@/types';

export function useAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchAlerts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const addAlert = async (formData: AlertFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('alerts').insert({
        user_id: user.id,
        coin_symbol: formData.coin_symbol.toUpperCase(),
        target_price: formData.target_price,
        direction: formData.direction,
        is_triggered: false,
      });

      if (error) throw error;
      await fetchAlerts();
    } catch (err) {
      console.error('Error adding alert:', err);
      throw err;
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAlerts();
    } catch (err) {
      console.error('Error deleting alert:', err);
      throw err;
    }
  };

  const triggerAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_triggered: true })
        .eq('id', id);

      if (error) throw error;
      await fetchAlerts();
    } catch (err) {
      console.error('Error triggering alert:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('alerts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchAlerts]);

  return { alerts, loading, addAlert, deleteAlert, triggerAlert, fetchAlerts };
}
