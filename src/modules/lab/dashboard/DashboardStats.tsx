import { useState } from 'react';
import { Package, DollarSign, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { useDashboardStats } from './useDashboardStats';
import { MetricCard } from './MetricCard';
import { BarChart } from './BarChart';
import { LineChart } from './LineChart';
import { CriticalSLATable } from './CriticalSLATable';

export function DashboardStats() {
  const [currency, setCurrency] = useState<'GTQ' | 'USD'>('GTQ');
  const { stats, loading, error, refetch } = useDashboardStats(currency);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error al cargar estadísticas: {error}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-gray-500 text-center">No hay datos disponibles</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return `${currency} ${value.toLocaleString('es-GT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const ordersByStatusData = stats.ordersByStatus.map((item) => ({
    label: item.status,
    value: item.count,
  }));

  const revenueByStatusData = stats.ordersByStatus.map((item) => ({
    label: item.status,
    value: item.total_revenue,
  }));

  const revenueByDateData = stats.revenueByDate.map((item) => ({
    label: item.date,
    value: item.revenue,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Estadísticas y Métricas</h2>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setCurrency('GTQ')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                currency === 'GTQ'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              GTQ
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                currency === 'USD'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              USD
            </button>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Órdenes"
          value={stats.totalOrders}
          icon={Package}
          color="blue"
        />
        <MetricCard
          title="Revenue Total"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="En Proceso"
          value={stats.pendingOrders}
          icon={Clock}
          color="orange"
        />
        <MetricCard
          title="Completadas"
          value={stats.completedOrders}
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Órdenes por Estado"
          data={ordersByStatusData}
          valueFormatter={(v) => `${v} órdenes`}
        />
        <BarChart
          title={`Revenue por Estado (${currency})`}
          data={revenueByStatusData}
          valueFormatter={formatCurrency}
        />
      </div>

      <LineChart
        title={`Revenue Últimos 30 Días (${currency})`}
        data={revenueByDateData}
        valueFormatter={formatCurrency}
        color="#10b981"
      />

      {stats.avgTimeByStatus.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiempo Promedio por Estado</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.avgTimeByStatus.map((item) => {
              const hours = Math.floor(item.avg_hours);
              const minutes = Math.round((item.avg_hours - hours) * 60);
              const statusLabels: Record<string, string> = {
                pending: 'Pendiente',
                in_progress: 'En Proceso',
                in_review: 'En Revisión',
                ready_delivery: 'Listo',
              };

              return (
                <div key={item.status} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    {statusLabels[item.status] || item.status}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {hours > 0 ? `${hours}h` : ''} {minutes}m
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CriticalSLATable orders={stats.criticalSLAOrders} />
    </div>
  );
}
