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
  created_at: string;
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
