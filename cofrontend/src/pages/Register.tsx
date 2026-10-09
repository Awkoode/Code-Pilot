import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toApiError } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Reveal, Tilt } from '../components/anim';

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && !loading) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmError(undefined);
    if (password !== confirm) {
      setConfirmError('As senhas não coincidem');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(toApiError(err).message);
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-14">
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/20 blur-[90px]" />

      <Tilt intensity={9} lift={22} className="relative w-full">
        <Reveal from="flip" distance={80} duration={1000}>
          <div className="depth-card edge-glow-subtle relative overflow-visible rounded-2xl border border-border bg-surface/80 p-8 backdrop-blur-xl">
            <div className="text-center">
              <span className="float-y-sm mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-primary font-mono text-xl text-white shadow-lg shadow-purple-500/30">
                ✦
              </span>
              <h1 className="mt-6 text-2xl font-bold text-text-primary">Criar conta</h1>
              <p className="mt-1.5 text-sm text-slate-400">
                Comece a analisar seus repositórios em minutos.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
              <Reveal from="left" delay={160} distance={30} duration={700}>
                <Input
                  label="E-mail"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Reveal>

              <Reveal from="left" delay={260} distance={30} duration={700}>
                <Input
                  label="Senha"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Reveal>

              <Reveal from="right" delay={360} distance={30} duration={700}>
                <Input
                  label="Confirmar senha"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  error={confirmError}
                  onChange={(e) => setConfirm(e.target.value)}
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

              <Reveal from="bottom" delay={460} distance={26} duration={700}>
                <Button type="submit" loading={loading} className="hover-sheen w-full" size="lg">
                  Criar conta
                </Button>
              </Reveal>
            </form>

            <Reveal from="bottom" delay={580} duration={700}>
              <p className="mt-7 text-center text-sm text-slate-400">
                Já tem conta?{' '}
                <Link
                  to="/login"
                  className="font-medium text-accent transition-all duration-300 hover:text-text-primary hover:underline"
                >
                  Entrar
                </Link>
              </p>
            </Reveal>
          </div>
        </Reveal>
      </Tilt>
    </div>
  );
}
