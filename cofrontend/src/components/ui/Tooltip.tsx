import { useState, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const positions = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrows = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-border border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-border border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-border border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-border border-y-transparent border-l-transparent',
};

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={`
            absolute z-50 whitespace-nowrap rounded-lg border border-border bg-elevated px-3 py-1.5
            text-xs font-medium text-white shadow-lg
            animate-fade-in
            ${positions[position]}
          `}
        >
          {content}
          <span
            className={`
              absolute h-0 w-0 border-4
              ${arrows[position]}
            `}
          />
        </div>
      )}
    </div>
  );
}
