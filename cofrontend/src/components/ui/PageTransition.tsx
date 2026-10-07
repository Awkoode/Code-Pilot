import { useEffect, useState, type ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter');

  useEffect(() => {
    if (children !== displayChildren) {
      setTransitionStage('exit');
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('enter');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [children, displayChildren]);

  return (
    <div
      className={`
        transition-all duration-300 ease-out
        ${transitionStage === 'enter' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {displayChildren}
    </div>
  );
}
