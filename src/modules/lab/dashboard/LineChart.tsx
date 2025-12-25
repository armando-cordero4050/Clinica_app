interface LineChartProps {
  data: Array<{
    label: string;
    value: number;
  }>;
  title: string;
  valueFormatter?: (value: number) => string;
  color?: string;
}

export function LineChart({
  data,
  title,
  valueFormatter = (v) => v.toString(),
  color = '#3b82f6',
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;

  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((item, index) => {
    const x = padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - ((item.value - minValue) / range) * chartHeight;
    return { x, y, value: item.value };
  });

  const pathD = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `L ${point.x} ${point.y}`;
    })
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${
    padding.top + chartHeight
  } L ${padding.left} ${padding.top + chartHeight} Z`;

  const showEveryNth = Math.ceil(data.length / 7);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="w-full">
          <defs>
            <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <path d={areaD} fill="url(#lineGradient)" />

          <path d={pathD} fill="none" stroke={color} strokeWidth="2" />

          {points.map((point, index) => (
            <circle key={index} cx={point.x} cy={point.y} r="4" fill={color} className="hover:r-6 transition-all" />
          ))}

          {data.map((item, index) => {
            if (index % showEveryNth !== 0 && index !== data.length - 1) return null;
            const point = points[index];
            const date = new Date(item.label);
            const label = `${date.getDate()}/${date.getMonth() + 1}`;

            return (
              <g key={index}>
                <text
                  x={point.x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6b7280"
                >
                  {label}
                </text>
              </g>
            );
          })}

          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={width - padding.right}
            y2={padding.top + chartHeight}
            stroke="#e5e7eb"
            strokeWidth="1"
          />

          {[0, 0.25, 0.5, 0.75, 1].map((percent) => {
            const y = padding.top + chartHeight - percent * chartHeight;
            const value = minValue + percent * range;
            return (
              <g key={percent}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
                <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#9ca3af">
                  {valueFormatter(value)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
