import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Reveal, Tilt } from '../components/anim';

type Health = 'checking' | 'online' | 'offline';

const steps = [
  {
    title: 'Cole a URL do repositório',
    text: 'Informe o link de qualquer repositório público do GitHub.',
    icon: '⌘',
  },
  {
    title: 'Lemos o código por você',
    text: 'Baixamos os arquivos relevantes e calculamos linhas, comentários e complexidade.',
    icon: '◈',
  },
  {
    title: 'A IA avalia o projeto',
    text: 'Receba notas de arquitetura, segurança, performance, manutenção e documentação.',
    icon: '✦',
  },
];

const features = [
  {
    title: 'Nota de saúde do código',
    text: 'Um score de 0 a 100 que resume a qualidade geral do repositório.',
    icon: '◉',
  },
  {
    title: 'Métricas detalhadas',
    text: 'Total de arquivos, linhas de código e complexidade ciclomática média.',
    icon: '▤',
  },
  {
    title: 'Resumo em linguagem clara',
    text: 'Um relatório escrito pela IA explicando pontos fortes e fracos.',
    icon: '✎',
  },
  {
    title: 'Histórico de evolução',
    text: 'Rode novas análises e acompanhe se o score está subindo ou caindo.',
    icon: '◔',
  },
];

const stack = [
  'React 19',
  'TypeScript',
  'Vite',
  'Tailwind CSS',
  'Node.js',
  'Express',
  'PostgreSQL',
  'Haskell',
  'Scotty',
  'Groq',
];

