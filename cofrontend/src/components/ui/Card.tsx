import { forwardRef, type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, glow = false, gradient = false, padding = 'md', className = '', children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          rounded-xl border border-border bg-surface
          transition-all duration-300 ease-out
          ${paddings[padding]}
          ${hover ? 'card-hover cursor-pointer' : ''}
          ${glow ? 'animate-glow' : ''}
          ${gradient ? 'gradient-border' : ''}
          ${className}
        `}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={`mb-4 text-lg font-semibold text-white ${className}`}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={`text-slate-300 ${className}`}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={`mt-4 flex items-center gap-3 ${className}`}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

CardFooter.displayName = 'CardFooter';
