import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, toApiError } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/ui/Toast';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { VirtualList } from '../components/ui/VirtualList';
import { ModelSelector, Reveal, SEVERITIES } from '../components/anim';
import type { Analysis, CodeLine, Issue, Severity } from '../types';

const SEVERITY_STYLE: Record<
  Severity,
  { label: string; tone: 'red' | 'yellow' | 'primary' | 'neutral' | 'purple'; bar: string; row: string; dot: string }
> = {
  critical: {
    label: 'Crítico', tone: 'red', bar: '#ef4444',
    row: 'bg-red-500/[0.09]', dot: 'bg-red-400',
  },
  high: {
    label: 'Alto', tone: 'yellow', bar: '#f97316',
    row: 'bg-orange-500/[0.08]', dot: 'bg-orange-400',
  },
  medium: {
    label: 'Médio', tone: 'primary', bar: '#6366f1',
    row: 'bg-indigo-500/[0.08]', dot: 'bg-indigo-400',
  },
  low: {
    label: 'Baixo', tone: 'neutral', bar: '#64748b',
    row: 'bg-slate-500/[0.07]', dot: 'bg-slate-400',
  },
  info: {
    label: 'Info', tone: 'purple', bar: '#a855f7',
    row: 'bg-purple-500/[0.07]', dot: 'bg-purple-400',
  },
};

const LINE_HEIGHT = 22;
const severityFromWeight = (w: number | null): Severity | null => {
  if (!w) return null;
  return w >= 5 ? 'critical' : w === 4 ? 'high' : w === 3 ? 'medium' : w === 2 ? 'low' : 'info';
};

