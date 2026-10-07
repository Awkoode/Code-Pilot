import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavbarItem {
  id: string;
  label: string;
  to: string;
  icon?: ReactNode;
}

interface NavbarProps {
  items: NavbarItem[];
  logo?: ReactNode;
  actions?: ReactNode;
  mobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

export function Navbar({
  items,
  logo,
  actions,
  mobileMenuOpen = false,
  onMobileMenuToggle,
}: NavbarProps) {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          {logo}
          <nav className="hidden items-center gap-1 md:flex">
            {items.map((item) => {
              const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  className={`
                    flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium
                    transition-all duration-200
                    ${active
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-400 hover:bg-elevated hover:text-white'
                    }
                  `}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {actions}
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              aria-label="Menu"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-elevated hover:text-white md:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="border-t border-border bg-surface p-4 md:hidden animate-fade-in-down">
          <ul className="space-y-1">
            {items.map((item) => {
              const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
              return (
                <li key={item.id}>
                  <Link
                    to={item.to}
                    className={`
                      flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium
                      transition-all duration-200
                      ${active
                        ? 'bg-primary/10 text-primary'
                        : 'text-slate-400 hover:bg-elevated hover:text-white'
                      }
                    `}
                    onClick={onMobileMenuToggle}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
