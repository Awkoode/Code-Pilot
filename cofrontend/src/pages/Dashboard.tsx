import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, toApiError } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-white">Seus projetos</h1>
          <p className="mt-1 text-slate-400">Cada projeto é um repositório do GitHub com seu histórico de análises.</p>
        </div>
        {!showForm && <Button onClick={() => setShowForm(true)}>Novo Projeto</Button>}
      </div>

      {showForm && (
        <Card className="mt-8 animate-fade-in-up">
          <h2 className="text-lg font-semibold text-white">Novo projeto</h2>
          <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-2">
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
              <Input label="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
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
      )}

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner text="Carregando projetos..." />
          </div>
        ) : error ? (
          <Card className="text-center">
            <p className="text-red-400">{error.message}</p>
            <Button variant="secondary" className="mt-4" onClick={refetch}>
              Tentar novamente
            </Button>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="py-12 text-center animate-fade-in-up">
            <h2 className="text-lg font-semibold text-white">Nenhum projeto ainda</h2>
            <p className="mt-1 text-slate-400">Crie seu primeiro projeto com a URL de um repositório do GitHub.</p>
            {!showForm && (
              <Button className="mt-5" onClick={() => setShowForm(true)}>
                Novo Projeto
              </Button>
            )}
          </Card>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <li key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                <Card hover className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="truncate text-lg font-semibold text-white">{p.name}</h2>
                    <Badge tone="primary">GitHub</Badge>
                  </div>
                  <a
                    href={p.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 truncate font-mono text-xs text-accent hover:underline"
                  >
                    {p.github_url}
                  </a>
                  {p.description && <p className="mt-3 line-clamp-2 text-sm text-slate-400">{p.description}</p>}
                  <p className="mt-3 text-xs text-slate-500">Criado em {formatDate(p.created_at)}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    <Button size="sm" onClick={() => navigate(`/projects/${p.id}`, { state: { autoAnalyze: true } })}>
                      Analisar
                    </Button>
                    <Link
                      to={`/projects/${p.id}`}
                      className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-slate-200 transition-all duration-300 hover:border-primary/60 hover:text-white"
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
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
