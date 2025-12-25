import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Clock, Package, User, Wallet, AlertCircle, TrendingUp, Settings } from 'lucide-react';
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
  current_step_entered_at: string;
};

type WorkflowStep = {
  id: string;
  step_key: string;
  step_name: string;
  sla_hours: number;
  display_order: number;
  color_class: string;
  icon: string;
  active: boolean;
};

export function KanbanBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showSLAConfig, setShowSLAConfig] = useState(false);

  useEffect(() => {
    loadData();

    const ordersSubscription = supabase
      .channel('lab_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_orders' }, () => {
        loadOrders();
      })
      .subscribe();

    const stepsSubscription = supabase
      .channel('workflow_steps_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workflow_steps' }, () => {
        loadWorkflowSteps();
      })
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      stepsSubscription.unsubscribe();
    };
  }, []);

  async function loadData() {
    await Promise.all([loadOrders(), loadWorkflowSteps()]);
    setLoading(false);
  }

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
    }
  }

  async function loadWorkflowSteps() {
    try {
      const { data, error } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (error) throw error;
      setWorkflowSteps(data || []);
    } catch (error) {
      console.error('Error loading workflow steps:', error);
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

  function getHoursInCurrentStep(stepEnteredAt: string): number {
    const entered = new Date(stepEnteredAt);
    const now = new Date();
    const diffTime = now.getTime() - entered.getTime();
    return diffTime / (1000 * 60 * 60);
  }

  function getSLAStatus(order: Order, slaHours: number): 'ok' | 'warning' | 'critical' | 'overdue' {
    const hoursInStep = getHoursInCurrentStep(order.current_step_entered_at);
    const percentComplete = (hoursInStep / slaHours) * 100;

    if (hoursInStep > slaHours) return 'overdue';
    if (percentComplete >= 90) return 'critical';
    if (percentComplete >= 75) return 'warning';
    return 'ok';
  }

  function getSLAProgressColor(status: 'ok' | 'warning' | 'critical' | 'overdue'): string {
    switch (status) {
      case 'overdue': return 'bg-red-500';
      case 'critical': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <div className="text-center scale-in">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto"></div>
            <Package className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-600 mt-4 font-medium">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  if (workflowSteps.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No hay pasos configurados</h2>
          <p className="text-slate-600">Configure los pasos del flujo de trabajo en la configuración.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8 slide-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gradient mb-2">
                  Panel de Órdenes
                </h1>
                <p className="text-slate-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Gestión de órdenes en tiempo real
                </p>
              </div>
              <button
                onClick={() => setShowSLAConfig(!showSLAConfig)}
                className="btn-secondary flex items-center gap-2 self-start sm:self-auto"
              >
                <Settings className="w-4 h-4" />
                Configurar SLA
              </button>
            </div>

            {showSLAConfig && (
              <div className="mt-6 glass-card rounded-2xl p-6 scale-in">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Configuración de SLA por Paso</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workflowSteps.map((step) => (
                    <div key={step.id} className="bg-white rounded-xl p-4 border-2 border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-2">{step.step_name}</h4>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-2xl font-bold text-blue-600">{step.sla_hours}</span>
                        <span className="text-sm text-slate-600">horas</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 scrollbar-thin">
            {workflowSteps.map((step, index) => {
              const columnOrders = getOrdersByStatus(step.step_key);
              const overdueCount = columnOrders.filter(
                order => getSLAStatus(order, step.sla_hours) === 'overdue'
              ).length;

              return (
                <div
                  key={step.id}
                  className="flex-shrink-0 w-80 sm:w-96 fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="kanban-column p-4 sm:p-6 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${step.color_class.split(' ')[0]} flex items-center justify-center shadow-md`}>
                          <Package className="w-5 h-5 text-slate-700" />
                        </div>
                        <div>
                          <h2 className="font-bold text-slate-900 text-lg">{step.step_name}</h2>
                          <div className="flex items-center gap-1 text-xs text-slate-600">
                            <Clock className="w-3 h-3" />
                            <span>SLA: {step.sla_hours}h</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-slate-900 shadow-sm">
                          {columnOrders.length}
                        </span>
                        {overdueCount > 0 && (
                          <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold pulse-badge">
                            {overdueCount} vencida{overdueCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin pr-2">
                      {columnOrders.map((order, orderIndex) => {
                        const slaStatus = getSLAStatus(order, step.sla_hours);
                        const hoursInStep = getHoursInCurrentStep(order.current_step_entered_at);
                        const percentComplete = Math.min((hoursInStep / step.sla_hours) * 100, 100);

                        return (
                          <div
                            key={order.id}
                            className="kanban-card p-4 scale-in"
                            style={{ animationDelay: `${orderIndex * 0.05}s` }}
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                #{order.order_number}
                              </span>
                              {slaStatus === 'overdue' && (
                                <div className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold pulse-badge">
                                  <AlertCircle className="w-3 h-3" />
                                  Vencido
                                </div>
                              )}
                              {slaStatus === 'critical' && (
                                <div className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">
                                  <Clock className="w-3 h-3" />
                                  Crítico
                                </div>
                              )}
                              {slaStatus === 'warning' && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                                  Urgente
                                </span>
                              )}
                            </div>

                            <h3 className="font-bold text-slate-900 mb-3 text-base leading-tight">
                              {order.service_name}
                            </h3>

                            <div className="space-y-2 text-sm text-slate-600 mb-3">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-blue-500" />
                                <span className="truncate">{order.clinic_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-green-500" />
                                <span className="truncate">Dr. {order.doctor_name}</span>
                              </div>
                            </div>

                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                                <span className="font-medium">Tiempo en paso</span>
                                <span className="font-mono">
                                  {Math.floor(hoursInStep)}h / {step.sla_hours}h
                                </span>
                              </div>
                              <div className="progress-bar h-2">
                                <div
                                  className={`h-full ${getSLAProgressColor(slaStatus)} transition-all duration-500 rounded-full`}
                                  style={{ width: `${percentComplete}%` }}
                                />
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-base font-bold text-slate-900">
                                  {order.currency === 'GTQ' ? 'Q' : '$'}{order.price.toFixed(2)}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Wallet className="w-3.5 h-3.5" />
                                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                    order.payment_status === 'paid'
                                      ? 'bg-green-100 text-green-700'
                                      : order.payment_status === 'partial'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
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
                                className="w-full text-sm border-2 border-slate-200 rounded-lg px-3 py-2 font-medium hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              >
                                {workflowSteps.map((ws) => (
                                  <option key={ws.step_key} value={ws.step_key}>
                                    {ws.step_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}

                      {columnOrders.length === 0 && (
                        <div className="text-center py-12 fade-in">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Package className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-slate-400 text-sm font-medium">Sin órdenes</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
