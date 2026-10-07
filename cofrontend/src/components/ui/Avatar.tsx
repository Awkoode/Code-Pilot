interface AvatarProps {
  email: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

const colors = [
  'bg-primary',
  'bg-purple-500',
  'bg-cyan-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-pink-500',
  'bg-indigo-500',
];

export function Avatar({ email, size = 'md', className = '' }: AvatarProps) {
  const initial = email.charAt(0).toUpperCase();
  const colorIndex = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

  return (
    <div
      className={`
        flex items-center justify-center rounded-full font-semibold text-white
        ${sizes[size]}
        ${colors[colorIndex]}
        ${className}
      `}
      aria-label={`Avatar de ${email}`}
      role="img"
    >
      {initial}
    </div>
  );
}
