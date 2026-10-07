import { forwardRef, type HTMLAttributes } from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const variants: Record<AlertVariant, { container: string; icon: string }> = {
  info: {
    container: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
    icon: 'text-cyan-400',
  },
  success: {
    container: 'border-green-400/30 bg-green-400/10 text-green-300',
    icon: 'text-green-400',
  },
  warning: {
    container: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-300',
    icon: 'text-yellow-400',
  },
  error: {
    container: 'border-red-400/30 bg-red-400/10 text-red-300',
    icon: 'text-red-400',
  },
};

const icons: Record<AlertVariant, React.ReactElement> = {
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'info', title, dismissible = false, onDismiss, className = '', children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={`
          flex items-start gap-3 rounded-lg border p-4
          animate-fade-in
          ${variants[variant].container}
          ${className}
        `}
        {...rest}
      >
        <span className={`flex-shrink-0 ${variants[variant].icon}`}>
          {icons[variant]}
        </span>
        <div className="flex-1">
          {title && <p className="font-medium">{title}</p>}
          {children && <div className={title ? 'mt-1 text-sm' : ''}>{children}</div>}
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            aria-label="Fechar alerta"
            className="flex-shrink-0 rounded p-1 opacity-60 transition-opacity hover:opacity-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  },
);

Alert.displayName = 'Alert';
