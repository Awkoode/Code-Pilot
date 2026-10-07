import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, toApiError } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/ui/Toast';
import { Badge, scoreTone } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { ScoreBar } from '../components/ui/ScoreBar';
import { Spinner } from '../components/ui/Spinner';
import type { AnalyzeResponse, Analysis } from '../types';

const ANALYSIS_STEPS = ['Baixando repositório...', 'Calculando métricas...', 'Gerando relatório com IA...'];

interface ScoreView {
  overall: number;
  architecture: number;
  security: number;
  performance: number;
  maintainability: number;
  documentation: number;
  summary: string;
}

const fromResponse = (r: AnalyzeResponse): ScoreView => ({
  overall: r.metrics.healthScore,
  architecture: r.aiReport.architectureScore,
  security: r.aiReport.securityScore,
  performance: r.aiReport.performanceScore,
  maintainability: r.aiReport.maintainabilityScore,
  documentation: r.aiReport.documentationScore,
  summary: r.aiReport.aiSummary,
});

const fromAnalysis = (a: Analysis): ScoreView => ({
  overall: a.score,
  architecture: a.architecture_score,
  security: a.security_score,
  performance: a.performance_score,
  maintainability: a.maintainability_score,
  documentation: a.documentation_score,
  summary: a.ai_summary,
});

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const fmtNumber = (n: number) => n.toLocaleString('pt-BR');

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-4 py-3 transition-all duration-300 hover:border-primary/50">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 font-mono text-xl font-semibold text-white">{value}</dd>
    </div>
  );
}

