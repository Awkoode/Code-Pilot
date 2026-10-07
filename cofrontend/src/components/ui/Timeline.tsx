import type { ReactNode } from 'react';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  icon?: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const colors = {
  primary: 'bg-primary',
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  danger: 'bg-red-400',
  info: 'bg-cyan-400',
};

export function Timeline({ items, className = '' }: TimelineProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-6">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="relative flex gap-4 animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div
              className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${colors[item.color || 'primary']}`}
            >
              {item.icon || (
                <div className="h-2 w-2 rounded-full bg-white" />
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-medium text-white">{item.title}</h4>
                {item.timestamp && (
                  <span className="text-xs text-slate-500">{item.timestamp}</span>
                )}
              </div>
              {item.description && (
                <p className="mt-1 text-sm text-slate-400">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
