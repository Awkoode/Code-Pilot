import { forwardRef, type HTMLAttributes } from 'react';

type Tone = 'green' | 'red' | 'yellow' | 'neutral' | 'primary' | 'purple' | 'cyan';

const tones: Record<Tone, string> = {
  green: 'bg-green-400/10 text-green-400 border-green-400/30',
  red: 'bg-red-400/10 text-red-400 border-red-400/30',
  yellow: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
  neutral: 'bg-border/60 text-slate-300 border-border',
  primary: 'bg-primary/10 text-primary-hover border-primary/30',
  purple: 'bg-purple-400/10 text-purple-400 border-purple-400/30',
  cyan: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  pulse?: boolean;
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ tone = 'neutral', pulse = false, dot = false, className = '', children, ...rest }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium
          transition-all duration-300 ease-out
          ${tones[tone]}
          ${pulse ? 'animate-pulse' : ''}
          ${className}
        `}
        {...rest}
      >
        {dot && (
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${tone === 'green' ? 'bg-green-400' : tone === 'red' ? 'bg-red-400' : tone === 'yellow' ? 'bg-yellow-400' : 'bg-slate-400'}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${tone === 'green' ? 'bg-green-400' : tone === 'red' ? 'bg-red-400' : tone === 'yellow' ? 'bg-yellow-400' : 'bg-slate-400'}`} />
          </span>
        )}
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

export function scoreTone(score: number): 'red' | 'yellow' | 'green' {
  if (score <= 40) return 'red';
  if (score <= 70) return 'yellow';
  return 'green';
}
