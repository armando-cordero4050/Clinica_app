import { AlertTriangle, Clock } from 'lucide-react';
import { CriticalSLAOrder } from './useDashboardStats';

interface CriticalSLATableProps {
  orders: CriticalSLAOrder[];
  onOrderClick?: (orderId: string) => void;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En Proceso',
  in_review: 'En Revisión',
  ready_delivery: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  in_review: 'bg-purple-100 text-purple-800',
  ready_delivery: 'bg-green-100 text-green-800',
  delivered: 'bg-cyan-100 text-cyan-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function CriticalSLATable({ orders, onOrderClick }: CriticalSLATableProps) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Órdenes con SLA Crítico</h3>
        </div>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
            <Clock className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-gray-600">No hay órdenes con SLA crítico</p>
          <p className="text-sm text-gray-500 mt-1">Todas las órdenes están en tiempo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Órdenes con SLA Crítico ({orders.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orden
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clínica
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tiempo Restante
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => {
              const isOverdue = order.hours_remaining < 0;
              const isCritical = order.hours_remaining < 12 && !isOverdue;

              return (
                <tr
                  key={order.id}
                  onClick={() => onOrderClick?.(order.id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {isOverdue && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      <span className="text-sm font-medium text-gray-900">{order.order_number}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {order.clinic_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {order.patient_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusColors[order.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`text-sm font-medium ${
                        isOverdue
                          ? 'text-red-600'
                          : isCritical
                          ? 'text-orange-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {isOverdue
                        ? `Vencido (${Math.abs(order.hours_remaining)}h)`
                        : `${order.hours_remaining}h restantes`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
