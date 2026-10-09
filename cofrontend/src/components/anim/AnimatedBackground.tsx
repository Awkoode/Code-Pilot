import { useMemo } from 'react';

/**
 * Fundo animado "pesado" feito 100% com CSS/SVG.
 * Fica fixado atrás do conteúdo e nunca captura eventos do mouse,
 * então não interfere em nenhum clique, input ou link das páginas.
 */

interface Particle {
  left: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  opacity: number;
  color: string;
}

interface AnimatedBackgroundProps {
  /** Reduz a quantidade de partículas e desliga as auroras. */
  lite?: boolean;
}

const PARTICLE_COLORS = [
  'var(--accent-primary)',
  'var(--accent-secondary)',
  '#a855f7',
  '#22d3ee',
  '#818cf8',
];

export function AnimatedBackground({ lite = false }: AnimatedBackgroundProps) {
  const particles = useMemo<Particle[]>(() => {
    const count = lite ? 14 : 38;
    return Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 16 + Math.random() * 22,
      delay: -Math.random() * 34,
      driftX: -50 + Math.random() * 100,
      opacity: 0.25 + Math.random() * 0.5,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    }));
  }, [lite]);

  return (
    <div className="scene-root" aria-hidden="true">
      <div className="absolute inset-0 bg-background transition-colors duration-500" />

      {!lite && (
        <>
          <div className="aurora aurora-1" />
          <div className="aurora aurora-2" />
          <div className="aurora aurora-3" />
        </>
      )}

      <div className="grid-floor" />

      {!lite && (
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((p, i) => (
            <span
              key={i}
              className="particle"
              style={
                {
                  left: `${p.left}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: p.color,
                  '--particle-duration': `${p.duration}s`,
                  '--particle-delay': `${p.delay}s`,
                  '--drift-x': `${p.driftX}px`,
                  '--particle-opacity': p.opacity,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      <div className="noise-overlay" />
    </div>
  );
}
