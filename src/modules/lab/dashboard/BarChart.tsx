interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  title: string;
  valueFormatter?: (value: number) => string;
}

const statusColors: Record<string, string> = {
  received: '#64748b',
  in_design: '#3b82f6',
  in_fabrication: '#f59e0b',
  quality_control: '#8b5cf6',
  ready_delivery: '#10b981',
  delivered: '#06b6d4',
  cancelled: '#ef4444',
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  in_review: '#8b5cf6',
};

const statusLabels: Record<string, string> = {
  received: 'Recibido',
  in_design: 'En Diseño',
  in_fabrication: 'En Fabricación',
  quality_control: 'Control de Calidad',
  ready_delivery: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  pending: 'Pendiente',
  in_progress: 'En Proceso',
  in_review: 'En Revisión',
};

export function BarChart({ data, title, valueFormatter = (v) => v.toString() }: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
        <p className="text-slate-500 text-center py-8">No hay datos disponibles</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 group hover:shadow-2xl transition-shadow duration-300">
      <h3 className="text-xl font-bold text-slate-900 mb-6">{title}</h3>
      <div className="space-y-5">
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          const color = item.color || statusColors[item.label] || '#3b82f6';
          const label = statusLabels[item.label] || item.label;

          return (
            <div key={index} className="scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                <span className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                  {valueFormatter(item.value)}
                </span>
              </div>
              <div className="relative w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out shadow-md"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
