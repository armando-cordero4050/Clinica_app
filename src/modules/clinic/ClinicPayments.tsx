import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { Loader2, DollarSign, Calendar, CheckCircle, Clock } from 'lucide-react';

type Payment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  payment_date: string | null;
  created_at: string;
  order: {
    order_number: string;
    patient_name: string;
    service_name: string;
  };
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  partial: 'Pago Parcial',
  cancelled: 'Cancelado',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  partial: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function ClinicPayments() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
  });

  useEffect(() => {
    loadPayments();
  }, [profile?.clinic_id]);

  async function loadPayments() {
    if (!profile?.clinic_id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          order:lab_orders!inner(
            order_number,
            patient_name,
            service_name,
            clinic_id
          )
        `)
        .eq('order.clinic_id', profile.clinic_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const paymentsData = (data || []) as unknown as Payment[];
      setPayments(paymentsData);

      const total = paymentsData.reduce((sum, p) => sum + p.amount, 0);
      const paid = paymentsData
        .filter((p) => p.payment_status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      const pending = paymentsData
        .filter((p) => p.payment_status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);

      setStats({ total, paid, pending });
    } catch (error) {
      console.error('Error loading payments:', error);
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Pagos y Facturación</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-slate-600">Total</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            Q {stats.total.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-slate-600">Pagado</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            Q {stats.paid.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="text-sm font-medium text-slate-600">Pendiente</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            Q {stats.pending.toFixed(2)}
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No hay pagos registrados
          </h3>
          <p className="text-slate-600">
            Los pagos aparecerán aquí cuando se procesen órdenes
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">
                  Orden
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">
                  Paciente
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">
                  Servicio
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">
                  Monto
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">
                  Estado
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    #{payment.order.order_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {payment.order.patient_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {payment.order.service_name}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    {payment.currency === 'GTQ' ? 'Q' : '$'}
                    {payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        PAYMENT_STATUS_COLORS[payment.payment_status]
                      }`}
                    >
                      {PAYMENT_STATUS_LABELS[payment.payment_status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {payment.payment_date
                        ? new Date(payment.payment_date).toLocaleDateString('es-GT')
                        : new Date(payment.created_at).toLocaleDateString('es-GT')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