export default function CodeExplorer() {
  const { id = '' } = useParams<{ id: string }>();
  const { notify } = useToast();

  const analyses = useApi(() => api.listAnalyses(id), [id]);
  const latest: Analysis | undefined = analyses.data?.analyses?.[0];

  const [analysisId, setAnalysisId] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [filter, setFilter] = useState<Severity | 'all'>('all');
  const [onlyWithAI, setOnlyWithAI] = useState(false);
  const [search, setSearch] = useState('');
  const [explaining, setExplaining] = useState(false);
  const [model, setModel] = useState('');

  // Adota a análise mais recente assim que a lista carrega.
  useEffect(() => {
    if (!analysisId && latest) setAnalysisId(latest.id);
  }, [latest, analysisId]);

  const filesQuery = useApi(
    () => (analysisId ? api.analyzedFiles(id, analysisId) : Promise.resolve(null)),
    [id, analysisId],
  );

  const files = filesQuery.data?.files ?? [];

  // Seleciona o arquivo mais crítico por padrão.
  useEffect(() => {
    if (!selectedFile && files.length) setSelectedFile(files[0].file_path);
  }, [files, selectedFile]);

  const fileQuery = useApi(
    () =>
      analysisId && selectedFile
        ? api.fileContent(id, analysisId, selectedFile)
        : Promise.resolve(null),
    [id, analysisId, selectedFile],
  );

  const reloadFile = useCallback(() => {
    if (analysisId && selectedFile) void fileQuery.refetch();
  }, [analysisId, selectedFile, fileQuery]);

  const visibleLines: CodeLine[] = useMemo(() => {
    const lines = fileQuery.data?.lines ?? [];
    const term = search.trim().toLowerCase();

    return lines.filter((l) => {
      if (filter !== 'all' && l.severity !== filter) return false;
      if (onlyWithAI && !l.findings.some((f) => f.ai_comment)) return false;
      if (term && !l.text.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [fileQuery.data, filter, search, onlyWithAI]);

  // Quantas linhas do arquivo têm comentário da IA.
  const aiCoverage = useMemo(() => {
    const lines = fileQuery.data?.lines ?? [];
    const flagged = lines.filter((l) => l.findings.length > 0);
    const explained = flagged.filter((l) => l.findings.some((f) => f.ai_comment));
    return {
      total: lines.length,
      flagged: flagged.length,
      explained: explained.length,
      firstExplained: explained[0]?.number ?? null,
    };
  }, [fileQuery.data]);

  // Ao trocar de filtro, um filtro de arquivo faz a lista mudar de tamanho.
  useEffect(() => {
    setSelectedLine(null);
  }, [filter, search, selectedFile, onlyWithAI]);

  const activeFinding: Issue | null = useMemo(() => {
    if (selectedLine == null) return null;
    const line = fileQuery.data?.lines?.find((l) => l.number === selectedLine);
    return line?.findings?.[0] ?? null;
  }, [selectedLine, fileQuery.data]);

  const scrollToLine = useCallback((n: number) => {
    setSelectedLine(n);
    const target = document.getElementById(`code-line-${n}`);
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, []);

  const runExplain = async () => {
    if (!analysisId) return;
    setExplaining(true);
    try {
      const r = await api.explainFindings(id, analysisId, model || undefined, 20);
      notify(
        r.explained > 0
          ? `${r.explained} achado${r.explained > 1 ? 's' : ''} explicado${r.explained > 1 ? 's' : ''} pela IA`
          : 'Nenhum achado pendente de comentário',
        'success',
      );

      filesQuery.refetch();
      reloadFile();

      // Mostra o resultado imediatamente: vai para a primeira linha que
      // acabou de ser explicada.
      if (r.explained > 0) {
        setFilter('all');
        setOnlyWithAI(false);
        await new Promise((res) => setTimeout(res, 400));
        try {
          const page = await api.listIssues(id, analysisId, { limit: 1 });
          if (page.issues[0]) {
            setSelectedFile(page.issues[0].file);
          }
        } catch {
          // mantém o arquivo atual se a leitura falhar
        }
      }
    } catch (err) {
      notify(toApiError(err).message, 'error');
    } finally {
      setExplaining(false);
    }
  };

  if (analyses.loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner text="Carregando análises..." />
      </div>
    );
  }

  if (!latest) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <Reveal from="blur" duration={800}>
          <h1 className="text-2xl font-bold text-white">Nenhuma análise ainda</h1>
          <p className="mt-3 text-slate-400">
            Rode uma análise no projeto para liberar a visualização de código.
          </p>
          <Link
            to={`/projects/${id}`}
            className="mt-7 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Ir para o projeto
          </Link>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-10 sm:px-6">
      {/* ------------------------------------------------------ cabeçalho */}
      <Reveal from="top" duration={700}>
        <Link
          to={`/projects/${id}`}
          className="group inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          Projeto
        </Link>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-white sm:text-3xl">
              Análise de código
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Cada linha marcada por severidade. Passe o mouse ou clique para ver o detalhe.
            </p>
          </div>

          {filesQuery.data && filesQuery.data.pendingComments > 0 && (
            <Button onClick={runExplain} loading={explaining} className="hover-sheen">
              Explicar com IA ({filesQuery.data.pendingComments})
            </Button>
          )}
        </div>
      </Reveal>

      {/* ------------------------------------------------------ seletor IA */}
      {filesQuery.data && filesQuery.data.pendingComments > 0 && (
        <Reveal from="bottom" delay={80} duration={600}>
          <div className="max-w-sm">
            <ModelSelector value={model} onChange={setModel} disabled={explaining} />
          </div>
        </Reveal>
      )}

      {/* -------------------------------------------- layout principal */}
      {/* Altura definida: sem isso o VirtualList não recebe um limite
          concreto e a área de rolagem do código não funciona. */}
      <div
        className="grid gap-5 lg:h-[calc(100vh-15rem)] lg:grid-cols-[280px_minmax(0,1fr)_340px]"
      >
        {/* -------- lista de arquivos -------- */}
        <Reveal from="left" delay={120} duration={800} className="lg:min-h-0">
          <div className="depth-card flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface/60 p-3">
            <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Arquivos com achados
            </p>

            {filesQuery.loading ? (
              <div className="px-2 py-6 text-center">
                <Spinner text="..." />
              </div>
            ) : files.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-slate-500">
                Nenhum arquivo com achados.
              </p>
            ) : (
              <ul className="mt-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
                {files.map((f) => {
                  const sev = severityFromWeight(f.worst);
                  const active = f.file_path === selectedFile;
                  return (
                    <li key={f.file_path}>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(f.file_path)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-200 ${
                          active ? 'bg-primary/15' : 'hover:bg-surface'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            sev ? SEVERITY_STYLE[sev].dot : 'bg-slate-600'
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-mono text-[11px] text-slate-200">
                            {f.file_path.split('/').pop()}
                          </span>
                          <span className="block truncate text-[10px] text-slate-500">
                            {f.file_path}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-400">
                          {f.findings}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Reveal>

        {/* -------- visor de código -------- */}
        <Reveal from="scale" delay={180} duration={800} className="lg:min-h-0">
          <div className="depth-card flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface/60">
            {/* barra do arquivo + filtros */}
            <div className="shrink-0 border-b border-border px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate font-mono text-xs text-slate-300">{selectedFile}</p>
                {fileQuery.data && (
                  <p className="shrink-0 font-mono text-[10px] tabular-nums text-slate-500">
                    {aiCoverage.explained > 0 ? (
                      <span className="text-accent">
                        IA: {aiCoverage.explained} de {aiCoverage.flagged} linhas
                      </span>
                    ) : (
                      <span>
                        {aiCoverage.flagged} de {aiCoverage.total} linhas marcadas
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="filtrar linhas..."
                  className="min-w-[140px] flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-primary/60 focus:outline-none"
                />
                <button
                  onClick={() => setFilter('all')}
                  className={`rounded-lg border px-2 py-1 text-[11px] transition ${
                    filter === 'all'
                      ? 'border-primary/60 bg-primary/15 text-white'
                      : 'border-border text-slate-400 hover:text-white'
                  }`}
                >
                  todas
                </button>
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition"
                    style={{
                      borderColor: filter === s ? SEVERITY_STYLE[s].bar : 'var(--border-color)',
                      color: filter === s ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_STYLE[s].dot}`} />
                    {SEVERITY_STYLE[s].label}
                  </button>
                ))}
                {aiCoverage.explained > 0 && (
                  <button
                    onClick={() => {
                      setOnlyWithAI((v) => !v);
                      if (!onlyWithAI && aiCoverage.firstExplained) {
                        scrollToLine(aiCoverage.firstExplained);
                      }
                    }}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition ${
                      onlyWithAI
                        ? 'border-accent/60 bg-accent/15 text-white'
                        : 'border-border text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-accent">✦</span>
                    com IA
                  </button>
                )}
              </div>
            </div>

            {/* corpo rolável */}
            {fileQuery.loading ? (
              <div className="flex min-h-0 flex-1 items-center justify-center">
                <Spinner text="Carregando arquivo..." />
              </div>
            ) : visibleLines.length === 0 ? (
              <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-sm text-slate-500">
                {fileQuery.data ? 'Nenhuma linha com esse filtro.' : 'Selecione um arquivo.'}
              </div>
            ) : (
              <div className="min-h-0 flex-1">
                <VirtualList
                  items={visibleLines}
                  itemHeight={LINE_HEIGHT}
                  overscan={25}
                  renderItem={(line) => (
                    <CodeRow
                      line={line}
                      active={selectedLine === line.number}
                      onSelect={() => setSelectedLine(line.number)}
                      onJumpAi={() => {
                        if (aiCoverage.firstExplained) scrollToLine(aiCoverage.firstExplained);
                      }}
                    />
                  )}
                />
              </div>
            )}
          </div>
        </Reveal>

        {/* -------- painel de detalhe -------- */}
        <Reveal from="right" delay={240} duration={800} className="lg:min-h-0">
          <div className="depth-card flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface/60 p-4">
            <div className="min-h-0 flex-1 overflow-y-auto">
              {activeFinding ? (
                <FindingDetail finding={activeFinding} />
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-400">
                    Clique numa linha marcada para ver a análise.
                  </p>
                  <p className="mt-2 text-xs text-slate-600">
                    O painel mostra a regra, o impacto e o comentário da IA.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- linha de código */

function CodeRow({
  line,
  active,
  onSelect,
  onJumpAi,
}: {
  line: CodeLine;
  active: boolean;
  onSelect: () => void;
  onJumpAi: () => void;
}) {
  const style = line.severity ? SEVERITY_STYLE[line.severity] : null;
  const hasAi = line.findings.some((f) => f.ai_comment);

  return (
    <div
      id={`code-line-${line.number}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      title={line.findings[0]?.title}
      className={`flex h-[22px] cursor-pointer items-center font-mono text-[12px] leading-none transition-colors duration-150 ${
        style ? style.row : ''
      } ${active ? 'bg-primary/20' : 'hover:bg-white/[0.03]'}`}
      style={active ? { boxShadow: 'inset 2px 0 0 var(--accent-primary)' } : undefined}
    >
      {/* gutter */}
      <span className="flex w-14 shrink-0 select-none items-center justify-end gap-1.5 pr-2 text-[10px] tabular-nums text-slate-600">
        {line.findings.length > 0 && (
          <span
            className={`h-1.5 w-1.5 rounded-full ${style?.dot ?? 'bg-slate-600'}`}
            aria-hidden="true"
          />
        )}
        {hasAi && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onJumpAi();
            }}
            title="Esta linha tem comentário da IA"
            className="text-accent transition-transform duration-200 hover:scale-125"
            aria-label={`Linha ${line.number} tem comentário da IA`}
          >
            ✦
          </button>
        )}
        {line.number}
      </span>

      {/* faixa de severidade */}
      <span
        className="h-[22px] w-[3px] shrink-0"
        style={{ background: style?.bar ?? 'transparent' }}
        aria-hidden="true"
      />

      <span className="whitespace-pre pl-3 text-slate-300">{line.text}</span>
    </div>
  );
}

/* ------------------------------------------------------------ painel detalhe */

function FindingDetail({ finding }: { finding: Issue }) {
  const style = SEVERITY_STYLE[finding.severity] ?? SEVERITY_STYLE.info;

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
        <Badge tone={style.tone}>{style.label}</Badge>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-white">{finding.title}</h3>
      <p className="mt-1 font-mono text-[11px] text-accent">
        {finding.file}:{finding.line}
        <span className="ml-2 text-slate-600">{finding.rule_id}</span>
      </p>

      {finding.snippet && (
        <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-background/70 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
          <code>{finding.snippet}</code>
        </pre>
      )}

      {finding.description && (
        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            O problema
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
            {finding.description}
          </p>
        </div>
      )}

      {finding.suggestion && (
        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Sugestão
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
            {finding.suggestion}
          </p>
        </div>
      )}

<div className="mt-5 border-t border-border pt-4">
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
          <span aria-hidden="true">✦</span>
          Comentário da IA
        </p>
        {finding.ai_comment ? (
          <div
            className="mt-2 rounded-lg border border-primary/30 bg-primary/[0.08] p-3"
            style={{ animation: 'blurIn 320ms var(--ease-out)' }}
          >
            <p className="text-xs leading-relaxed text-slate-100">{finding.ai_comment}</p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            Esta linha ainda não foi comentada. Use o botão "Explicar com IA" no topo.
          </p>
        )}
      </div>
    </div>
  );
}