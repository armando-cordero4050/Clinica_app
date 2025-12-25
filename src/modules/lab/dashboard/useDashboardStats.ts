import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export interface OrdersByStatus {
  status: string;
  count: number;
  total_revenue: number;
}

export interface RevenueByDate {
  date: string;
  revenue: number;
  order_count: number;
}

export interface AverageTimeByStatus {
  status: string;
  avg_hours: number;
}

export interface CriticalSLAOrder {
  id: string;
  order_number: string;
  clinic_name: string;
  patient_name: string;
  status: string;
  due_date: string;
  hours_remaining: number;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  ordersByStatus: OrdersByStatus[];
  revenueByDate: RevenueByDate[];
  avgTimeByStatus: AverageTimeByStatus[];
  criticalSLAOrders: CriticalSLAOrder[];
}

export function useDashboardStats(currency: string = 'GTQ') {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [currency]);

  async function fetchStats() {
    try {
      setLoading(true);
      setError(null);

      const priceField = currency === 'USD' ? 'price_usd' : 'price';

      const { data: ordersByStatus, error: statusError } = await supabase
        .from('lab_orders')
        .select('status, price, price_usd')
        .order('status');

      if (statusError) throw statusError;

      const statusMap = new Map<string, { count: number; revenue: number }>();
      let totalOrders = 0;
      let totalRevenue = 0;
      let pendingOrders = 0;
      let completedOrders = 0;

      ordersByStatus?.forEach((order) => {
        const revenue = currency === 'USD' ? order.price_usd : order.price;
        const existing = statusMap.get(order.status) || { count: 0, revenue: 0 };
        statusMap.set(order.status, {
          count: existing.count + 1,
          revenue: existing.revenue + revenue,
        });

        totalOrders++;
        totalRevenue += revenue;

        if (order.status === 'pending' || order.status === 'in_progress') {
          pendingOrders++;
        } else if (order.status === 'ready_delivery' || order.status === 'delivered') {
          completedOrders++;
        }
      });

      const ordersByStatusArray: OrdersByStatus[] = Array.from(statusMap.entries()).map(
        ([status, data]) => ({
          status,
          count: data.count,
          total_revenue: data.revenue,
        })
      );

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentOrders, error: recentError } = await supabase
        .from('lab_orders')
        .select('created_at, price, price_usd')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at');

      if (recentError) throw recentError;

      const dateMap = new Map<string, { revenue: number; count: number }>();
      recentOrders?.forEach((order) => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        const revenue = currency === 'USD' ? order.price_usd : order.price;
        const existing = dateMap.get(date) || { revenue: 0, count: 0 };
        dateMap.set(date, {
          revenue: existing.revenue + revenue,
          count: existing.count + 1,
        });
      });

      const revenueByDate: RevenueByDate[] = Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          order_count: data.count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const { data: historyData, error: historyError } = await supabase
        .from('order_history')
        .select('order_id, old_status, new_status, changed_at')
        .order('changed_at');

      if (historyError) throw historyError;

      const statusTimeMap = new Map<string, number[]>();
      const orderStatusMap = new Map<string, { status: string; enteredAt: Date }>();

      historyData?.forEach((entry) => {
        const orderId = entry.order_id;
        const timestamp = new Date(entry.changed_at);

        if (orderStatusMap.has(orderId)) {
          const previous = orderStatusMap.get(orderId)!;
          const timeSpent = timestamp.getTime() - previous.enteredAt.getTime();
          const hours = timeSpent / (1000 * 60 * 60);

          const times = statusTimeMap.get(previous.status) || [];
          times.push(hours);
          statusTimeMap.set(previous.status, times);
        }

        orderStatusMap.set(orderId, { status: entry.new_status, enteredAt: timestamp });
      });

      const avgTimeByStatus: AverageTimeByStatus[] = Array.from(statusTimeMap.entries()).map(
        ([status, times]) => ({
          status,
          avg_hours: times.reduce((sum, t) => sum + t, 0) / times.length,
        })
      );

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: criticalOrders, error: criticalError } = await supabase
        .from('lab_orders')
        .select('id, order_number, clinic_name, patient_name, status, due_date')
        .lte('due_date', tomorrow.toISOString())
        .not('status', 'in', '(delivered,cancelled)')
        .order('due_date');

      if (criticalError) throw criticalError;

      const criticalSLAOrders: CriticalSLAOrder[] =
        criticalOrders?.map((order) => {
          const now = new Date();
          const dueDate = new Date(order.due_date);
          const hoursRemaining = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

          return {
            id: order.id,
            order_number: order.order_number,
            clinic_name: order.clinic_name,
            patient_name: order.patient_name,
            status: order.status,
            due_date: order.due_date,
            hours_remaining: Math.round(hoursRemaining),
          };
        }) || [];

      setStats({
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders,
        ordersByStatus: ordersByStatusArray,
        revenueByDate,
        avgTimeByStatus,
        criticalSLAOrders,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Error loading statistics');
    } finally {
      setLoading(false);
    }
  }

  return { stats, loading, error, refetch: fetchStats };
}
