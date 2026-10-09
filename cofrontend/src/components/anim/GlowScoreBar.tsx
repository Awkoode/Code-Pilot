import { useEffect, useRef, useState } from 'react';

interface GlowScoreBarProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showValue?: boolean;
  /** Animar quando entra na viewport. */
  onView?: boolean;
  delay?: number;
}

const TONE_STOPS = {
  red: { from: '#ef4444', to: '#f87171', glow: 'rgba(239, 68, 68, 0.55)' },
  yellow: { from: '#eab308', to: '#facc15', glow: 'rgba(234, 179, 8, 0.55)' },
  green: { from: '#22c55e', to: '#4ade80', glow: 'rgba(34, 197, 94, 0.55)' },
};

const DIMENSIONS = {
  sm: { track: 8, label: 12, value: 12 },
  md: { track: 11, label: 13, value: 14 },
  lg: { track: 16, label: 15, value: 24 },
  xl: { track: 22, label: 16, value: 34 },
};

function toneOf(score: number) {
  if (score <= 40) return 'red' as const;
  if (score <= 70) return 'yellow' as const;
  return 'green' as const;
}

/**
 * Barra de score com gradiente animado, glow reativo e
 * brilho que percorre a barra quando o valor muda.
 */
export function GlowScoreBar({
  score,
  label,
  size = 'md',
  showValue = true,
  onView = false,
  delay = 0,
}: GlowScoreBarProps) {
  const target = Math.max(0, Math.min(100, score));
  const tone = toneOf(target);
  const stops = TONE_STOPS[tone];
  const dim = DIMENSIONS[size];

  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [started, setStarted] = useState(!onView);

  useEffect(() => {
    if (!onView) {
      setWidth(target);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setStarted(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [onView, target]);

  useEffect(() => {
    if (!started) return;
    const timer = window.setTimeout(() => setWidth(target), delay);
    return () => window.clearTimeout(timer);
  }, [started, target, delay]);

  return (
    <div ref={ref} className="w-full">
      {(label || showValue) && (
        <div className="mb-2 flex items-baseline justify-between gap-2">
          {label && (
            <span
              className="font-medium uppercase tracking-[0.14em] text-slate-400"
              style={{ fontSize: dim.label }}
            >
              {label}
            </span>
          )}
          {showValue && (
            <span
              className="font-mono font-bold tabular-nums"
              style={{ fontSize: dim.value, color: stops.to, textShadow: `0 0 18px ${stops.glow}` }}
            >
              {Math.round(target)}
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-label={label ?? 'score'}
        aria-valuenow={Math.round(target)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative w-full overflow-hidden rounded-full"
        style={{
          height: dim.track,
          background: 'color-mix(in srgb, var(--border-color) 70%, transparent)',
          boxShadow: `inset 0 1px 2px rgba(0,0,0,0.35), 0 0 ${dim.track}px ${stops.glow}`,
        }}
      >
        <div
          className="relative h-full rounded-full"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${stops.from}, ${stops.to})`,
            boxShadow: `0 0 ${dim.track * 1.2}px ${stops.glow}`,
            transition: 'width 1400ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* brilho que percorre a barra */}
          <span
            className="pointer-events-none absolute inset-y-0 right-0 w-1/3"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
              animation: started ? 'shimmerSweep 2.6s var(--ease-in-out) infinite' : 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}
