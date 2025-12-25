import { useState, useEffect } from 'react';
import { X, User, Building2, Calendar, FileText, MessageSquare, Paperclip, Wallet, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { OrderHistory } from './OrderHistory';
import { OrderNotes } from './OrderNotes';
import { FileGallery } from '../shared/components/FileGallery';
import { PaymentModal } from '../payments/PaymentModal';
import { PaymentList } from '../payments/PaymentList';
import { useAuth } from '../auth/AuthContext';

interface OrderDetailProps {
  orderId: string;
  onClose: () => void;
}

interface OrderDetails {
  id: string;
  order_number: string;
  clinic_name: string;
  doctor_name: string;
  doctor_email: string;
  patient_name: string;
  patient_age: number | null;
  patient_gender: string | null;
  service_name: string;
  price: number;
  currency: string;
  paid_amount: number;
  payment_status: string;
  payment_due_date: string | null;
  diagnosis: string | null;
  doctor_notes: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

interface ToothSelection {
  tooth_number: string;
  condition_type: string;
  notes: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  received: 'Recibido',
  in_design: 'En Diseño',
  in_fabrication: 'En Fabricación',
  quality_control: 'Control de Calidad',
  ready_delivery: 'Listo para Entrega',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const CONDITION_LABELS: Record<string, string> = {
  caries: 'Caries',
  restoration: 'Restauración',
  crown: 'Corona',
  implant: 'Implante',
  prosthesis: 'Prótesis',
  missing: 'Faltante',
  endodontics: 'Endodoncia',
  orthodontics: 'Ortodoncia',
  surgery: 'Cirugía',
};

export function OrderDetail({ orderId, onClose }: OrderDetailProps) {
  const { profile } = useAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [teeth, setTeeth] = useState<ToothSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'notes' | 'files' | 'payments'>('details');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  async function loadOrderDetails() {
    try {
      setLoading(true);

      const [orderResult, teethResult] = await Promise.all([
        supabase
          .from('lab_orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle(),
        supabase
          .from('odontogram_selections')
          .select('*')
          .eq('order_id', orderId),
      ]);

      if (orderResult.error) throw orderResult.error;
      if (teethResult.error) throw teethResult.error;

      setOrder(orderResult.data);
      setTeeth(teethResult.data || []);
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <p className="text-red-600 mb-4">No se pudo cargar la orden</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{order.order_number}</h2>
            <p className="text-sm text-gray-500 mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {STATUS_LABELS[order.status]}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Detalles
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Historial
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'notes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Notas
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'files'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Paperclip className="w-4 h-4 inline mr-2" />
              Archivos
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Wallet className="w-4 h-4 inline mr-2" />
              Pagos
            </button>
          </nav>
        </div>

        <div className="p-6 max-h-[calc(100vh-250px)] overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center">
                      <Building2 className="w-4 h-4 mr-2" />
                      Clínica y Doctor
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Clínica</p>
                        <p className="font-medium text-gray-900">{order.clinic_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Doctor</p>
                        <p className="font-medium text-gray-900">{order.doctor_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm text-gray-700">{order.doctor_email}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Paciente
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Nombre</p>
                        <p className="font-medium text-gray-900">{order.patient_name}</p>
                      </div>
                      {order.patient_age && (
                        <div>
                          <p className="text-xs text-gray-500">Edad</p>
                          <p className="text-sm text-gray-700">{order.patient_age} años</p>
                        </div>
                      )}
                      {order.patient_gender && (
                        <div>
                          <p className="text-xs text-gray-500">Género</p>
                          <p className="text-sm text-gray-700">
                            {order.patient_gender === 'M' ? 'Masculino' : order.patient_gender === 'F' ? 'Femenino' : 'Otro'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Servicio y Pago
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Descripción</p>
                        <p className="font-medium text-gray-900">{order.service_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Precio Total</p>
                        <p className="text-lg font-bold text-gray-900">
                          {order.currency} {order.price.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">Pagado</p>
                        <p className="text-sm font-semibold text-green-600">
                          {order.currency} {(order.paid_amount || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Saldo Pendiente</p>
                        <p className="text-sm font-semibold text-red-600">
                          {order.currency} {(order.price - (order.paid_amount || 0)).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Estado de Pago</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                          order.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.payment_status === 'paid' ? 'Pagado' :
                           order.payment_status === 'partial' ? 'Parcial' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Fechas
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Recibido</p>
                        <p className="text-sm text-gray-700">{formatDateTime(order.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fecha de Entrega</p>
                        <p className="text-sm text-gray-700">{formatDate(order.due_date)}</p>
                      </div>
                      {order.completed_at && (
                        <div>
                          <p className="text-xs text-gray-500">Completado</p>
                          <p className="text-sm text-gray-700">{formatDateTime(order.completed_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {teeth.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                    Dientes Seleccionados
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2">
                      {teeth.map((tooth) => (
                        <div
                          key={tooth.tooth_number}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white border border-gray-300"
                        >
                          <span className="font-medium">{tooth.tooth_number}</span>
                          <span className="mx-1 text-gray-400">•</span>
                          <span className="text-gray-600">{CONDITION_LABELS[tooth.condition_type] || tooth.condition_type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {order.diagnosis && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                    Diagnóstico
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{order.diagnosis}</p>
                  </div>
                </div>
              )}

              {order.doctor_notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                    Notas del Doctor
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{order.doctor_notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && <OrderHistory orderId={orderId} />}

          {activeTab === 'notes' && <OrderNotes orderId={orderId} />}

          {activeTab === 'files' && (
            <FileGallery
              orderId={orderId}
              canDelete={profile?.global_role === 'lab_admin' || profile?.global_role === 'lab_staff'}
            />
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Historial de Pagos</h3>
                {(profile?.global_role === 'lab_admin' || profile?.global_role === 'lab_staff') && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Registrar Pago
                  </button>
                )}
              </div>

              <PaymentList
                orderId={orderId}
                onPaymentDeleted={loadOrderDetails}
              />
            </div>
          )}
        </div>

        {showPaymentModal && order && (
          <PaymentModal
            orderId={orderId}
            orderPrice={order.price}
            orderCurrency={order.currency as 'GTQ' | 'USD'}
            paidAmount={order.paid_amount || 0}
            onClose={() => setShowPaymentModal(false)}
            onPaymentAdded={() => {
              loadOrderDetails();
              setShowPaymentModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
