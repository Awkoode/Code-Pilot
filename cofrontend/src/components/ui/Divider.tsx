interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  label?: string;
}

export function Divider({ orientation = 'horizontal', className = '', label }: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        className={`mx-4 h-full w-px bg-border ${className}`}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  if (label) {
    return (
      <div className={`flex items-center gap-4 ${className}`} role="separator">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm text-slate-500">{label}</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }

  return (
    <div
      className={`h-px w-full bg-border ${className}`}
      role="separator"
      aria-orientation="horizontal"
    />
  );
}
