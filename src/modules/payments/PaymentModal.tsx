import { useState } from 'react';
import { X, DollarSign, CreditCard, Banknote, Receipt, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';

interface PaymentModalProps {
  orderId: string;
  orderPrice: number;
  orderCurrency: 'GTQ' | 'USD';
  paidAmount: number;
  onClose: () => void;
  onPaymentAdded: () => void;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo', icon: Banknote },
  { value: 'card', label: 'Tarjeta', icon: CreditCard },
  { value: 'transfer', label: 'Transferencia', icon: DollarSign },
  { value: 'check', label: 'Cheque', icon: Receipt },
];

export function PaymentModal({
  orderId,
  orderPrice,
  orderCurrency,
  paidAmount,
  onClose,
  onPaymentAdded,
}: PaymentModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
  });

  const remainingAmount = orderPrice - paidAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);

      if (amount <= 0) {
        alert('El monto debe ser mayor a 0');
        return;
      }

      if (amount > remainingAmount) {
        const confirm = window.confirm(
          `El monto (${amount} ${orderCurrency}) es mayor al saldo pendiente (${remainingAmount.toFixed(2)} ${orderCurrency}). ¿Deseas continuar?`
        );
        if (!confirm) return;
      }

      const { error } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          amount,
          currency: orderCurrency,
          payment_method: formData.payment_method,
          payment_date: formData.payment_date,
          reference_number: formData.reference_number || null,
          notes: formData.notes || null,
          recorded_by: profile?.id,
        });

      if (error) throw error;

      onPaymentAdded();
      onClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Registrar Pago</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total</p>
              <p className="font-semibold text-gray-900">
                {orderCurrency} {orderPrice.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Pagado</p>
              <p className="font-semibold text-green-600">
                {orderCurrency} {paidAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Pendiente</p>
              <p className="font-semibold text-red-600">
                {orderCurrency} {remainingAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto del Pago * ({orderCurrency})
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
            {formData.amount && parseFloat(formData.amount) > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Saldo después de este pago:{' '}
                {orderCurrency}{' '}
                {(remainingAmount - parseFloat(formData.amount)).toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: method.value })}
                    className={`flex items-center gap-2 px-4 py-3 border-2 rounded-lg transition-all ${
                      formData.payment_method === method.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Pago *
            </label>
            <input
              type="date"
              required
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Referencia
            </label>
            <input
              type="text"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Número de cheque, transacción, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Notas adicionales sobre el pago..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar Pago'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
