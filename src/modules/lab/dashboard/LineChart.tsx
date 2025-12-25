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
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
        <p className="text-slate-500 text-center py-8">No hay datos disponibles</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;

  const width = 800;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 50, left: 70 };
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
      const prevPoint = points[index - 1];
      const cpX1 = prevPoint.x + (point.x - prevPoint.x) / 3;
      const cpX2 = prevPoint.x + (2 * (point.x - prevPoint.x)) / 3;
      return `C ${cpX1} ${prevPoint.y}, ${cpX2} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${
    padding.top + chartHeight
  } L ${padding.left} ${padding.top + chartHeight} Z`;

  const showEveryNth = Math.ceil(data.length / 10);

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 group hover:shadow-2xl transition-shadow duration-300">
      <h3 className="text-xl font-bold text-slate-900 mb-6">{title}</h3>
      <div className="overflow-x-auto scrollbar-thin">
        <svg width={width} height={height} className="w-full min-w-[600px]">
          <defs>
            <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
            </filter>
          </defs>

          <path d={areaD} fill="url(#lineGradient)" className="fade-in" />

          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#shadow)"
            className="fade-in"
            style={{ animationDelay: '0.2s' }}
          />

          {points.map((point, index) => (
            <g key={index} className="scale-in" style={{ animationDelay: `${0.3 + index * 0.02}s` }}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="white"
                stroke={color}
                strokeWidth="3"
                className="hover:r-8 transition-all cursor-pointer"
              >
                <title>{valueFormatter(point.value)}</title>
              </circle>
            </g>
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
                  y={height - 15}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="500"
                  fill="#64748b"
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
            stroke="#cbd5e1"
            strokeWidth="2"
          />

          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke="#cbd5e1"
            strokeWidth="2"
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
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 15}
                  y={y + 5}
                  textAnchor="end"
                  fontSize="12"
                  fontWeight="500"
                  fill="#64748b"
                >
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
