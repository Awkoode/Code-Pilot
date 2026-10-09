import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Transição de rota: fade + blur + deslocamento na vertical.
 * Troca a key do wrapper quando a rota muda, reiniciando a animação.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const prevPath = useRef(location.pathname);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }

    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;

    // Fade rápido para fora e volta para a mesma altura (sem layout shift)
    setPhase('out');
    const timer = window.setTimeout(() => setPhase('in'), 220);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  const entering = phase === 'in';

  return (
    <div
      key={location.pathname}
      style={{
        opacity: entering ? 1 : 0,
        filter: entering ? 'blur(0px)' : 'blur(6px)',
        transform: entering ? 'translate3d(0, 0, 0)' : 'translate3d(0, 14px, 0)',
        transition:
          'opacity 420ms var(--ease-out), filter 420ms var(--ease-out), transform 520ms cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'opacity, transform, filter',
      }}
    >
      {children}
    </div>
  );
}
