import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, checkBackendHealth, toApiError } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { CountUp, Reveal, ServiceButton, Tilt } from '../components/anim';
import type { Project } from '../types';

function repoNameFromUrl(url: string): string {
  const parts = url.replace(/\.git$/, '').split('/').filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 1] : '';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { data, loading, error, refetch } = useApi(() => api.listProjects(), []);

  const repoParam = searchParams.get('repo') ?? '';
  const [showForm, setShowForm] = useState(repoParam !== '');
  const [githubUrl, setGithubUrl] = useState(repoParam);
  const [name, setName] = useState(repoNameFromUrl(repoParam));
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (error) notify(error.message, 'error');
  }, [error, notify]);

  const closeForm = () => {
    setShowForm(false);
    if (searchParams.has('repo')) {
      searchParams.delete('repo');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { project } = await api.createProject({
        name: name.trim(),
        github_url: githubUrl.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      notify('Projeto criado', 'success');
      setName('');
      setGithubUrl('');
      setDescription('');
      closeForm();
      refetch();
      navigate(`/projects/${project.id}`);
    } catch (err) {
      notify(toApiError(err).message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!window.confirm(`Excluir o projeto "${project.name}"? Essa ação não pode ser desfeita.`)) return;
    setDeletingId(project.id);
    try {
      await api.deleteProject(project.id);
      notify('Projeto excluído', 'success');
      refetch();
    } catch (err) {
      notify(toApiError(err).message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const projects = data?.projects ?? [];

  // ---- Verificação de serviços ---------------------------------------
  const checkBackend = useCallback(async () => {
    const started = Date.now();
    const res = await checkBackendHealth();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return `online · ${Date.now() - started}ms`;
  }, []);

  const checkAnalyzer = useCallback(async () => {
    const started = Date.now();
    const ping = await api.pingAnalyzer();
    if (!ping.ok) {
      throw new Error(ping.error ?? (ping.status ? `HTTP ${ping.status}` : 'sem resposta'));
    }
    return `online · ${Date.now() - started}ms`;
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* ---------------- HEADER ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <Reveal from="left" duration={900}>
          <div>
            <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">Seus projetos</h1>
            <p className="mt-2 text-slate-400">
              Cada projeto é um repositório do GitHub com seu histórico de análises.
            </p>
          </div>
        </Reveal>

        {!showForm && (
          <Reveal from="right" delay={140} duration={900}>
            <Button onClick={() => setShowForm(true)} size="lg" className="hover-sheen">
              Novo Projeto
            </Button>
          </Reveal>
        )}
      </div>

      {/* ---------------- SERVIÇOS ---------------- */}
      <Reveal from="flip" distance={60} delay={200} duration={900}>
        <Card className="depth-card mt-8">
          <CardHeader className="flex items-center gap-2 text-base">
            <span className="text-accent">◈</span>
            Serviços
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <ServiceButton
              label="Ativar Analyzer"
              loadingLabel="Acionando analyzer..."
              onCheck={checkAnalyzer}
              tone="primary"
            />
            <ServiceButton
              label="Ativar Backend"
              loadingLabel="Acionando backend..."
              onCheck={checkBackend}
              tone="neutral"
            />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            O analyzer roda em hospedagem gratuita e pode ficar dormente. O primeiro
            botão o acorda chamando o health check; pode demorar dezenas de segundos
            na primeira vez.
          </p>
        </Card>
      </Reveal>
      {showForm && (
        <Reveal from="flip" distance={80} duration={1000}>
          <Card className="depth-card edge-glow relative mt-8 overflow-visible">
            <h2 className="text-lg font-semibold text-text-primary">Novo projeto</h2>
            <form onSubmit={handleCreate} className="mt-5 grid gap-4 md:grid-cols-2">
              <Input
                label="URL do GitHub"
                type="url"
                required
                placeholder="https://github.com/usuario/repositorio"
                value={githubUrl}
                onChange={(e) => {
                  setGithubUrl(e.target.value);
                  if (!name) setName(repoNameFromUrl(e.target.value));
                }}
                className="font-mono"
              />
              <Input label="Nome" required value={name} onChange={(e) => setName(e.target.value)} />
              <div className="md:col-span-2">
                <Input
                  label="Descrição (opcional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-3 md:col-span-2">
                <Button type="submit" loading={creating}>
                  Criar projeto
                </Button>
                <Button variant="ghost" onClick={closeForm} disabled={creating}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        </Reveal>
      )}

      {/* ---------------- LISTA ---------------- */}
      <div className="mt-9">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner text="Carregando projetos..." />
          </div>
        ) : error ? (
          <Reveal from="scale" duration={800}>
            <Card className="depth-card text-center">
              <p className="text-red-400">{error.message}</p>
              <Button variant="secondary" className="mt-4" onClick={refetch}>
                Tentar novamente
              </Button>
            </Card>
          </Reveal>
        ) : projects.length === 0 ? (
          <Reveal from="flip" distance={70} duration={1000}>
            <Card className="depth-card py-16 text-center">
              <div className="float-y-sm mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-2xl text-accent">
                ◫
              </div>
              <h2 className="mt-6 text-lg font-semibold text-text-primary">Nenhum projeto ainda</h2>
              <p className="mt-2 text-slate-400">
                Crie seu primeiro projeto com a URL de um repositório do GitHub.
              </p>
              {!showForm && (
                <Button className="mt-6" size="lg" onClick={() => setShowForm(true)}>
                  Novo Projeto
                </Button>
              )}
            </Card>
          </Reveal>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <Reveal key={p.id} as="li" from="flip" delay={i * 110} distance={70} duration={1000}>
                <Tilt intensity={13} lift={30} className="h-full">
                  <article className="depth-card depth-card-hover group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface/70 p-6 backdrop-blur-sm">
                    <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative flex items-start justify-between gap-2">
                      <h2 className="truncate text-lg font-semibold text-text-primary">{p.name}</h2>
                      <Badge tone="primary">GitHub</Badge>
                    </div>

                    <a
                      href={p.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative mt-1.5 truncate font-mono text-xs text-accent hover:underline"
                    >
                      {p.github_url}
                    </a>

                    {p.description && (
                      <p className="relative mt-3.5 line-clamp-2 text-sm text-slate-400">
                        {p.description}
                      </p>
                    )}

                    <p className="relative mt-4 font-mono text-xs text-slate-500">
                      Criado em {formatDate(p.created_at)}
                    </p>

                    <div className="relative mt-auto flex flex-wrap gap-2 pt-6">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/projects/${p.id}`, { state: { autoAnalyze: true } })}
                      >
                        Analisar
                      </Button>
                      <Link
                        to={`/projects/${p.id}`}
                        className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:text-text-primary"
                      >
                        Ver detalhes
                      </Link>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={deletingId === p.id}
                        onClick={() => handleDelete(p)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </article>
                </Tilt>
              </Reveal>
            ))}
          </ul>
        )}
      </div>

      {/* ---------------- CONTAGEM ---------------- */}
      {projects.length > 0 && !loading && (
        <Reveal from="bottom" delay={200}>
          <p className="mt-12 text-center font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
            <CountUp value={projects.length} /> {projects.length === 1 ? 'projeto' : 'projetos'} ·{' '}
            <CountUp value={projects.length * 6} /> análises potenciais
          </p>
        </Reveal>
      )}
    </div>
  );
}
