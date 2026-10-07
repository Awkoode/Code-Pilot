import { useEffect, useState } from 'react';
import { scoreTone } from './Badge';

interface ScoreBarProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showValue?: boolean;
}

const fills = {
  red: 'bg-gradient-to-r from-red-500 to-red-400',
  yellow: 'bg-gradient-to-r from-yellow-500 to-yellow-400',
  green: 'bg-gradient-to-r from-green-500 to-green-400',
};

const texts = {
  red: 'text-red-400',
  yellow: 'text-yellow-400',
  green: 'text-green-400',
};

const sizes = {
  sm: { bar: 'h-1.5', text: 'text-xs', value: 'text-xs' },
  md: { bar: 'h-2.5', text: 'text-sm', value: 'text-sm' },
  lg: { bar: 'h-4', text: 'text-base', value: 'text-2xl' },
};

export function ScoreBar({ score, label, size = 'md', animated = true, showValue = true }: ScoreBarProps) {
  const [width, setWidth] = useState(animated ? 0 : score);
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const tone = scoreTone(value);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setWidth(value), 100);
      return () => clearTimeout(timer);
    }
  }, [value, animated]);

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className={`font-medium text-slate-300 ${sizes[size].text}`}>{label}</span>
        {showValue && (
          <span className={`font-mono font-semibold ${texts[tone]} ${sizes[size].value}`}>
            {value}
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`w-full overflow-hidden rounded-full bg-border/50 ${sizes[size].bar}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${fills[tone]}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
