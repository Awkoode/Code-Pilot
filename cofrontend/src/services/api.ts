import { clearToken, getToken } from './auth';
import type {
  AnalyzeResponse,
  Analysis,
  AuthResponse,
  CreateProjectInput,
  HealthResponse,
  Project,
  ScanResponse,
  User,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

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

async function request<T>(path: string, options: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (auth && token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
  }

  if (res.status === 204) return undefined as T;

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
    const message = res.status >= 500 ? fallback : (messageFromBody(body) ?? fallback);
    throw new ApiError(res.status, message);
  }
  return body as T;
}

export const api = {
  health: () => request<HealthResponse>('/api/health', {}, false),

  register: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }, false),
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false),
  me: () => request<{ user: User }>('/api/auth/me'),

  listProjects: () => request<{ projects: Project[] }>('/api/projects'),
  getProject: (id: string) => request<{ project: Project }>(`/api/projects/${id}`),
  createProject: (input: CreateProjectInput) =>
    request<{ project: Project }>('/api/projects', { method: 'POST', body: JSON.stringify(input) }),
  deleteProject: (id: string) => request<void>(`/api/projects/${id}`, { method: 'DELETE' }),

  analyzeProject: (id: string) => request<AnalyzeResponse>(`/api/projects/${id}/analyze`, { method: 'POST' }),
  listAnalyses: (id: string) => request<{ analyses: Analysis[] }>(`/api/projects/${id}/analyses`),
  scanProject: (id: string) => request<ScanResponse>(`/api/projects/${id}/scan`, { method: 'POST' }),
};