export default function ProjectDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useToast();

  const project = useApi(() => api.getProject(id), [id]);
  const analyses = useApi(() => api.listAnalyses(id), [id]);

  const [analyzing, setAnalyzing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const autoStarted = useRef(false);

  useEffect(() => {
    if (!analyzing) return;
    setStepIndex(0);
    const timer = window.setInterval(() => setStepIndex((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), 4000);
    return () => window.clearInterval(timer);
  }, [analyzing]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await api.analyzeProject(id);
      setResult(res);
      analyses.refetch();
      notify('Análise concluída', 'success');
    } catch (err) {
      notify(toApiError(err).message, 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    const state = location.state as { autoAnalyze?: boolean } | null;
    if (state?.autoAnalyze && project.data && !autoStarted.current) {
      autoStarted.current = true;
      navigate(location.pathname, { replace: true, state: null });
      void runAnalysis();
    }
  }, [project.data, location.state, navigate, location.pathname]);

  const history = useMemo(
    () => [...(analyses.data?.analyses ?? [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [analyses.data],
  );

  const current: ScoreView | null = result ? fromResponse(result) : history.length > 0 ? fromAnalysis(history[history.length - 1]) : null;
  const topFiles = useMemo(
    () => [...(result?.metrics.fileMetrics ?? [])].sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity).slice(0, 5),
    [result],
  );

  if (project.loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner text="Carregando projeto..." />
      </div>
    );
  }

  if (project.error || !project.data) {
    const status = project.error?.status;
    const message = status === 404 ? 'Projeto não encontrado' : status && status >= 500 ? 'Erro interno do servidor' : (project.error?.message ?? 'Projeto não encontrado');
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white">{message}</h1>
        <p className="mt-2 text-slate-400">Volte ao dashboard para escolher outro projeto.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/dashboard" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-primary-hover">
            Voltar ao dashboard
          </Link>
          {status !== 404 && (
            <Button variant="secondary" onClick={project.refetch}>
              Tentar novamente
            </Button>
          )}
        </div>
      </div>
    );
  }

  const p = project.data.project;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <div className="animate-fade-in-up">
        <Link to="/dashboard" className="text-sm text-slate-400 transition-colors hover:text-white">
          ← Projetos
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold text-white">{p.name}</h1>
            <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate font-mono text-sm text-accent hover:underline">
              {p.github_url}
            </a>
            {p.description && <p className="mt-2 max-w-2xl text-slate-400">{p.description}</p>}
          </div>
          <Button size="lg" onClick={runAnalysis} loading={analyzing}>
            {analyzing ? 'Analisando...' : history.length > 0 || result ? 'Analisar novamente' : 'Analisar'}
          </Button>
        </div>
      </div>

      {analyzing && (
        <Card className="animate-fade-in-up">
          <Spinner text={ANALYSIS_STEPS[stepIndex]} />
          <ol className="mt-4 space-y-2 text-sm" aria-label="Etapas da análise">
            {ANALYSIS_STEPS.map((s, i) => (
              <li key={s} className={`transition-colors duration-300 ${i < stepIndex ? 'text-green-400' : i === stepIndex ? 'text-white' : 'text-slate-600'}`}>
                {i < stepIndex ? '✓ ' : ''}
                {s}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-slate-500">Repositórios grandes podem levar alguns minutos.</p>
        </Card>
      )}

      {!analyzing && current && (
        <section aria-labelledby="result" className="space-y-4 animate-fade-in-up">
          <h2 id="result" className="text-xl font-semibold text-white">
            {result ? 'Resultado da análise' : 'Última análise'}
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <ScoreBar score={current.overall} label="Score geral" size="lg" />
              <div className="mt-5 space-y-4">
                <ScoreBar score={current.architecture} label="Architecture" />
                <ScoreBar score={current.security} label="Security" />
                <ScoreBar score={current.performance} label="Performance" />
                <ScoreBar score={current.maintainability} label="Maintainability" />
                <ScoreBar score={current.documentation} label="Documentation" />
              </div>
            </Card>
            <Card className="border-primary/40 lg:col-span-2">
              <CardHeader>Resumo da IA</CardHeader>
              <CardContent className="whitespace-pre-line leading-relaxed">{current.summary}</CardContent>
            </Card>
          </div>

          {result && (
            <Card className="animate-fade-in-up">
              <CardHeader>Métricas detalhadas</CardHeader>
              <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                <Stat label="Arquivos" value={fmtNumber(result.metrics.totalFilesCount)} />
                <Stat label="Linhas totais" value={fmtNumber(result.metrics.totalLinesCount)} />
                <Stat label="Linhas de código" value={fmtNumber(result.metrics.totalCodeLines)} />
                <Stat label="Comentários" value={fmtNumber(result.metrics.totalCommentLines)} />
                <Stat label="Linhas em branco" value={fmtNumber(result.metrics.totalBlankLines)} />
                <Stat label="Complexidade média" value={result.metrics.avgComplexityPerFile.toFixed(1)} />
              </dl>
              {topFiles.length > 0 && (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="mb-2 text-left text-sm font-medium text-slate-300">Arquivos mais complexos</caption>
                    <thead className="text-xs text-slate-500">
                      <tr>
                        <th scope="col" className="py-2 pr-4 font-medium">Arquivo</th>
                        <th scope="col" className="py-2 pr-4 font-medium">Linhas</th>
                        <th scope="col" className="py-2 font-medium">Complexidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topFiles.map((f) => (
                        <tr key={f.filePath} className="border-t border-border transition-colors hover:bg-surface">
                          <td className="max-w-[24rem] truncate py-2 pr-4 font-mono text-xs text-slate-300">{f.filePath}</td>
                          <td className="py-2 pr-4 font-mono">{fmtNumber(f.totalLines)}</td>
                          <td className="py-2 font-mono">{f.cyclomaticComplexity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </section>
      )}

      <section aria-labelledby="history" className="space-y-4 animate-fade-in-up">
        <h2 id="history" className="text-xl font-semibold text-white">
          Histórico de Análises
        </h2>
        {analyses.loading ? (
          <Spinner text="Carregando histórico..." />
        ) : analyses.error ? (
          <Card>
            <p className="text-red-400">{analyses.error.message}</p>
            <Button variant="secondary" className="mt-3" onClick={analyses.refetch}>
              Tentar novamente
            </Button>
          </Card>
        ) : history.length === 0 ? (
          <Card className="py-10 text-center text-slate-400">Nenhuma análise ainda. Clique em "Analisar" para gerar a primeira.</Card>
        ) : (
          <>
            <Card>
              <CardHeader className="text-base">Evolução do score</CardHeader>
              <div className="flex h-44 items-end gap-2 overflow-x-auto pb-1" role="img" aria-label={`Gráfico de evolução do score com ${history.length} análises`}>
                {history.slice(-14).map((a) => {
                  const tone = scoreTone(a.score);
                  const color = tone === 'red' ? 'bg-red-400' : tone === 'yellow' ? 'bg-yellow-400' : 'bg-green-400';
                  return (
                    <div key={a.id} className="flex h-full min-w-[2.5rem] flex-1 flex-col justify-end text-center" title={`${fmtDateTime(a.created_at)} — score ${a.score}`}>
                      <span className="mb-1 font-mono text-xs text-slate-300">{Math.round(a.score)}</span>
                      <div className={`w-full rounded-t ${color} transition-all duration-500`} style={{ height: `${Math.max(4, a.score) * 0.8}%` }} />
                      <span className="mt-1 truncate text-[10px] text-slate-500">
                        {new Date(a.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
            <ul className="space-y-3">
              {[...history].reverse().map((a, i) => (
                <li key={a.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <Card hover className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm text-slate-400">{fmtDateTime(a.created_at)}</span>
                      <Badge tone={scoreTone(a.score)}>Score {Math.round(a.score)}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs text-slate-300">
                      <span className="rounded bg-background px-2 py-1">Arch {Math.round(a.architecture_score)}</span>
                      <span className="rounded bg-background px-2 py-1">Sec {Math.round(a.security_score)}</span>
                      <span className="rounded bg-background px-2 py-1">Perf {Math.round(a.performance_score)}</span>
                      <span className="rounded bg-background px-2 py-1">Maint {Math.round(a.maintainability_score)}</span>
                      <span className="rounded bg-background px-2 py-1">Docs {Math.round(a.documentation_score)}</span>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
