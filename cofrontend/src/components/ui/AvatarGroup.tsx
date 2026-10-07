import { Avatar } from './Avatar';

interface AvatarGroupProps {
  emails: string[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ emails, max = 4, size = 'md' }: AvatarGroupProps) {
  const visible = emails.slice(0, max);
  const remaining = emails.length - visible.length;

  return (
    <div className="flex -space-x-2">
      {visible.map((email, i) => (
        <div
          key={i}
          className="rounded-full ring-2 ring-surface transition-transform hover:-translate-y-1 hover:z-10"
          style={{ zIndex: visible.length - i }}
        >
          <Avatar email={email} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`
            flex items-center justify-center rounded-full bg-surface font-medium text-slate-400 ring-2 ring-surface
            ${size === 'sm' ? 'h-8 w-8 text-xs' : size === 'md' ? 'h-10 w-10 text-sm' : 'h-12 w-12 text-base'}
          `}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
