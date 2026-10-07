import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

type Health = 'checking' | 'online' | 'offline';

const steps = [
  { title: 'Cole a URL do repositório', text: 'Informe o link de qualquer repositório público do GitHub.' },
  { title: 'Lemos o código por você', text: 'Baixamos os arquivos relevantes e calculamos linhas, comentários e complexidade.' },
  { title: 'A IA avalia o projeto', text: 'Receba notas de arquitetura, segurança, performance, manutenção e documentação.' },
];

const features = [
  { title: 'Nota de saúde do código', text: 'Um score de 0 a 100 que resume a qualidade geral do repositório.' },
  { title: 'Métricas detalhadas', text: 'Total de arquivos, linhas de código e complexidade ciclomática média.' },
  { title: 'Resumo em linguagem clara', text: 'Um relatório escrito pela IA explicando pontos fortes e fracos.' },
  { title: 'Histórico de evolução', text: 'Rode novas análises e acompanhe se o score está subindo ou caindo.' },
];

const stack = ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS', 'Node.js', 'Express', 'PostgreSQL'];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [health, setHealth] = useState<Health>('checking');

  useEffect(() => {
    api
      .health()
      .then((h) => setHealth(h.status === 'ok' ? 'online' : 'offline'))
      .catch(() => setHealth('offline'));
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const target = `/dashboard${url.trim() ? `?repo=${encodeURIComponent(url.trim())}` : ''}`;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: target } });
      return;
    }
    navigate(target);
  };

  return (
    <>
      <section className="mx-auto max-w-4xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
        <div className="mb-6 flex justify-center animate-fade-in-down">
          <Badge tone={health === 'online' ? 'green' : health === 'offline' ? 'red' : 'yellow'} pulse={health === 'checking'} dot>
            {health === 'checking' ? 'Verificando backend...' : health === 'online' ? 'Backend online' : 'Backend offline'}
          </Badge>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl animate-fade-in-up">
          Understand your <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">codebase</span> with AI
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 animate-fade-in-up stagger-1">
          Cole o link de um repositório do GitHub e receba métricas, notas e um relatório completo sobre a qualidade do código.
        </p>
        <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row animate-fade-in-up stagger-2">
          <div className="flex-1">
            <Input
              type="url"
              aria-label="URL do repositório GitHub"
              placeholder="https://github.com/usuario/repositorio"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="py-3 font-mono"
            />
          </div>
          <Button type="submit" size="lg">
            Analyze
          </Button>
        </form>
        {health === 'offline' && (
          <p className="mt-4 text-sm text-red-400 animate-fade-in">
            Não foi possível falar com o backend. Verifique a conexão e tente novamente.
          </p>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="how">
        <h2 id="how" className="text-2xl font-bold text-white animate-fade-in-up">
          Como funciona
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <Card hover className="h-full">
                <span className="font-mono text-sm text-accent">Passo {i + 1}</span>
                <h3 className="mt-2 font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="features">
        <h2 id="features" className="text-2xl font-bold text-white animate-fade-in-up">
          O que você recebe
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map((f, i) => (
            <div key={f.title} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <Card hover>
                <CardHeader className="mb-2 text-base">{f.title}</CardHeader>
                <CardContent className="text-sm text-slate-400">{f.text}</CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="stack">
        <h2 id="stack" className="text-2xl font-bold text-white animate-fade-in-up">
          Tecnologias
        </h2>
        <ul className="mt-6 flex flex-wrap gap-2">
          {stack.map((s, i) => (
            <li
              key={s}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-sm text-slate-300 transition-all duration-300 hover:border-primary/50 hover:text-white animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {s}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
