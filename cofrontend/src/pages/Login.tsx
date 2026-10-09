import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toApiError } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Reveal, Tilt } from '../components/anim';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && !loading) return <Navigate to={from} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(toApiError(err).message);
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-14">
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[90px]" />

      <Tilt intensity={9} lift={22} className="relative w-full">
        <Reveal from="flip" distance={80} duration={1000}>
          <div className="depth-card edge-glow relative overflow-visible rounded-2xl border border-border bg-surface/80 p-8 backdrop-blur-xl">
            <div className="text-center">
              <span className="float-y-sm mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 font-mono text-xl text-white shadow-lg shadow-primary/30">
                {'>'}
              </span>
              <h1 className="mt-6 text-2xl font-bold text-text-primary">Entrar</h1>
              <p className="mt-1.5 text-sm text-slate-400">
                Acesse seus projetos e análises.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
              <Reveal from="left" delay={180} distance={30} duration={700}>
                <Input
                  label="E-mail"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Reveal>

              <Reveal from="left" delay={300} distance={30} duration={700}>
                <Input
                  label="Senha"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Reveal>

              {error && (
                <Reveal from="scale" duration={500}>
                  <p
                    role="alert"
                    className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400"
                  >
                    {error}
                  </p>
                </Reveal>
              )}

              <Reveal from="bottom" delay={420} distance={26} duration={700}>
                <Button type="submit" loading={loading} className="hover-sheen w-full" size="lg">
                  Entrar
                </Button>
              </Reveal>
            </form>

            <Reveal from="bottom" delay={540} duration={700}>
              <p className="mt-7 text-center text-sm text-slate-400">
                Não tem conta?{' '}
                <Link
                  to="/register"
                  className="font-medium text-accent transition-all duration-300 hover:text-text-primary hover:underline"
                >
                  Criar conta
                </Link>
              </p>
            </Reveal>
          </div>
        </Reveal>
      </Tilt>
    </div>
  );
}
