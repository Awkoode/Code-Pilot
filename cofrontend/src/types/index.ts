export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  github_url: string;
  description: string | null;
  created_at: string;
}

export interface ScannedFile {
  relativePath: string;
  content: string;
  linesCount: number;
  sizeBytes: number;
}

export interface FileMetric {
  filePath: string;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  cyclomaticComplexity: number;
}

export interface AnalysisMetrics {
  totalFilesCount: number;
  totalLinesCount: number;
  totalCodeLines: number;
  totalCommentLines: number;
  totalBlankLines: number;
  avgComplexityPerFile: number;
  healthScore: number;
  fileMetrics: FileMetric[];
}

export interface AIReport {
  aiSummary: string;
  architectureScore: number;
  securityScore: number;
  performanceScore: number;
  maintainabilityScore: number;
  documentationScore: number;
  /** Modelo que respondeu de fato. */
  model: string;
  /** true quando a IA falhou e as notas vieram das métricas determinísticas. */
  usedFallback: boolean;
}

export interface Analysis {
  id: string;
  project_id: string;
  score: number;
  architecture_score: number;
  security_score: number;
  performance_score: number;
  maintainability_score: number;
  documentation_score: number;
  ai_summary: string;
  model: string;
  created_at: string;
}

export interface ModelSpec {
  id: string;
  label: string;
  provider: string;
  contextLength: number;
  description: string;
  badge: 'recomendado' | 'rapido' | 'alternativa';
  sortOrder: number;
}

export interface ModelCatalogResponse {
  defaultModel: string;
  models: ModelSpec[];
}

export interface ScanResult {
  owner: string;
  repo: string;
  totalFilesCount: number;
  totalLinesCount: number;
  totalSizeBytes: number;
  relevantFiles: ScannedFile[];
}

export interface AnalyzeResponse {
  message: string;
  analysisId: string;
  metrics: AnalysisMetrics;
  aiReport: AIReport;
  findings: FindingsSummary;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface CriticalFile {
  path: string;
  findings: number;
  worstSeverity: Severity;
  weight: number;
  breakdown: Record<Severity, number>;
  topRules: string[];
}

export interface RuleStat {
  ruleId: string;
  count: number;
  severity: Severity;
}

export interface FindingsSummary {
  total: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  filesAffected: number;
  criticalFiles: CriticalFile[];
  topRules: RuleStat[];
}

export interface Issue {
  id: string;
  severity: Severity;
  category: string | null;
  rule_id: string;
  file: string;
  line: number;
  title: string;
  description: string | null;
  suggestion: string | null;
  snippet: string | null;
  ai_comment: string | null;
}

export interface IssuesPage {
  issues: Issue[];
  total: number;
  limit: number;
  offset: number;
}

export interface IssuesSummaryResponse {
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  topRules: Array<{ rule_id: string; severity: Severity; count: number }>;
  filesAffected: number;
}

export interface AnalyzedFile {
  file_path: string;
  lines_count: number;
  findings: number;
  worst: number | null;
}

export interface CodeLine {
  number: number;
  text: string;
  findings: Issue[];
  severity: Severity | null;
}

export interface FileContentResponse {
  filePath: string;
  linesCount: number;
  totalFindings: number;
  lines: CodeLine[];
}

export interface FilesResponse {
  files: AnalyzedFile[];
  pendingComments: number;
}

export interface ExplainResponse {
  explained: number;
  skipped: number;
  model: string;
}

export interface ServicePing {
  ok: boolean;
  latencyMs: number;
  status?: number;
  detail?: unknown;
  error?: string;
}

export interface ScanResponse {
  message: string;
  summary: Omit<ScanResult, 'relevantFiles'>;
  files: ScannedFile[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export interface CreateProjectInput {
  name: string;
  github_url: string;
  description?: string;
}
