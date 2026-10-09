import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  /** Valor final alvo. */
  value: number;
  /** Duração da contagem em ms. */
  duration?: number;
  /** Casas decimais exibidas. */
  decimals?: number;
  /** Sufixo (ex.: '%', ' mil'). */
  suffix?: string;
  /** Prefixo (ex.: 'R$'). */
  prefix?: string;
  /** Milhar separador (0 desliga). */
  locale?: string;
  /** Espera o elemento entrar na viewport antes de contar. */
  startOnView?: boolean;
  className?: string;
}

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Conta de 0 até `value` com easing.
 * Usado nas estatísticas e nos scores para dar peso visual.
 */
export function CountUp({
  value,
  duration = 1600,
  decimals = 0,
  suffix = '',
  prefix = '',
  locale = 'pt-BR',
  startOnView = true,
  className = '',
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);
  const [display, setDisplay] = useState(0);

  const run = () => {
    if (frame.current) cancelAnimationFrame(frame.current);

    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      setDisplay(value * eased);

      if (progress < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        frame.current = 0;
        setDisplay(value);
      }
    };

    frame.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (!startOnView) {
      run();
      return;
    }

    const node = ref.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      run();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame.current) cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, startOnView]);

  const formatted = display.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
