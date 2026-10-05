const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/api/health`);
  if (!res.ok) {
    throw new Error(`Health check falhou: ${res.status}`);
  }
  return res.json();
}