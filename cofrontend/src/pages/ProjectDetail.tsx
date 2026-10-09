import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, toApiError } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/ui/Toast';
import { Badge, scoreTone } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import {
  CountUp,
  CriticalFilesList,
  FindingsOverview,
  GlowScoreBar,
  IssueList,
  ModelSelector,
  Reveal,
  Tilt,
} from '../components/anim';
import type { AnalyzeResponse, Analysis, IssuesPage, Severity } from '../types';

const ANALYSIS_STEPS = [
  'Baixando repositório...',
  'Calculando métricas...',
  'Gerando relatório com IA...',
];

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
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const BAR_COLORS = {
  red: 'linear-gradient(180deg, #f87171, #ef4444)',
  yellow: 'linear-gradient(180deg, #facc15, #eab308)',
  green: 'linear-gradient(180deg, #4ade80, #22c55e)',
} as const;

const GLOWS = {
  red: 'rgba(239, 68, 68, 0.45)',
  yellow: 'rgba(234, 179, 8, 0.45)',
  green: 'rgba(34, 197, 94, 0.45)',
} as const;

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
  const [selectedModel, setSelectedModel] = useState('');
  const [issueFilter, setIssueFilter] = useState<Severity | 'all'>('all');
  const [issuePage, setIssuePage] = useState<IssuesPage | null>(null);
  const autoStarted = useRef(false);

  // Recarrega os achados quando a análise termina ou o filtro muda.
  const loadIssues = useCallback(async () => {
    if (!result) return;
    try {
      const page = await api.listIssues(id, result.analysisId, {
        severity: issueFilter === 'all' ? undefined : issueFilter,
        limit: 50,
      });
      setIssuePage(page);
    } catch {
      setIssuePage(null);
    }
  }, [id, result, issueFilter]);

  useEffect(() => {
    void loadIssues();
  }, [loadIssues]);

  useEffect(() => {
    if (!analyzing) return;
    setStepIndex(0);
    const timer = window.setInterval(
      () => setStepIndex((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)),
      4000,
    );
    return () => window.clearInterval(timer);
  }, [analyzing]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await api.analyzeProject(id, selectedModel || undefined);
      setResult(res);
      analyses.refetch();
      notify(
        res.aiReport.usedFallback
          ? 'Análise concluída (IA indisponível, usamos as métricas)'
          : 'Análise concluída',
        res.aiReport.usedFallback ? 'warning' : 'success',
      );
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
    () =>
      [...(analyses.data?.analyses ?? [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [analyses.data],
  );

  const current: ScoreView | null = result
    ? fromResponse(result)
    : history.length > 0
      ? fromAnalysis(history[history.length - 1])
      : null;

  const topFiles = useMemo(
    () =>
      [...(result?.metrics.fileMetrics ?? [])]
        .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
        .slice(0, 5),
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
    const message =
      status === 404
        ? 'Projeto não encontrado'
        : status && status >= 500
          ? 'Erro interno do servidor'
          : (project.error?.message ?? 'Projeto não encontrado');
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <Reveal from="blur" duration={900}>
          <p className="text-animated-gradient font-mono text-7xl font-bold">404</p>
          <h1 className="mt-5 text-2xl font-bold text-text-primary">{message}</h1>
          <p className="mt-3 text-slate-400">
            Volte ao dashboard para escolher outro projeto.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-text-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30"
            >
              Voltar ao dashboard
            </Link>
            {status !== 404 && (
              <Button variant="secondary" onClick={project.refetch}>
                Tentar novamente
              </Button>
            )}
          </div>
        </Reveal>
      </div>
    );
  }

  const p = project.data.project;
  const overallTone: 'red' | 'yellow' | 'green' = current ? scoreTone(current.overall) : 'green';

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6">
      {/* ---------------- HEADER ---------------- */}
      <Reveal from="top" duration={900}>
        <Link
          to="/dashboard"
          className="group inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-text-primary"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          Projetos
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold text-text-primary sm:text-4xl">{p.name}</h1>
            <a
              href={p.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block truncate font-mono text-sm text-accent hover:underline"
            >
              {p.github_url}
            </a>
            {p.description && <p className="mt-3 max-w-2xl text-slate-400">{p.description}</p>}
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-72">
            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              disabled={analyzing}
            />
            <div className="flex gap-2">
              <Link
                to={`/projects/${id}/code`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:text-white"
              >
                <span className="text-accent">◫</span>
                Ver código
              </Link>
              <Button
                size="lg"
                onClick={runAnalysis}
                loading={analyzing}
                className="hover-sheen flex-1"
              >
                {analyzing
                  ? 'Analisando...'
                  : history.length > 0 || result
                    ? 'Analisar novamente'
                    : 'Analisar'}
              </Button>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ---------------- LOADING ---------------- */}
      {analyzing && (
        <Reveal from="scale" duration={700}>
          <Card className="depth-card edge-glow overflow-visible">
            <div className="flex items-center gap-4">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                <span className="pulse-ring" />
                <span className="pulse-ring" style={{ animationDelay: '0.8s' }} />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-accent">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" className="opacity-25" />
                    <path
                      d="M22 12a10 10 0 0 0-10-10"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </span>
              <div>
                <p className="font-medium text-text-primary">{ANALYSIS_STEPS[stepIndex]}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Repositórios grandes podem levar alguns minutos.
                </p>
              </div>
            </div>

            <ol className="mt-6 space-y-3" aria-label="Etapas da análise">
              {ANALYSIS_STEPS.map((s, i) => (
                <li
                  key={s}
                  className="flex items-center gap-3 text-sm transition-all duration-500"
                  style={{ opacity: i <= stepIndex ? 1 : 0.32 }}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-mono transition-all duration-500"
                    style={{
                      borderColor:
                        i < stepIndex
                          ? 'var(--success-color)'
                          : i === stepIndex
                            ? 'var(--accent-primary)'
                            : 'var(--border-color)',
                      backgroundColor:
                        i < stepIndex ? 'rgba(34,197,94,0.15)' : 'transparent',
                      color: i < stepIndex ? 'var(--success-color)' : 'inherit',
                    }}
                  >
                    {i < stepIndex ? '✓' : i + 1}
                  </span>
                  <span
                    className={
                      i < stepIndex
                        ? 'text-green-400'
                        : i === stepIndex
                          ? 'text-text-primary'
                          : 'text-slate-600'
                    }
                  >
                    {s}
                  </span>
                  {i === stepIndex && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--accent-glow)] animate-pulse" />
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-border/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 shadow-[0_0_14px_var(--accent-glow)]"
                style={{
                  width: `${((stepIndex + 1) / ANALYSIS_STEPS.length) * 100}%`,
                  transition: 'width 1200ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>
          </Card>
        </Reveal>
      )}

      {/* ---------------- RESULTADO ---------------- */}
      {!analyzing && current && (
        <section aria-labelledby="result" className="space-y-6">
          <Reveal from="left">
            <h2 id="result" className="text-xl font-semibold text-text-primary">
              {result ? 'Resultado da análise' : 'Última análise'}
            </h2>
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-3">
            <Reveal from="flip" delay={80} distance={70} duration={1000}>
              <Tilt intensity={8} lift={18} className="h-full">
                <div className="depth-card relative h-full overflow-hidden rounded-2xl border border-border bg-surface/70 p-6 backdrop-blur-sm">
                  <div
                    className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl"
                    style={{ background: GLOWS[overallTone], opacity: 0.35 }}
                  />

                  <div className="relative text-center">
                    <p className="font-mono text-6xl font-bold tabular-nums text-text-primary">
                      <CountUp value={current.overall} startOnView={false} />
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                      Score geral
                    </p>
                    <div className="mt-4 flex justify-center">
                      <Badge tone={scoreTone(current.overall)} pulse>
                        {current.overall >= 70 ? 'Saudável' : current.overall >= 40 ? 'Atenção' : 'Crítico'}
                      </Badge>
                    </div>
                  </div>

                  <div className="relative mt-7 space-y-4">
                    <GlowScoreBar score={current.architecture} label="Arquitetura" />
                    <GlowScoreBar score={current.security} label="Segurança" />
                    <GlowScoreBar score={current.performance} label="Performance" />
                    <GlowScoreBar score={current.maintainability} label="Manutenibilidade" />
                    <GlowScoreBar score={current.documentation} label="Documentação" />
                  </div>
                </div>
              </Tilt>
            </Reveal>

            <Reveal from="flip" delay={200} distance={70} duration={1000} className="lg:col-span-2">
              <Tilt intensity={6} lift={14} className="h-full">
                <div className="depth-card edge-glow-subtle relative h-full overflow-visible rounded-2xl border border-primary/30 bg-surface/70 p-7 backdrop-blur-sm">
                  <CardHeader className="flex flex-wrap items-center gap-3">
                    <span className="text-accent">✦</span>
                    Resumo da IA
                    {result && (
                      <span className="ml-auto flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                          {result.aiReport.model}
                        </span>
                        {result.aiReport.usedFallback && (
                          <Badge tone="yellow">fallback determinístico</Badge>
                        )}
                      </span>
                    )}
                  </CardHeader>
                  <CardContent className="relative whitespace-pre-line leading-relaxed text-slate-300">
                    {current.summary}
                  </CardContent>
                </div>
              </Tilt>
            </Reveal>
          </div>

          {result && (
            <Reveal from="bottom" delay={120} duration={1000}>
              <Card className="depth-card">
                <CardHeader>Achados por linha</CardHeader>

                <FindingsOverview
                  total={result.findings.total}
                  bySeverity={result.findings.bySeverity}
                  filesAffected={result.findings.filesAffected}
                />

                {result.findings.criticalFiles.length > 0 && (
                  <div className="mt-7">
                    <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
                      Arquivos mais críticos
                    </p>
                    <CriticalFilesList files={result.findings.criticalFiles} />
                  </div>
                )}

                <div className="mt-7 border-t border-border pt-6">
                  <IssueList
                    issues={issuePage?.issues ?? []}
                    total={issuePage?.total ?? result.findings.total}
                    filter={issueFilter}
                    onFilter={setIssueFilter}
                    bySeverity={result.findings.bySeverity}
                  />
                </div>
              </Card>
            </Reveal>
          )}

          {result && (
            <Reveal from="bottom" delay={120} duration={1000}>
              <Card className="depth-card">
                <CardHeader>Métricas determinísticas</CardHeader>

                <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                  <Stat label="Arquivos" value={result.metrics.totalFilesCount} />
                  <Stat label="Linhas totais" value={result.metrics.totalLinesCount} />
                  <Stat label="Linhas de código" value={result.metrics.totalCodeLines} />
                  <Stat label="Comentários" value={result.metrics.totalCommentLines} />
                  <Stat label="Linhas em branco" value={result.metrics.totalBlankLines} />
                  <Stat
                    label="Complexidade média"
                    value={result.metrics.avgComplexityPerFile}
                    decimals={1}
                  />
                </dl>

                {topFiles.length > 0 && (
                  <div className="mt-8 overflow-x-auto">
                    <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
                      Arquivos mais complexos
                    </p>
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th scope="col" className="py-2 pr-4 font-medium">
                            Arquivo
                          </th>
                          <th scope="col" className="py-2 pr-4 font-medium">
                            Linhas
                          </th>
                          <th scope="col" className="py-2 font-medium">
                            Complexidade
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {topFiles.map((f, i) => {
                          const maxComp = topFiles[0].cyclomaticComplexity || 1;
                          const tone =
                            f.cyclomaticComplexity > maxComp * 0.6 ? 'red' : 'yellow';
                          return (
                            <tr
                              key={f.filePath}
                              className="border-t border-border transition-colors hover:bg-surface"
                            >
                              <td className="max-w-[24rem] truncate py-2.5 pr-4 font-mono text-xs text-slate-300">
                                {f.filePath}
                              </td>
                              <td className="py-2.5 pr-4 font-mono tabular-nums text-slate-400">
                                {f.totalLines.toLocaleString('pt-BR')}
                              </td>
                              <td className="py-2.5">
                                <div className="flex items-center gap-3">
                                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border/50">
                                    <div
                                      className="bar-grow-x h-full rounded-full"
                                      style={{
                                        width: `${(f.cyclomaticComplexity / maxComp) * 100}%`,
                                        background: BAR_COLORS[tone],
                                        boxShadow: `0 0 10px ${GLOWS[tone]}`,
                                        animationDelay: `${i * 110 + 200}ms`,
                                      }}
                                    />
                                  </div>
                                  <span className="font-mono tabular-nums text-slate-300">
                                    {f.cyclomaticComplexity}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </Reveal>
          )}
        </section>
      )}

      {/* ---------------- HISTÓRICO ---------------- */}
      <section aria-labelledby="history" className="space-y-6">
        <Reveal from="left">
          <h2 id="history" className="text-xl font-semibold text-text-primary">
            Histórico de Análises
          </h2>
        </Reveal>

        {analyses.loading ? (
          <Spinner text="Carregando histórico..." />
        ) : analyses.error ? (
          <Card className="depth-card">
            <p className="text-red-400">{analyses.error.message}</p>
            <Button variant="secondary" className="mt-3" onClick={analyses.refetch}>
              Tentar novamente
            </Button>
          </Card>
        ) : history.length === 0 ? (
          <Card className="depth-card py-12 text-center text-slate-400">
            Nenhuma análise ainda. Clique em &quot;Analisar&quot; para gerar a primeira.
          </Card>
        ) : (
          <>
            <Reveal from="flip" distance={70} duration={1000}>
              <Card className="depth-card">
                <CardHeader className="flex items-baseline justify-between text-base">
                  <span>Evolução do score</span>
                  <span className="font-mono text-xs text-slate-500">
                    <CountUp value={history.length} /> análises
                  </span>
                </CardHeader>

                <div
                  className="flex h-52 items-end gap-2 overflow-x-auto pb-1"
                  role="img"
                  aria-label={`Gráfico de evolução do score com ${history.length} análises`}
                >
                  {history.slice(-14).map((a, i) => {
                    const tone = scoreTone(a.score);
                    return (
                      <div
                        key={a.id}
                        className="group flex h-full min-w-[2.5rem] flex-1 flex-col justify-end text-center"
                        title={`${fmtDateTime(a.created_at)} — score ${a.score}`}
                      >
                        <span className="mb-1.5 font-mono text-xs tabular-nums text-slate-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <CountUp value={a.score} startOnView={false} />
                        </span>
                        <div
                          className="bar-grow w-full rounded-t-md transition-all duration-500 group-hover:brightness-125"
                          style={{
                            height: `${Math.max(6, a.score)}%`,
                            background: BAR_COLORS[tone],
                            boxShadow: `0 0 18px ${GLOWS[tone]}`,
                            animationDelay: `${i * 80}ms`,
                          }}
                        />
                        <span className="mt-1.5 truncate font-mono text-[10px] text-slate-500">
                          {new Date(a.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Reveal>

            <ul className="space-y-3">
              {[...history].reverse().map((a, i) => (
                <Reveal key={a.id} as="li" from="right" delay={i * 90} distance={50} duration={800}>
                  <Card hover className="depth-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm text-slate-400">{fmtDateTime(a.created_at)}</span>
                      <Badge tone={scoreTone(a.score)}>Score {Math.round(a.score)}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <ScoreChip label="Arch" value={a.architecture_score} />
                      <ScoreChip label="Sec" value={a.security_score} />
                      <ScoreChip label="Perf" value={a.performance_score} />
                      <ScoreChip label="Maint" value={a.maintainability_score} />
                      <ScoreChip label="Docs" value={a.documentation_score} />
                      {a.model && (
                        <span className="rounded-md bg-background px-2 py-1 font-mono text-[10px] text-slate-500">
                          {a.model}
                        </span>
                      )}
                    </div>
                  </Card>
                </Reveal>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  decimals = 0,
}: {
  label: string;
  value: number;
  decimals?: number;
}) {
  return (
    <div className="depth-card-hover group rounded-xl border border-border bg-surface/60 px-4 py-3 transition-all duration-300 hover:border-primary/50">
      <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-text-primary">
        <CountUp value={value} decimals={decimals} />
      </dd>
    </div>
  );
}

function ScoreChip({ label, value }: { label: string; value: number }) {
  const tone = scoreTone(value);
  return (
    <span
      className="rounded-md px-2 py-1 transition-all duration-300 hover:scale-110"
      style={{
        background: 'var(--bg-primary)',
        boxShadow: `inset 0 0 0 1px ${GLOWS[tone]}`,
      }}
    >
      {label} <CountUp value={value} />
    </span>
  );
}
