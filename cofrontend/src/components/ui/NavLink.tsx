import { NavLink as RouterNavLink } from 'react-router-dom';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export function NavLink({ to, children, className = '' }: NavLinkProps) {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        `text-sm font-medium transition-all duration-300 ${
          isActive ? 'text-white' : 'text-slate-400 hover:text-white'
        } ${className}`
      }
    >
      {children}
    </RouterNavLink>
  );
}
