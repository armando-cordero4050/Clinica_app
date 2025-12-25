import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export interface Service {
  id: string;
  laboratory_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price_gtq: number;
  price_usd: number;
  turnaround_days: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceFormData {
  name: string;
  description: string;
  category: string;
  price_gtq: number;
  price_usd: number;
  turnaround_days: number;
  active: boolean;
}

const GTQ_TO_USD_RATE = 7.85;

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();

    const channel = supabase
      .channel('lab_services_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_services' }, () => {
        loadServices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadServices() {
    try {
      const { data, error } = await supabase
        .from('lab_services')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createService(formData: ServiceFormData) {
    try {
      const { data: labData, error: labError } = await supabase
        .from('laboratories')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (labError) throw labError;
      if (!labData) throw new Error('No laboratory found');

      const { error } = await supabase
        .from('lab_services')
        .insert({
          laboratory_id: labData.id,
          name: formData.name,
          description: formData.description || null,
          category: formData.category || null,
          price_gtq: formData.price_gtq,
          price_usd: formData.price_usd,
          turnaround_days: formData.turnaround_days,
          active: formData.active,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  async function updateService(id: string, formData: ServiceFormData) {
    try {
      const { error } = await supabase
        .from('lab_services')
        .update({
          name: formData.name,
          description: formData.description || null,
          category: formData.category || null,
          price_gtq: formData.price_gtq,
          price_usd: formData.price_usd,
          turnaround_days: formData.turnaround_days,
          active: formData.active,
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  async function deleteService(id: string) {
    try {
      const { error } = await supabase
        .from('lab_services')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  async function toggleServiceActive(id: string, currentActive: boolean) {
    try {
      const { error } = await supabase
        .from('lab_services')
        .update({ active: !currentActive })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling service:', error);
      throw error;
    }
  }

  function convertGTQtoUSD(gtq: number): number {
    return parseFloat((gtq / GTQ_TO_USD_RATE).toFixed(2));
  }

  function convertUSDtoGTQ(usd: number): number {
    return parseFloat((usd * GTQ_TO_USD_RATE).toFixed(2));
  }

  return {
    services,
    loading,
    createService,
    updateService,
    deleteService,
    toggleServiceActive,
    convertGTQtoUSD,
    convertUSDtoGTQ,
  };
}
