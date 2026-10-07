import { useEffect, useState } from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  animated?: boolean;
}

const colors = {
  primary: 'bg-gradient-to-r from-primary to-purple-500',
  success: 'bg-gradient-to-r from-green-500 to-green-400',
  warning: 'bg-gradient-to-r from-yellow-500 to-yellow-400',
  danger: 'bg-gradient-to-r from-red-500 to-red-400',
};

const sizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  size = 'md',
  color = 'primary',
  animated = true,
}: ProgressBarProps) {
  const [width, setWidth] = useState(animated ? 0 : (value / max) * 100);
  const percentage = Math.round((value / max) * 100);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setWidth(percentage), 100);
      return () => clearTimeout(timer);
    }
  }, [percentage, animated]);

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          {label && <span className="text-slate-300">{label}</span>}
          {showValue && <span className="font-mono text-slate-400">{percentage}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={`w-full overflow-hidden rounded-full bg-border/50 ${sizes[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${colors[color]}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
