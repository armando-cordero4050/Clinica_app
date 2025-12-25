import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Clock, Package, User, Wallet } from 'lucide-react';
import { OrderDetail } from './OrderDetail';

type Order = {
  id: string;
  order_number: string;
  clinic_name: string;
  doctor_name: string;
  patient_name: string;
  service_name: string;
  status: string;
  due_date: string | null;
  created_at: string;
  price: number;
  currency: string;
  paid_amount: number;
  payment_status: string;
};

type Column = {
  id: string;
  title: string;
  status: string;
  color: string;
};

const columns: Column[] = [
  { id: '1', title: 'Recibido', status: 'received', color: 'bg-slate-100 border-slate-300' },
  { id: '2', title: 'En Diseño', status: 'in_design', color: 'bg-blue-100 border-blue-300' },
  { id: '3', title: 'En Fabricación', status: 'in_fabrication', color: 'bg-amber-100 border-amber-300' },
  { id: '4', title: 'Control de Calidad', status: 'quality_control', color: 'bg-purple-100 border-purple-300' },
  { id: '5', title: 'Listo para Entrega', status: 'ready_delivery', color: 'bg-green-100 border-green-300' },
  { id: '6', title: 'Entregado', status: 'delivered', color: 'bg-emerald-100 border-emerald-300' },
];

export function KanbanBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();

    const subscription = supabase
      .channel('lab_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_orders' }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadOrders() {
    try {
      const { data, error } = await supabase
        .from('lab_orders')
        .select('*')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('lab_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating order:', error);
    }
  }

  function getOrdersByStatus(status: string) {
    return orders.filter((order) => order.status === status);
  }

  function getDaysUntilDue(dueDate: string | null): number | null {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Panel de Órdenes</h1>
          <p className="text-slate-600 mt-2">Gestión de órdenes en proceso</p>
        </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnOrders = getOrdersByStatus(column.status);

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-80"
            >
              <div className={`rounded-lg border-2 ${column.color} p-4`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-900">{column.title}</h2>
                  <span className="bg-white px-2 py-1 rounded-full text-sm font-medium">
                    {columnOrders.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {columnOrders.map((order) => {
                    const daysUntilDue = getDaysUntilDue(order.due_date);
                    const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                    const isDueSoon = daysUntilDue !== null && daysUntilDue <= 2 && daysUntilDue >= 0;

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-mono text-slate-500">
                            {order.order_number}
                          </span>
                          {isOverdue && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                              Vencido
                            </span>
                          )}
                          {isDueSoon && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                              Urgente
                            </span>
                          )}
                        </div>

                        <h3 className="font-semibold text-slate-900 mb-2">
                          {order.service_name}
                        </h3>

                        <div className="space-y-1 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span>{order.clinic_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>Dr. {order.doctor_name}</span>
                          </div>
                          {order.due_date && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                {new Date(order.due_date).toLocaleDateString('es-GT', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {order.currency === 'GTQ' ? 'Q' : '$'}{order.price.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-1">
                              <Wallet className="w-3 h-3" />
                              <span className={`text-xs font-medium ${
                                order.payment_status === 'paid' ? 'text-green-600' :
                                order.payment_status === 'partial' ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {order.payment_status === 'paid' ? 'Pagado' :
                                 order.payment_status === 'partial' ? 'Parcial' : 'Pendiente'}
                              </span>
                            </div>
                          </div>
                          <select
                            value={order.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-xs border border-slate-300 rounded px-2 py-1"
                          >
                            {columns.map((col) => (
                              <option key={col.status} value={col.status}>
                                {col.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}

                  {columnOrders.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      Sin órdenes
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {selectedOrderId && (
        <OrderDetail
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </>
  );
}
