import { useEffect, useRef, useState, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Atraso em ms antes da animação começar. */
  delay?: number;
  /** Duração da animação em ms. */
  duration?: number;
  /** Direção de entrada. */
  from?: 'bottom' | 'top' | 'left' | 'right' | 'scale' | 'blur' | 'flip';
  /** Distância percorrida em px. */
  distance?: number;
  /** Elemento usado para observar a visibilidade. */
  as?: 'div' | 'section' | 'li' | 'article' | 'span' | 'header';
  className?: string;
  style?: React.CSSProperties;
  /** Quando true, anima assim que monta, sem esperar scroll. */
  immediate?: boolean;
}

const OFFSETS: Record<NonNullable<RevealProps['from']>, string> = {
  bottom: 'translateY',
  top: 'translateY',
  left: 'translateX',
  right: 'translateX',
  scale: 'scale',
  blur: 'scale',
  flip: 'scale3d',
};

function buildHidden(
  from: NonNullable<RevealProps['from']>,
  distance: number,
): React.CSSProperties {
  switch (from) {
    case 'bottom':
      return { opacity: 0, transform: `translate3d(0, ${distance}px, 0)` };
    case 'top':
      return { opacity: 0, transform: `translate3d(0, -${distance}px, 0)` };
    case 'left':
      return { opacity: 0, transform: `translate3d(-${distance}px, 0, 0)` };
    case 'right':
      return { opacity: 0, transform: `translate3d(${distance}px, 0, 0)` };
    case 'scale':
      return { opacity: 0, transform: `scale(${Math.max(0.5, 1 - distance / 200)})` };
    case 'blur':
      return { opacity: 0, filter: 'blur(12px)', transform: 'translateY(18px)' };
    case 'flip':
      return {
        opacity: 0,
        transform: `perspective(1200px) rotateX(-14deg) translate3d(0, ${distance / 2}px, -140px)`,
      };
  }
}

const FINAL_STATE: React.CSSProperties = {
  opacity: 1,
  filter: 'blur(0px)',
  transform: 'none',
};

/**
 * Revela o conteúdo quando ele entra na viewport.
 * Usa IntersectionObserver + Web Animations API (sem re-render por frame).
 */
export function Reveal({
  children,
  delay = 0,
  duration = 800,
  from = 'bottom',
  distance = 42,
  as = 'div',
  className = '',
  style,
  immediate = false,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const played = useRef(false);
  const [hidden, setHidden] = useState(!immediate);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(media.matches);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (immediate || reduced) {
      setHidden(false);
      return;
    }

    // Elemento já visível: revela sem esperar o observer
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      setHidden(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !played.current) {
            played.current = true;
            setHidden(false);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate, reduced]);

  const offsetProp = OFFSETS[from];

  const Tag = as as React.ElementType;

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={className}
      style={{
        ...style,
        ...(hidden && !reduced ? buildHidden(from, distance) : FINAL_STATE),
        transition: reduced
          ? 'none'
          : `opacity ${duration}ms var(--ease-out) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, filter ${duration}ms var(--ease-out) ${delay}ms`,
        willChange: hidden && !reduced ? 'opacity, transform, filter' : 'auto',
      }}
      data-reveal={from}
      data-reveal-offset={offsetProp}
    >
      {children}
    </Tag>
  );
}
