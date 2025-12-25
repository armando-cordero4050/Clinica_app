import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, CreditCard, Calendar, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PaymentStats {
  totalPaid: number;
  totalPending: number;
  paymentsCount: number;
  avgPayment: number;
}

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  lab_orders: {
    order_number: string;
    clinic_name: string;
  };
  profiles: {
    full_name: string;
  };
}

export function PaymentsReport() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PaymentStats>({
    totalPaid: 0,
    totalPending: 0,
    paymentsCount: 0,
    avgPayment: 0,
  });
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [currency, setCurrency] = useState<'GTQ' | 'USD'>('GTQ');

  useEffect(() => {
    loadData();
  }, [dateRange, currency]);

  async function loadData() {
    try {
      setLoading(true);

      const [paymentsResult, ordersResult] = await Promise.all([
        supabase
          .from('payments')
          .select(`
            *,
            lab_orders (order_number, clinic_name),
            profiles (full_name)
          `)
          .eq('currency', currency)
          .gte('payment_date', dateRange.from)
          .lte('payment_date', dateRange.to)
          .order('payment_date', { ascending: false }),

        supabase
          .from('lab_orders')
          .select('price, paid_amount, currency')
          .eq('currency', currency),
      ]);

      if (paymentsResult.error) throw paymentsResult.error;
      if (ordersResult.error) throw ordersResult.error;

      const paymentsData = paymentsResult.data || [];
      const ordersData = ordersResult.data || [];

      const totalPaid = paymentsData.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalPending = ordersData.reduce(
        (sum, o) => sum + (Number(o.price) - Number(o.paid_amount || 0)),
        0
      );

      setStats({
        totalPaid,
        totalPending,
        paymentsCount: paymentsData.length,
        avgPayment: paymentsData.length > 0 ? totalPaid / paymentsData.length : 0,
      });

      setPayments(paymentsData as PaymentRecord[]);
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    const headers = ['Fecha', 'Orden', 'Clínica', 'Monto', 'Método', 'Referencia', 'Registrado por'];
    const rows = payments.map(p => [
      p.payment_date,
      p.lab_orders?.order_number || 'N/A',
      p.lab_orders?.clinic_name || 'N/A',
      `${p.currency} ${p.amount}`,
      p.payment_method,
      p.reference_number || '',
      p.profiles?.full_name || 'N/A',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagos_${dateRange.from}_${dateRange.to}.csv`;
    a.click();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reporte de Pagos</h2>
          <p className="text-sm text-gray-500 mt-1">
            Estadísticas y listado de pagos recibidos
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Desde
          </label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hasta
          </label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            max={new Date().toISOString().split('T')[0]}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Moneda
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'GTQ' | 'USD')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="GTQ">Quetzales (GTQ)</option>
            <option value="USD">Dólares (USD)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Recibido</h3>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {currency} {stats.totalPaid.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Pendiente</h3>
            <TrendingUp className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {currency} {stats.totalPending.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Pagos Registrados</h3>
            <CreditCard className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.paymentsCount}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Promedio por Pago</h3>
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {currency} {stats.avgPayment.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detalle de Pagos</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clínica
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registrado por
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No hay pagos en este período
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.payment_date).toLocaleDateString('es-GT')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.lab_orders?.order_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.lab_orders?.clinic_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.payment_method === 'cash' ? 'Efectivo' :
                       payment.payment_method === 'card' ? 'Tarjeta' :
                       payment.payment_method === 'transfer' ? 'Transferencia' : 'Cheque'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {payment.currency} {Number(payment.amount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.reference_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.profiles?.full_name || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
