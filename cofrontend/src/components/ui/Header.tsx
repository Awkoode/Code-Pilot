import type { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}

export function Header({ title, subtitle, children, className = '' }: HeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="animate-fade-in-up">
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-slate-400 animate-fade-in-up stagger-1">{subtitle}</p>
          )}
        </div>
        {children && <div className="animate-fade-in-up stagger-2">{children}</div>}
      </div>
    </div>
  );
}
