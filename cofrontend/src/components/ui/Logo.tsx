import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <Link
      to="/"
      className={`flex items-center gap-2 text-lg font-bold text-white transition-all duration-300 hover:opacity-80 ${className}`}
      aria-label="CodePilot - página inicial"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary font-mono text-sm transition-transform duration-300 hover:scale-110">
        {'>'}
      </span>
      <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
        CodePilot
      </span>
    </Link>
  );
}
