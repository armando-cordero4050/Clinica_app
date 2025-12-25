import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { Loader2, Calendar, User, Package, Eye } from 'lucide-react';
import { OrderDetail } from '../lab-orders/OrderDetail';

type Order = {
  id: string;
  order_number: string;
  patient_name: string;
  doctor_name: string;
  service_name: string;
  status: string;
  price: number;
  currency: string;
  created_at: string;
  estimated_completion: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En Proceso',
  completed: 'Completada',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  delivered: 'bg-slate-100 text-slate-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function ClinicOrdersList() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, [profile?.clinic_id]);

  async function loadOrders() {
    if (!profile?.clinic_id) return;

    try {
      setLoading(true);
      let query = supabase
        .from('lab_orders')
        .select('*')
        .eq('clinic_id', profile.clinic_id)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (selectedOrderId) {
    return (
      <div>
        <button
          onClick={() => setSelectedOrderId(null)}
          className="mb-4 text-emerald-600 hover:text-emerald-700 font-medium"
        >
          ← Volver a la lista
        </button>
        <OrderDetail orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Mis Órdenes</h2>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            loadOrders();
          }}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="in_progress">En Proceso</option>
          <option value="completed">Completada</option>
          <option value="delivered">Entregada</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No hay órdenes
          </h3>
          <p className="text-slate-600">
            {filterStatus === 'all'
              ? 'Crea tu primera orden para comenzar'
              : 'No hay órdenes con este estado'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Orden #{order.order_number}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLORS[order.status]
                      }`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-4 h-4" />
                      <span>{order.patient_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Package className="w-4 h-4" />
                      <span>{order.service_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(order.created_at).toLocaleDateString('es-GT')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4">
                    <span className="text-sm text-slate-600">
                      Doctor: <span className="font-medium">{order.doctor_name}</span>
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {order.currency === 'GTQ' ? 'Q' : '$'}
                      {order.price.toFixed(2)}
                    </span>
                    {order.estimated_completion && (
                      <span className="text-sm text-slate-600">
                        Est. entrega:{' '}
                        {new Date(order.estimated_completion).toLocaleDateString('es-GT')}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrderId(order.id)}
                  className="ml-4 p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Ver detalles"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
