import { useState } from 'react';
import { Package, DollarSign, Clock, CheckCircle, RefreshCw, TrendingUp, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
        <div className="text-center scale-in">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto"></div>
            <TrendingUp className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-600 mt-4 font-medium">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="glass-card rounded-2xl p-6 border-2 border-red-200 scale-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Error al cargar estadísticas</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="btn-primary"
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
        <p className="text-slate-500 text-center">No hay datos disponibles</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1920px] mx-auto space-y-6 sm:space-y-8">
        <div className="slide-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gradient mb-2">
                Estadísticas y Métricas
              </h2>
              <p className="text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Análisis en tiempo real
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2 glass-card p-1.5 rounded-xl">
                <button
                  onClick={() => setCurrency('GTQ')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                    currency === 'GTQ'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-600 hover:bg-white hover:shadow-md'
                  }`}
                >
                  GTQ
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                    currency === 'USD'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-600 hover:bg-white hover:shadow-md'
                  }`}
                >
                  USD
                </button>
              </div>
              <button
                onClick={() => refetch()}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="fade-in" style={{ animationDelay: '0.1s' }}>
            <MetricCard
              title="Total Órdenes"
              value={stats.totalOrders}
              icon={Package}
              color="blue"
            />
          </div>
          <div className="fade-in" style={{ animationDelay: '0.2s' }}>
            <MetricCard
              title="Revenue Total"
              value={formatCurrency(stats.totalRevenue)}
              icon={DollarSign}
              color="green"
            />
          </div>
          <div className="fade-in" style={{ animationDelay: '0.3s' }}>
            <MetricCard
              title="En Proceso"
              value={stats.pendingOrders}
              icon={Clock}
              color="orange"
            />
          </div>
          <div className="fade-in" style={{ animationDelay: '0.4s' }}>
            <MetricCard
              title="Completadas"
              value={stats.completedOrders}
              icon={CheckCircle}
              color="green"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="fade-in" style={{ animationDelay: '0.5s' }}>
            <BarChart
              title="Órdenes por Estado"
              data={ordersByStatusData}
              valueFormatter={(v) => `${v} órdenes`}
            />
          </div>
          <div className="fade-in" style={{ animationDelay: '0.6s' }}>
            <BarChart
              title={`Revenue por Estado (${currency})`}
              data={revenueByStatusData}
              valueFormatter={formatCurrency}
            />
          </div>
        </div>

        <div className="fade-in" style={{ animationDelay: '0.7s' }}>
          <LineChart
            title={`Revenue Últimos 30 Días (${currency})`}
            data={revenueByDateData}
            valueFormatter={formatCurrency}
            color="#10b981"
          />
        </div>

        {stats.avgTimeByStatus.length > 0 && (
          <div className="glass-card rounded-2xl p-6 sm:p-8 fade-in" style={{ animationDelay: '0.8s' }}>
            <h3 className="text-xl font-bold text-slate-900 mb-6">Tiempo Promedio por Estado</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.avgTimeByStatus.map((item, index) => {
                const hours = Math.floor(item.avg_hours);
                const minutes = Math.round((item.avg_hours - hours) * 60);
                const statusLabels: Record<string, string> = {
                  received: 'Recibido',
                  in_design: 'En Diseño',
                  in_fabrication: 'En Fabricación',
                  quality_control: 'Control de Calidad',
                  ready_delivery: 'Listo',
                  delivered: 'Entregado',
                  pending: 'Pendiente',
                  in_progress: 'En Proceso',
                  in_review: 'En Revisión',
                };

                return (
                  <div
                    key={item.status}
                    className="stat-card scale-in"
                    style={{ animationDelay: `${0.9 + index * 0.1}s` }}
                  >
                    <p className="text-sm font-medium text-slate-600 mb-2">
                      {statusLabels[item.status] || item.status}
                    </p>
                    <p className="text-3xl font-bold text-gradient">
                      {hours > 0 ? `${hours}h` : ''} {minutes}m
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="fade-in" style={{ animationDelay: '1s' }}>
          <CriticalSLATable orders={stats.criticalSLAOrders} />
        </div>
      </div>
    </div>
  );
}
