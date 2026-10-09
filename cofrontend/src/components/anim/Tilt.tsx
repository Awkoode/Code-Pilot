import { useRef, type ReactNode } from 'react';

interface TiltProps {
  children: ReactNode;
  /** Intensidade da rotação em graus. 0 desliga. */
  intensity?: number;
  /** Escala aplicada no hover. */
  scale?: number;
  /** Distância que o conteúdo flutua em Z em relação ao card. */
  lift?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * Efeito de tilt 3D seguindo o cursor, 100% em CSS transforms
 * (sem React state por frame, então não causa re-render).
 */
export function Tilt({
  children,
  intensity = 12,
  scale = 1.02,
  lift = 28,
  className = '',
  disabled = false,
}: TiltProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const reset = () => {
    const card = cardRef.current;
    const content = contentRef.current;
    if (!card || !content) return;

    card.style.transition = 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)';
    card.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    content.style.transition = 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)';
    content.style.transform = 'translateZ(0px)';
    card.style.setProperty('--shine-x', '50%');
    card.style.setProperty('--shine-y', '50%');
  };

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const card = cardRef.current;
    const content = contentRef.current;
    if (!card || !content) return;

    // Coalesce os eventos em um único write por frame
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;

      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;

      const rotateY = (px - 0.5) * intensity * 2;
      const rotateX = (0.5 - py) * intensity * 2;

      card.style.transition = 'transform 120ms linear';
      card.style.transform = `perspective(1400px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(
        2,
      )}deg) scale3d(${scale}, ${scale}, ${scale})`;

      content.style.transition = 'transform 120ms linear';
      content.style.transform = `translate3d(0, 0, ${lift}px)`;

      card.style.setProperty('--shine-x', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--shine-y', `${(py * 100).toFixed(1)}%`);
    });
  };

  return (
    <div
      className="tilt-stage"
      onMouseLeave={() => {
        if (frame.current) {
          cancelAnimationFrame(frame.current);
          frame.current = 0;
        }
        reset();
      }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMove}
        className={`tilt-card relative ${className}`}
        style={{ transform: 'perspective(1400px)' }}
      >
        <div ref={contentRef}>{children}</div>
        <span className="tilt-shine" />
      </div>
    </div>
  );
}
