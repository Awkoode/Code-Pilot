import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/Button';
import { ThemeToggle } from './ui/ThemeToggle';
import { Avatar } from './ui/Avatar';
import { AnimatedBackground, PageTransition } from './anim';

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-text-primary transition-colors duration-300">
      <AnimatedBackground />

      <header
        className="sticky top-0 z-40 border-b transition-all duration-500"
        style={{
          borderColor: scrolled ? 'var(--border-color)' : 'transparent',
          background: scrolled ? 'color-mix(in srgb, var(--bg-secondary) 78%, transparent)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          boxShadow: scrolled ? '0 12px 40px -24px rgba(0,0,0,0.8)' : 'none',
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="group flex items-center gap-2 text-lg font-bold text-text-primary transition-transform duration-300 hover:scale-[1.03]"
            >
              <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary to-purple-600 font-mono text-sm text-white shadow-lg shadow-primary/30 transition-transform duration-500 group-hover:rotate-[14deg]">
                {'>'}
                <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </span>
              <span className="text-animated-gradient font-bold tracking-tight">
                CodePilot
              </span>
            </Link>

            {isAuthenticated && (
              <nav className="hidden sm:block">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `relative text-sm font-medium transition-all duration-300 ${
                      isActive ? 'text-text-primary' : 'text-slate-400 hover:text-text-primary'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      Dashboard
                      {isActive && (
                        <span className="absolute -bottom-1.5 left-0 h-px w-full bg-gradient-to-r from-primary to-purple-500 shadow-[0_0_10px_var(--accent-glow)]" />
                      )}
                    </>
                  )}
                </NavLink>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <span className="hidden font-mono text-xs text-slate-500 sm:inline">
                  {user?.email}
                </span>
                <Avatar email={user?.email || ''} size="sm" />
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="relative text-sm font-medium text-slate-300 transition-colors hover:text-text-primary"
                >
                  Entrar
                  <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-300 hover:w-full" />
                </Link>
                <Link
                  to="/register"
                  className="hover-sheen relative overflow-hidden rounded-lg bg-gradient-to-r from-primary to-purple-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-md shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 active:translate-y-0"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="page-shell flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <footer className="page-shell border-t border-border py-6 transition-colors duration-300">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} CodePilot</span>
          <span className="font-mono text-xs">Análise inteligente de repositórios GitHub</span>
        </div>
      </footer>

      {/* Easter egg. Vive aqui, e não dentro da página, porque o
          PageTransition aplica transform no Outlet e isso cria um
          containing block: um position:fixed lá dentro deixaria de
          se posicionar relativa à viewport. */}
      {location.pathname === '/' && (
        <div className="fixed bottom-4 right-4 z-40">
          <Link
            to="/suporte"
            aria-label="Suporte"
            title="©"
            className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/80 text-sm text-slate-500 backdrop-blur-sm transition-all duration-500 hover:border-primary/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full bg-primary/25 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100"
            />
            <span className="relative transition-transform duration-500 group-hover:scale-110">
              ©
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
