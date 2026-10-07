import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/Button';
import { ThemeToggle } from './ui/ThemeToggle';
import { Avatar } from './ui/Avatar';

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary transition-colors duration-300">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2 text-lg font-bold text-white transition-all duration-300 hover:opacity-80"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary font-mono text-sm transition-transform duration-300 hover:scale-110">
                {'>'}
              </span>
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                CodePilot
              </span>
            </Link>
            {isAuthenticated && (
              <nav className="hidden sm:block">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `text-sm font-medium transition-all duration-300 ${
                      isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                    }`
                  }
                >
                  Dashboard
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
                  className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-all duration-300 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border py-6 transition-colors duration-300">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} CodePilot</span>
          <span className="font-mono text-xs">Análise inteligente de repositórios GitHub</span>
        </div>
      </footer>
    </div>
  );
}
