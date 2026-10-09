import { clearToken, getToken } from './auth';
import type {
  AnalyzeResponse,
  Analysis,
  AuthResponse,
  CreateProjectInput,
  CriticalFile,
  ExplainResponse,
  FileContentResponse,
  FilesResponse,
  HealthResponse,
  IssuesPage,
  IssuesSummaryResponse,
  ModelCatalogResponse,
  Project,
  ScanResponse,
  User,
} from '../types';

const BASE_URL =
  import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.DEV ? "http://localhost:3001" : "");

export const UNAUTHORIZED_EVENT = 'codepilot:unauthorized';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  return new ApiError(0, err instanceof Error ? err.message : 'Erro inesperado');
}

function messageFromBody(body: unknown): string | null {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (typeof b.error === 'string') return b.error;
    if (typeof b.message === 'string') return b.message;
  }

  return null;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();

  if (auth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;

  if (!BASE_URL) {
    throw new ApiError(0, 'Backend não configurado para este ambiente.');
  }

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      0,
      'Não foi possível conectar ao servidor. Verifique se o backend está rodando.'
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  let body: unknown = null;

  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      clearToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    const fallback =
      res.status >= 500
        ? 'Erro interno do servidor'
        : res.status === 404
          ? 'Não encontrado'
          : res.status === 401
            ? 'Sessão expirada ou credenciais inválidas'
            : 'Não foi possível concluir a requisição';

    const message =
      res.status >= 500
        ? fallback
        : (messageFromBody(body) ?? fallback);

    throw new ApiError(res.status, message);
  }

  return body as T;
}

export const api = {
  health: () => request<HealthResponse>('/api/health', {}, false),

  register: (email: string, password: string) =>
    request<AuthResponse>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false
    ),

  login: (email: string, password: string) =>
    request<AuthResponse>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false
    ),

  me: () => request<{ user: User }>('/api/auth/me'),

  listProjects: () =>
    request<{ projects: Project[] }>('/api/projects'),

  getProject: (id: string) =>
    request<{ project: Project }>(`/api/projects/${id}`),

  createProject: (input: CreateProjectInput) =>
    request<{ project: Project }>(
      '/api/projects',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    ),

  deleteProject: (id: string) =>
    request<void>(`/api/projects/${id}`, {
      method: 'DELETE',
    }),

  analyzeProject: (id: string, model?: string) =>
    request<AnalyzeResponse>(
      `/api/projects/${id}/analyze`,
      {
        method: 'POST',
        body: JSON.stringify(model ? { model } : {}),
      }
    ),

  listAnalyses: (id: string) =>
    request<{ analyses: Analysis[] }>(
      `/api/projects/${id}/analyses`
    ),

  models: () => request<ModelCatalogResponse>('/api/models', {}, false),

  listIssues: (
    projectId: string,
    analysisId: string,
    filters?: { severity?: string; category?: string; file?: string; limit?: number; offset?: number },
  ) => {
    const q = new URLSearchParams();
    if (filters?.severity) q.set('severity', filters.severity);
    if (filters?.category) q.set('category', filters.category);
    if (filters?.file) q.set('file', filters.file);
    if (filters?.limit) q.set('limit', String(filters.limit));
    if (filters?.offset) q.set('offset', String(filters.offset));
    const qs = q.toString();
    return request<IssuesPage>(
      `/api/projects/${projectId}/analyses/${analysisId}/issues${qs ? `?${qs}` : ''}`,
    );
  },

  issuesSummary: (projectId: string, analysisId: string) =>
    request<IssuesSummaryResponse>(
      `/api/projects/${projectId}/analyses/${analysisId}/issues/summary`,
    ),

  criticalFiles: (projectId: string, analysisId: string) =>
    request<{ criticalFiles: CriticalFile[] }>(
      `/api/projects/${projectId}/analyses/${analysisId}/critical-files`,
    ),

  analyzedFiles: (projectId: string, analysisId: string) =>
    request<FilesResponse>(`/api/projects/${projectId}/analyses/${analysisId}/files`),

  fileContent: (projectId: string, analysisId: string, path: string) =>
    request<FileContentResponse>(
      `/api/projects/${projectId}/analyses/${analysisId}/file?path=${encodeURIComponent(path)}`,
    ),

  explainFindings: (projectId: string, analysisId: string, model?: string, max?: number) =>
    request<ExplainResponse>(
      `/api/projects/${projectId}/analyses/${analysisId}/explain`,
      {
        method: 'POST',
        body: JSON.stringify({ model, max }),
      }
    ),

  scanProject: (id: string) =>
    request<ScanResponse>(
      `/api/projects/${id}/scan`,
      { method: 'POST' }
    ),
};