const highlights = [
  { value: '100%', label: 'Métricas determinísticas' },
  { value: '6', label: 'Dimensões avaliadas' },
  { value: '∞', label: 'Repositórios no histórico' },
];

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
      {/* ---------------- HERO ---------------- */}
      <section className="relative px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
        <div className="page-glow" />

        <div className="mx-auto max-w-4xl text-center">
          <Reveal from="blur" duration={900}>
            <div className="mb-7 flex justify-center">
              <Badge
                tone={health === 'online' ? 'green' : health === 'offline' ? 'red' : 'yellow'}
                pulse={health === 'checking'}
                dot
                className="edge-glow-subtle px-3.5 py-1 text-sm"
              >
                {health === 'checking'
                  ? 'Verificando backend...'
                  : health === 'online'
                    ? 'Backend online'
                    : 'Backend offline'}
              </Badge>
            </div>
          </Reveal>

          <Reveal from="blur" delay={140} duration={1000}>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-text-primary sm:text-6xl lg:text-7xl">
              Understand your{' '}
              <span className="text-animated-gradient">codebase</span>
              <span className="type-caret" />
              <br className="hidden sm:block" /> with AI
            </h1>
          </Reveal>

          <Reveal from="bottom" delay={300} duration={900}>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
              Cole o link de um repositório do GitHub e receba métricas, notas e um relatório
              completo sobre a qualidade do código.
            </p>
          </Reveal>

          <Reveal from="flip" delay={440} distance={70} duration={1100}>
            <form
              onSubmit={handleSubmit}
              className="mx-auto mt-11 flex max-w-2xl flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <div className="edge-glow rounded-xl">
                  <Input
                    type="url"
                    aria-label="URL do repositório GitHub"
                    placeholder="https://github.com/usuario/repositorio"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="border-transparent py-3.5 font-mono"
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="hover-sheen sm:w-44">
                Analisar
              </Button>
            </form>
          </Reveal>

          {health === 'offline' && (
            <Reveal from="bottom" delay={200}>
              <p className="mt-5 text-sm text-red-400">
                Não foi possível falar com o backend. Verifique a conexão e tente novamente.
              </p>
            </Reveal>
          )}
        </div>

        {/* Highlights */}
        <div className="mx-auto mt-20 grid max-w-3xl gap-4 sm:grid-cols-3">
          {highlights.map((h, i) => (
            <Reveal key={h.label} from="flip" delay={i * 150} distance={60} duration={1000}>
              <div className="depth-card depth-card-hover group rounded-2xl border border-border bg-surface/60 px-5 py-6 text-center backdrop-blur-sm">
                <p className="text-animated-gradient text-3xl font-bold">{h.value}</p>
                <p className="mt-1.5 text-xs uppercase tracking-[0.16em] text-slate-500">
                  {h.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- COMO FUNCIONA ---------------- */}
      <section className="relative px-4 py-20 sm:px-6" aria-labelledby="how">
        <div className="mx-auto max-w-6xl">
          <Reveal from="left">
            <SectionHeading
              eyebrow="Pipeline"
              title="Como funciona"
              id="how"
            />
          </Reveal>

          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.title} as="li" from="flip" delay={i * 170} distance={80} duration={1100}>
                <Tilt intensity={14} lift={34} className="h-full">
                  <div className="depth-card depth-card-hover group relative h-full overflow-hidden rounded-2xl border border-border bg-surface/70 p-7 backdrop-blur-sm">
                    <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="flex items-center justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-xl text-accent transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                        {s.icon}
                      </span>
                      <span className="font-mono text-5xl font-bold text-border transition-colors duration-500 group-hover:text-primary/25">
                        0{i + 1}
                      </span>
                    </div>

                    <h3 className="mt-6 font-semibold text-text-primary">{s.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{s.text}</p>

                    <span className="mt-6 block font-mono text-xs text-accent">
                      Passo {i + 1}
                    </span>
                  </div>
                </Tilt>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section className="relative px-4 py-20 sm:px-6" aria-labelledby="features">
        <div className="mx-auto max-w-6xl">
          <Reveal from="right">
            <SectionHeading eyebrow="Entregáveis" title="O que você recebe" id="features" />
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {features.map((f, i) => (
              <Reveal key={f.title} from="flip" delay={i * 130} distance={70} duration={1000}>
                <Tilt intensity={10} lift={26}>
                  <div className="depth-card depth-card-hover group relative h-full overflow-hidden rounded-2xl border border-border bg-surface/70 p-7 backdrop-blur-sm">
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

                    <span className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background/60 text-lg text-accent transition-all duration-500 group-hover:border-primary/50 group-hover:text-text-primary">
                      {f.icon}
                    </span>

                    <h3 className="relative mt-5 text-lg font-semibold text-text-primary">{f.title}</h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-slate-400">
                      {f.text}
                    </p>

                    <span className="absolute inset-x-0 bottom-0 h-0.5 w-0 bg-gradient-to-r from-primary to-purple-500 transition-all duration-500 group-hover:w-full" />
                  </div>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- STACK ---------------- */}
      <section className="relative px-4 py-20 sm:px-6" aria-labelledby="stack">
        <div className="mx-auto max-w-6xl">
          <Reveal from="bottom">
            <SectionHeading eyebrow="Stack" title="Tecnologias" id="stack" />
          </Reveal>
        </div>

        {/* Faixa full-bleed: sai do container para tocar as bordas da tela */}
        <div className="relative mt-10 overflow-hidden py-2">
          <div
            className="marquee-track"
            style={{ '--marquee-duration': '38s' } as React.CSSProperties}
          >
            {/* Dois grupos idênticos: -50% cai exatamente no início do 2º,
                e o pr-3 de cada grupo mantém o espaçamento contínuo. */}
            {[0, 1].map((group) => (
              <div key={group} className="flex shrink-0 gap-3 pr-3">
                {stack.map((s) => (
                  <span
                    key={`${group}-${s}`}
                    className="shrink-0 rounded-xl border border-border bg-surface/70 px-5 py-2.5 font-mono text-sm text-slate-300 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:bg-primary/10 hover:text-text-primary hover:shadow-lg hover:shadow-primary/20"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="relative px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Reveal from="blur" duration={1000}>
            <div className="edge-glow relative overflow-hidden rounded-3xl border border-border bg-surface/60 px-8 py-14 text-center backdrop-blur-md">
              <div className="float-y-sm">
                <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
                  Pronto para <span className="text-animated-gradient">auditar</span> seu código?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-slate-400">
                  Crie sua conta e rode sua primeira análise em menos de um minuto.
                </p>
                <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button size="lg" className="hover-sheen" onClick={() => navigate('/register')}>
                    Criar conta grátis
                  </Button>
                  <Button size="lg" variant="secondary" onClick={() => navigate('/login')}>
                    Já tenho conta
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) {
  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.28em] text-accent">{eyebrow}</span>
      <h2 id={id} className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
        {title}
      </h2>
      <span className="mt-4 block h-px w-24 bg-gradient-to-r from-primary to-transparent" />
    </div>
  );
}
