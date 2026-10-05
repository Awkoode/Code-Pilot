import { useEffect, useState } from "react";
import { fetchHealth, type HealthResponse } from "../services/api";

export default function Landing() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center font-bold text-white text-sm">
              C
            </div>
            <span className="font-semibold tracking-tight">CodePilot</span>
          </div>
          <span className="text-xs text-gray-500 font-mono">v0.1.0</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Understand your{" "}
            <span className="text-primary">codebase</span> with AI.
          </h1>
          <p className="text-gray-400 mb-10 text-lg">
            Análise inteligente de repositórios GitHub combinando métricas
            determinísticas e IA.
          </p>

          <div className="flex gap-2 max-w-xl mx-auto">
            <input
              type="text"
              placeholder="https://github.com/user/repo"
              disabled
              className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-sm font-mono placeholder-gray-600 focus:outline-none"
            />
            <button
              disabled
              className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-3 rounded-lg text-sm transition-colors"
            >
              Analyze
            </button>
          </div>

          <p className="text-xs text-gray-600 mt-3">
            Em breve — Fase 1 em desenvolvimento
          </p>

          <div className="mt-16 flex items-center justify-center gap-2 text-xs font-mono">
            <span className="text-gray-500">backend:</span>
            {health && (
              <span className="text-green-400">
                ● {health.status} · {health.service} · {health.version}
              </span>
            )}
            {error && <span className="text-red-400">● offline ({error})</span>}
            {!health && !error && <span className="text-gray-500">● verificando...</span>}
          </div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 text-xs text-gray-600 flex justify-between">
          <span>CodePilot — Fase 1</span>
          <span className="font-mono">React · Node · TS</span>
        </div>
      </footer>
    </div>
  );
}