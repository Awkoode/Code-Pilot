import type { ReactNode } from 'react';

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function Section({ title, subtitle, children, className = '', action }: SectionProps) {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-2xl font-bold text-white animate-fade-in-up">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1 text-slate-400 animate-fade-in-up stagger-1">{subtitle}</p>
            )}
          </div>
          {action && <div className="animate-fade-in-up stagger-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
