import { useEffect, useState } from 'react';
import { Trash2, Banknote, CreditCard, DollarSign, Receipt } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  recorded_by: string;
  profiles?: {
    full_name: string;
  };
}

interface PaymentListProps {
  orderId: string;
  onPaymentDeleted?: () => void;
}

const PAYMENT_METHOD_ICONS = {
  cash: Banknote,
  card: CreditCard,
  transfer: DollarSign,
  check: Receipt,
};

const PAYMENT_METHOD_LABELS = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  check: 'Cheque',
};

export function PaymentList({ orderId, onPaymentDeleted }: PaymentListProps) {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, [orderId]);

  async function loadPayments() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          profiles:recorded_by (
            full_name
          )
        `)
        .eq('order_id', orderId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deletePayment(paymentId: string) {
    if (!confirm('¿Estás seguro de eliminar este pago?')) return;

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      await loadPayments();
      if (onPaymentDeleted) onPaymentDeleted();
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Error al eliminar el pago');
    }
  }

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-500">
        Cargando pagos...
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No hay pagos registrados
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => {
        const Icon = PAYMENT_METHOD_ICONS[payment.payment_method as keyof typeof PAYMENT_METHOD_ICONS] || DollarSign;
        const methodLabel = PAYMENT_METHOD_LABELS[payment.payment_method as keyof typeof PAYMENT_METHOD_LABELS] || payment.payment_method;

        return (
          <div
            key={payment.id}
            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Icon className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {payment.currency} {payment.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {methodLabel}
                    </p>
                  </div>
                </div>

                <div className="ml-11 space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Fecha:</span>{' '}
                    {new Date(payment.payment_date).toLocaleDateString('es-GT', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>

                  {payment.reference_number && (
                    <p className="text-gray-600">
                      <span className="font-medium">Referencia:</span> {payment.reference_number}
                    </p>
                  )}

                  {payment.notes && (
                    <p className="text-gray-600">
                      <span className="font-medium">Notas:</span> {payment.notes}
                    </p>
                  )}

                  <p className="text-xs text-gray-500">
                    Registrado por{' '}
                    {payment.profiles?.full_name || 'Usuario'} el{' '}
                    {new Date(payment.created_at).toLocaleDateString('es-GT')}
                  </p>
                </div>
              </div>

              {profile?.global_role === 'lab_admin' && (
                <button
                  onClick={() => deletePayment(payment.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar pago"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
