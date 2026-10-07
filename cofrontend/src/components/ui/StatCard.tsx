import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const colors = {
  primary: 'text-primary',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  danger: 'text-red-400',
  info: 'text-cyan-400',
};

export function StatCard({ label, value, icon, trend, color = 'primary' }: StatCardProps) {
  return (
    <Card hover className="group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${colors[color]}`}>{value}</p>
          {trend && (
            <p className={`mt-1 text-xs ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={`rounded-lg bg-surface p-2 ${colors[color]} transition-transform duration-300 group-hover:scale-110`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
