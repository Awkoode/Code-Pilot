import { query, queryOne } from "../db/pool";
import { AppError } from "../utils/AppError";
import type { CreateProjectInput } from "../validators/project.validator";
import type { AIAnalysisOutput } from "./ai.service";
import type { CriticalFile, Finding } from "./codeInspector.service";

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  github_url: string;
  description: string | null;
  created_at: Date;
}

export async function createProject(userId: string, input: CreateProjectInput): Promise<ProjectRow> {
  // Evitar que o utilizador cadastre o mesmo repositório duas vezes
  const existing = await queryOne<ProjectRow>(
    "select id from projects where user_id = $1 and github_url = $2",
    [userId, input.github_url]
  );

  if (existing) {
    throw new AppError("Repositório já cadastrado na sua conta", 409, "PROJECT_ALREADY_EXISTS");
  }

  const [project] = await query<ProjectRow>(
    `insert into projects (user_id, name, github_url, description)
     values ($1, $2, $3, $4)
     returning id, user_id, name, github_url, description, created_at`,
    [userId, input.name, input.github_url, input.description ?? null]
  );

  return project;
}

export async function getUserProjects(userId: string): Promise<ProjectRow[]> {
  return query<ProjectRow>(
    "select id, user_id, name, github_url, description, created_at from projects where user_id = $1 order by created_at desc",
    [userId]
  );
}

export async function getProjectById(userId: string, projectId: string): Promise<ProjectRow> {
  const project = await queryOne<ProjectRow>(
    "select id, user_id, name, github_url, description, created_at from projects where id = $1 and user_id = $2",
    [projectId, userId]
  );

  if (!project) {
    throw new AppError("Projeto não encontrado", 404, "PROJECT_NOT_FOUND");
  }

  return project;
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  const project = await queryOne<ProjectRow>(
    "select id from projects where id = $1 and user_id = $2",
    [projectId, userId]
  );

  if (!project) {
    throw new AppError("Projeto não encontrado", 404, "PROJECT_NOT_FOUND");
  }

  await query("delete from projects where id = $1", [projectId]);
}

import { pool } from "../db/pool";

export interface AnalysisMetrics {
  healthScore: number;
  totalFilesCount: number;
  totalLinesCount: number;
  totalCodeLines: number;
  totalCommentLines: number;
  totalBlankLines: number;
  avgComplexityPerFile: number;
  fileMetrics: any[];
}

export async function saveAnalysisResult(
  projectId: string,
  metrics: AnalysisMetrics,
  aiReport?: AIAnalysisOutput
) {
  const queryText = `
    INSERT INTO analyses (
      project_id,
      score,
      architecture_score,
      security_score,
      performance_score,
      maintainability_score,
      documentation_score,
      ai_summary,
      model,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    RETURNING id, model, created_at;
  `;

  const values = [
    projectId,
    metrics.healthScore,
    aiReport?.architectureScore ?? metrics.healthScore,
    aiReport?.securityScore ?? metrics.healthScore,
    aiReport?.performanceScore ?? metrics.healthScore,
    aiReport?.maintainabilityScore ?? metrics.healthScore,
    aiReport?.documentationScore ?? metrics.healthScore,
    aiReport?.aiSummary ?? "Análise determinística efetuada pelo motor Haskell.",
    aiReport?.model ?? "openai/gpt-oss-20b",
  ];

  const { rows } = await pool.query(queryText, values);
  return rows[0];
}

export async function getProjectAnalyses(userId: string, projectId: string) {
  // Garantir que o projeto pertence ao utilizador antes de retornar o histórico
  const projectCheck = await pool.query(
    "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
    [projectId, userId]
  );

  if (projectCheck.rows.length === 0) {
    throw new AppError("Projeto não encontrado", 404, "NOT_FOUND");
  }

  const queryText = `
    SELECT 
      id,
      project_id,
      score,
      architecture_score,
      security_score,
      performance_score,
      maintainability_score,
      documentation_score,
      ai_summary,
      model,
      created_at
    FROM analyses
    WHERE project_id = $1
    ORDER BY created_at DESC;
  `;

  const { rows } = await pool.query(queryText, [projectId]);
  return rows;
}

// ---------------------------------------------------------------------------
// Achados por linha (Fase 2)
// ---------------------------------------------------------------------------

