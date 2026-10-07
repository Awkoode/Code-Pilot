import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toApiError } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

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
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <Card className="w-full animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white">Criar conta</h1>
        <p className="mt-1 text-sm text-slate-400">Comece a analisar seus repositórios em minutos.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <Input label="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            label="Senha"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirmar senha"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            error={confirmError}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && (
            <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400 animate-fade-in">
              {error}
            </p>
          )}
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Criar conta
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-primary-hover hover:underline">
            Entrar
          </Link>
        </p>
      </Card>
    </div>
  );
}
