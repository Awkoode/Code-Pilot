import { useEffect, useState } from 'react';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: ChartData[];
  height?: number;
  showValues?: boolean;
  animated?: boolean;
}

export function BarChart({ data, height = 200, showValues = true, animated = true }: BarChartProps) {
  const [animatedData, setAnimatedData] = useState(
    animated ? data.map((d) => ({ ...d, value: 0 })) : data,
  );

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setAnimatedData(data), 100);
      return () => clearTimeout(timer);
    }
  }, [data, animated]);

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full">
      <div className="flex items-end gap-2" style={{ height }}>
        {animatedData.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          return (
            <div
              key={index}
              className="flex flex-1 flex-col items-center justify-end"
              title={`${item.label}: ${item.value}`}
            >
              {showValues && (
                <span className="mb-1 font-mono text-xs text-slate-300">
                  {Math.round(item.value)}
                </span>
              )}
              <div
                className={`w-full rounded-t transition-all duration-1000 ease-out ${
                  item.color || 'bg-primary'
                }`}
                style={{ height: `${barHeight}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex-1 text-center">
            <span className="truncate text-xs text-slate-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LineChartProps {
  data: ChartData[];
  height?: number;
  showValues?: boolean;
  animated?: boolean;
}

export function LineChart({ data, height = 200, showValues: _showValues = true, animated = true }: LineChartProps) {
  const [progress, setProgress] = useState(animated ? 0 : 1);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setProgress(1), 100);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = height - 40;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: chartHeight - (d.value / maxValue) * chartHeight,
  }));

  const pathD = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cpx1 = prev.x + (p.x - prev.x) / 3;
      const cpx2 = prev.x + (2 * (p.x - prev.x)) / 3;
      return `C ${cpx1} ${prev.y}, ${cpx2} ${p.y}, ${p.x} ${p.y}`;
    })
    .join(' ');

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 100 ${chartHeight}`}
        className="w-full"
        style={{ height: chartHeight }}
        preserveAspectRatio="none"
      >
        <path
          d={pathD}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={progress}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: 1 - progress,
            transition: 'stroke-dashoffset 1s ease-out',
          }}
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2"
            fill="var(--accent-primary)"
            className="transition-all duration-300"
            style={{ opacity: progress }}
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between">
        {data.map((d, i) => (
          <span key={i} className="text-xs text-slate-500">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

interface DonutChartProps {
  data: ChartData[];
  size?: number;
  thickness?: number;
  showLegend?: boolean;
  animated?: boolean;
}

export function DonutChart({ data, size = 200, thickness = 30, showLegend = true, animated = true }: DonutChartProps) {
  const [progress, setProgress] = useState(animated ? 0 : 1);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setProgress(1), 100);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let currentOffset = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={thickness}
        />
        {data.map((d, i) => {
          const fraction = d.value / total;
          const dashLength = fraction * circumference;
          const offset = currentOffset;
          currentOffset += dashLength;

          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={d.color || 'var(--accent-primary)'}
              strokeWidth={thickness}
              strokeDasharray={`${dashLength * progress} ${circumference}`}
              strokeDashoffset={-offset}
              className="transition-all duration-1000 ease-out"
            />
          );
        })}
      </svg>
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-4">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: d.color || 'var(--accent-primary)' }}
              />
              <span className="text-sm text-slate-300">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