/**
 * Grava os achados do motor determinístico.
 *
 * Usa um único INSERT multi-linhas em vez de um por achado: um repositório
 * médio gera centenas de linhas, e milhares de round-trips ao Postgres
 * dominariam o tempo da análise.
 */
export async function saveFindings(
  analysisId: string,
  findings: Finding[]
): Promise<number> {
  if (findings.length === 0) return 0;

  // Lotes de 500 mantêm o payload abaixo de qualquer limite de parâmetro.
  const CHUNK = 500;
  let inserted = 0;

for (let start = 0; start < findings.length; start += CHUNK) {
    const chunk = findings.slice(start, start + CHUNK);

    const values: unknown[] = [];
    const tuples = chunk
      .map((f, i) => {
        const b = i * 9;
        values.push(
          analysisId,
          f.severity,
          f.category,
          f.ruleId,
          f.file,
          f.line,
          f.title,
          f.description,
          f.snippet,
        );
        return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9})`;
      })
      .join(",");

    // rowCount, não rows.length: INSERT sem RETURNING devolve rows vazio.
    const result = await pool.query(
      `insert into issues
         (analysis_id, severity, category, rule_id, file, line, title, description, snippet)
       values ${tuples}`,
      values,
    );

    inserted += result.rowCount ?? 0;
  }

  return inserted;
}

export async function updateCriticalFiles(
  analysisId: string,
  criticalFiles: CriticalFile[]
): Promise<void> {
  await pool.query(
    `update analyses set critical_files = $2::jsonb where id = $1`,
    [analysisId, JSON.stringify(criticalFiles)]
  );
}

export interface IssueFilters {
  severity?: string;
  category?: string;
  file?: string;
  limit?: number;
  offset?: number;
}

export async function getFindings(analysisId: string, filters: IssueFilters = {}) {
  const conditions = ["analysis_id = $1"];
  const params: unknown[] = [analysisId];
  let next = 2;

  if (filters.severity) {
    params.push(filters.severity);
    conditions.push(`severity = $${next++}`);
  }
  if (filters.category) {
    params.push(filters.category);
    conditions.push(`category = $${next++}`);
  }
  if (filters.file) {
    params.push(filters.file);
    conditions.push(`file = $${next++}`);
  }

  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
  const offset = Math.max(filters.offset ?? 0, 0);

  const where = conditions.join(" and ");

  const { rows: items } = await pool.query(
    `select id, severity, category, rule_id, file, line, title, description,
            suggestion, ai_comment
     from issues
     where ${where}
     order by
       case severity
         when 'critical' then 5
         when 'high' then 4
         when 'medium' then 3
         when 'low' then 2
         else 1
       end desc,
       file asc, line asc
     limit $${next} offset $${next + 1}`,
    [...params, limit, offset]
  );

  const { rows: totalRows } = await pool.query(
    `select count(*)::int as n from issues where ${where}`,
    params
  );

  return {
    issues: items,
    total: totalRows[0].n as number,
    limit,
    offset,
  };
}

/** Contagem por severidade/categoria/regra, para desenhar o resumo. */
export async function getFindingsSummary(analysisId: string) {
  const bySeverity = await pool.query(
    `select severity, count(*)::int as count
     from issues where analysis_id = $1
     group by severity`,
    [analysisId]
  );
  const byCategory = await pool.query(
    `select category, count(*)::int as count
     from issues where analysis_id = $1
     group by category`,
    [analysisId]
  );
  const byRule = await pool.query(
    `select rule_id, severity, count(*)::int as count
     from issues where analysis_id = $1
     group by rule_id, severity
     order by count desc
     limit 15`,
    [analysisId]
  );
  const files = await pool.query(
    `select count(distinct file)::int as n from issues where analysis_id = $1`,
    [analysisId]
  );

  return {
    bySeverity: Object.fromEntries(
      bySeverity.rows.map((r) => [r.severity, r.count])
    ) as Record<string, number>,
    byCategory: Object.fromEntries(
      byCategory.rows.map((r) => [r.category, r.count])
    ) as Record<string, number>,
    topRules: byRule.rows,
    filesAffected: files.rows[0].n as number,
  };
}

/** Confere que a análise pertence ao usuário antes de expor achados. */
export async function assertAnalysisOwnership(
  userId: string,
  analysisId: string
): Promise<void> {
  const { rows } = await pool.query(
    `select a.id
     from analyses a
     join projects p on p.id = a.project_id
     where a.id = $1 and p.user_id = $2`,
    [analysisId, userId]
  );

  if (rows.length === 0) {
    throw new AppError("Análise não encontrada", 404, "ANALYSIS_NOT_FOUND");
  }
}

// ---------------------------------------------------------------------------
// Conteúdo dos arquivos com achados (Fase 3)
// ---------------------------------------------------------------------------

/**
 * Guarda o conteúdo dos arquivos que tiveram ao menos um achado.
 *
 * Não guardamos o repositório inteiro: só o que o usuário vai inspecionar.
 * Há um teto de bytes para que um patológico repositório com achado em
 * centenas de megabytes não inflate o banco.
 */
export const MAX_STORED_BYTES = 6 * 1024 * 1024;

export interface StoreFilesResult {
  stored: number;
  truncated: boolean;
  bytes: number;
}

export async function storeAnalyzedFiles(
  analysisId: string,
  files: Array<{ relativePath: string; content: string }>,
  onlyThesePaths?: Set<string>
): Promise<StoreFilesResult> {
  const targets = onlyThesePaths
    ? files.filter((f) => onlyThesePaths.has(f.relativePath))
    : files;

  // Maior primeiro: se estourar o teto, mantemos os mais relevantes.
  const sorted = [...targets].sort(
    (a, b) => Buffer.byteLength(b.content) - Buffer.byteLength(a.content)
  );

  let bytes = 0;
  const batch: Array<{ path: string; content: string; lines: number }> = [];

  for (const f of sorted) {
    const size = Buffer.byteLength(f.content);
    if (bytes + size > MAX_STORED_BYTES) break;
    bytes += size;
    batch.push({
      path: f.relativePath,
      content: f.content,
      lines: f.content.split("\n").length,
    });
  }

  const CHUNK = 20;
  for (let i = 0; i < batch.length; i += CHUNK) {
    const slice = batch.slice(i, i + CHUNK);
    const values: unknown[] = [];
    const tuples = slice
      .map((f, k) => {
        const b = k * 4;
        values.push(analysisId, f.path, f.content, f.lines);
        return `($${b + 1},$${b + 2},$${b + 3},$${b + 4})`;
      })
      .join(",");

    await pool.query(
      `insert into analysis_files (analysis_id, file_path, content, lines_count)
       values ${tuples}
       on conflict (analysis_id, file_path) do update
         set content = excluded.content,
             lines_count = excluded.lines_count`,
      values,
    );
  }

  await pool.query("update analyses set files_stored = $2 where id = $1", [
    analysisId,
    batch.length,
  ]);

  return { stored: batch.length, truncated: bytes >= MAX_STORED_BYTES, bytes };
}

export interface FileWithFindings {
  filePath: string;
  content: string;
  linesCount: number;
}

/** Conteúdo de um arquivo específico da análise. */
export async function getAnalyzedFile(
  analysisId: string,
  filePath: string
): Promise<FileWithFindings | null> {
  const row = await pool.query(
    `select file_path, content, lines_count
     from analysis_files
     where analysis_id = $1 and file_path = $2`,
    [analysisId, filePath]
  );
  if (row.rows.length === 0) return null;
  return {
    filePath: row.rows[0].file_path,
    content: row.rows[0].content,
    linesCount: row.rows[0].lines_count,
  };
}

/** Lista navegável dos arquivos armazenados, com contagem por arquivo. */
export async function listAnalyzedFiles(analysisId: string) {
  const { rows } = await pool.query(
    `select f.file_path,
            f.lines_count,
            count(i.id)::int as findings,
            max(
              case i.severity
                when 'critical' then 5
                when 'high' then 4
                when 'medium' then 3
                when 'low' then 2
                else 1
              end
            ) as worst
     from analysis_files f
     left join issues i
       on i.analysis_id = f.analysis_id and i.file = f.file_path
     where f.analysis_id = $1
     group by f.file_path, f.lines_count
     order by worst desc nulls last, findings desc, f.file_path asc`,
    [analysisId]
  );
  return rows;
}
