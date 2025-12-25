import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'red';
}

const colorClasses = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    shadow: 'shadow-blue-500/30',
  },
  green: {
    bg: 'from-green-500 to-emerald-600',
    shadow: 'shadow-green-500/30',
  },
  orange: {
    bg: 'from-orange-500 to-amber-600',
    shadow: 'shadow-orange-500/30',
  },
  red: {
    bg: 'from-red-500 to-rose-600',
    shadow: 'shadow-red-500/30',
  },
};

export function MetricCard({ title, value, icon: Icon, trend, color = 'blue' }: MetricCardProps) {
  const colors = colorClasses[color];

  return (
    <div className="stat-card group">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-2xl flex items-center justify-center shadow-lg ${colors.shadow} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <span className="text-sm font-bold">
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
      <p className="text-4xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
