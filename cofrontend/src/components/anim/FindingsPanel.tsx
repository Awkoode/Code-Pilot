import { useMemo } from 'react';
import { Badge } from '../ui/Badge';
import { CountUp } from './CountUp';
import type { CriticalFile, Issue, Severity } from '../../types';

const SEVERITY_META: Record<
  Severity,
  { label: string; tone: 'red' | 'yellow' | 'primary' | 'neutral' | 'purple'; bar: string }
> = {
  critical: { label: 'Crítico', tone: 'red', bar: 'linear-gradient(90deg,#ef4444,#f87171)' },
  high: { label: 'Alto', tone: 'yellow', bar: 'linear-gradient(90deg,#f97316,#fb923c)' },
  medium: { label: 'Médio', tone: 'primary', bar: 'linear-gradient(90deg,#6366f1,#818cf8)' },
  low: { label: 'Baixo', tone: 'neutral', bar: 'linear-gradient(90deg,#64748b,#94a3b8)' },
  info: { label: 'Info', tone: 'purple', bar: 'linear-gradient(90deg,#a855f7,#c084fc)' },
};

export const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

/** ---------------------------------------------------------------- resumo */

interface FindingsOverviewProps {
  total: number;
  bySeverity: Record<string, number>;
  filesAffected: number;
}

export function FindingsOverview({ total, bySeverity, filesAffected }: FindingsOverviewProps) {
  const max = Math.max(1, ...SEVERITIES.map((s) => bySeverity[s] ?? 0));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-4xl font-bold tabular-nums text-white">
            <CountUp value={total} />
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
            achados em <CountUp value={filesAffected} /> arquivos
          </p>
        </div>
        <p className="max-w-xs text-xs leading-relaxed text-slate-500">
          Detectado por regras determinísticas, sem IA. Cobre todas as linhas do
          repositório.
        </p>
      </div>

      <div className="mt-5 space-y-2">
        {SEVERITIES.map((sev) => {
          const count = bySeverity[sev] ?? 0;
          const meta = SEVERITY_META[sev];
          return (
            <div key={sev} className="flex items-center gap-3">
              <span className="w-16 shrink-0 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                {meta.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/50">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${(count / max) * 100}%`,
                    background: meta.bar,
                    opacity: count > 0 ? 1 : 0,
                  }}
                />
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-slate-300">
                <CountUp value={count} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** ------------------------------------------------------ arquivos críticos */

interface CriticalFilesProps {
  files: CriticalFile[];
}

export function CriticalFilesList({ files }: CriticalFilesProps) {
  if (!files.length) return null;
  const max = Math.max(...files.map((f) => f.findings), 1);

  return (
    <ul className="space-y-2">
      {files.map((f) => {
        const meta = SEVERITY_META[f.worstSeverity];
        return (
          <li
            key={f.path}
            className="group flex items-center gap-3 rounded-xl border border-border bg-surface/60 px-3.5 py-2.5 transition-all duration-300 hover:border-primary/50 hover:bg-surface"
          >
            <span
              className="h-8 w-1 shrink-0 rounded-full"
              style={{ background: meta.bar }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono text-xs text-slate-200">{f.path}</span>
              <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                {f.topRules.join(' · ')}
              </span>
            </span>
            <span className="hidden shrink-0 sm:block">
              <Badge tone={meta.tone}>{meta.label}</Badge>
            </span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-slate-400">
              <CountUp value={f.findings} />
            </span>
            <span
              className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-border/50"
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full transition-all duration-1000"
                style={{ width: `${(f.findings / max) * 100}%`, background: meta.bar }}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** -------------------------------------------------------- lista de achados */

interface IssueListProps {
  issues: Issue[];
  total: number;
  filter: Severity | 'all';
  onFilter: (s: Severity | 'all') => void;
  bySeverity: Record<string, number>;
}

export function IssueList({ issues, total, filter, onFilter, bySeverity }: IssueListProps) {
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: total };
    for (const s of SEVERITIES) map[s] = bySeverity[s] ?? 0;
    return map;
  }, [total, bySeverity]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip
          active={filter === 'all'}
          onClick={() => onFilter('all')}
          label="Todos"
          count={counts.all}
        />
        {SEVERITIES.map((s) => (
          <FilterChip
            key={s}
            active={filter === s}
            onClick={() => onFilter(s)}
            label={SEVERITY_META[s].label}
            count={counts[s]}
            disabled={!counts[s]}
          />
        ))}
      </div>

      {issues.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface/60 py-10 text-center text-sm text-slate-400">
          Nenhum achado com esse filtro.
        </p>
      ) : (
        <ul className="space-y-2">
          {issues.map((issue) => {
            const meta = SEVERITY_META[issue.severity] ?? SEVERITY_META.info;
            return (
              <li
                key={issue.id}
                className="overflow-hidden rounded-xl border border-border bg-surface/60 transition-all duration-300 hover:border-primary/40"
              >
                <div className="flex items-start gap-3 px-3.5 py-2.5">
                  <span
                    className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: meta.bar }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-white">{issue.title}</span>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    <p className="mt-1 truncate font-mono text-[11px] text-accent">
                      {issue.file}:{issue.line}
                      <span className="ml-2 text-slate-600">{issue.rule_id}</span>
                    </p>
                    {issue.snippet && (
                      <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-background/70 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-300">
                        <code>{issue.snippet}</code>
                      </pre>
                    )}
                    {issue.description && (
                      <p className="mt-2 text-xs leading-relaxed text-slate-400">
                        {issue.description}
                      </p>
                    )}
                    {issue.suggestion && (
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                        <span className="font-medium text-slate-400">Sugestão:</span>{' '}
                        {issue.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  disabled = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'border-primary/60 bg-primary/15 text-white'
          : 'border-border text-slate-400 hover:border-primary/40 hover:text-white'
      }`}
    >
      {label}
      <span className="font-mono tabular-nums opacity-70">{count}</span>
    </button>
  );
}