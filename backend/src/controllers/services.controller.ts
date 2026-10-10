import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { env } from "../config/env";
import { prepareFilesForAnalyzer } from "../utils/wafSanitizer";

/** Tempo máximo de espera pelo analyzer: serviço free costuma acordar devagar. */
const ANALYZER_TIMEOUT_MS = 90_000;

export interface ServicePing {
  ok: boolean;
  /** Tempo de resposta em ms. */
  latencyMs: number;
  /** Status HTTP devolvido, quando houver. */
  status?: number;
  /** Resposta bruta para diagnóstico. */
  detail?: unknown;
  error?: string;
}

/**
 * GET /api/services/analyzer/health
 *
 * Aplica o mesmo neutralizador usado na análise e um payload mínimo. Se o
 * serviço responde a isso, responde à análise real.
 */
export async function pingAnalyzer(req: Request, res: Response, next: NextFunction) {
  try {
    const url = `${env.HASKELL_ANALYZER_URL}/health`;
    const started = Date.now();

    try {
      const response = await axios.get(url, {
        timeout: ANALYZER_TIMEOUT_MS,
        headers: { "User-Agent": "CodePilot/1.0" },
      });

      const ping: ServicePing = {
        ok: response.status >= 200 && response.status < 300,
        latencyMs: Date.now() - started,
        status: response.status,
        detail: response.data,
      };

      console.log("[services] analyzer respondeu:", {
        status: response.status,
        latencyMs: ping.latencyMs,
      });

      return res.json(ping);
    } catch (err: any) {
      const ping: ServicePing = {
        ok: false,
        latencyMs: Date.now() - started,
        status: err.response?.status,
        error: err.code === "ECONNABORTED"
          ? `Sem resposta em ${ANALYZER_TIMEOUT_MS / 1000}s`
          : err.message,
      };

      console.warn("[services] analyzer indisponível:", {
        status: ping.status ?? "sem resposta",
        erro: ping.error,
      });

      return res.status(503).json(ping);
    }
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/services/analyzer/analyze-probe
 *
 * Vai além do /health: manda um arquivo de verdade pelo mesmo caminho da
 * análise, para detectar bloqueio de WAF que o /health não revela.
 */
export async function probeAnalyzer(req: Request, res: Response, next: NextFunction) {
  try {
    const url = `${env.HASKELL_ANALYZER_URL}/analyze`;
    const started = Date.now();

    // Passa pelo neutralizador por consistência com o fluxo real.
    const files = prepareFilesForAnalyzer([
      {
        relativePath: "probe.ts",
        content: "function probe(a: number) {\n  if (a > 0) {\n    return a;\n  }\n  return 0;\n}\n",
      },
    ]);

    try {
      const response = await axios.post<any>(url, { files }, { timeout: ANALYZER_TIMEOUT_MS });
      const latencyMs = Date.now() - started;

      return res.json({
        ok: response.status >= 200 && response.status < 300,
        latencyMs,
        status: response.status,
        healthScore: response.data?.healthScore,
        totalFilesCount: response.data?.totalFilesCount,
      });
    } catch (err: any) {
      return res.status(503).json({
        ok: false,
        latencyMs: Date.now() - started,
        status: err.response?.status,
        error: err.code === "ECONNABORTED"
          ? `Sem resposta em ${ANALYZER_TIMEOUT_MS / 1000}s`
          : err.message,
      });
    }
  } catch (err) {
    next(err);
  }
}

/** GET /api/services/status — visão dos dois serviços de uma vez. */
export async function overallStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const started = Date.now();

    const analyzer = await axios
      .get(`${env.HASKELL_ANALYZER_URL}/health`, { timeout: ANALYZER_TIMEOUT_MS })
      .then((r) => ({
        ok: r.status >= 200 && r.status < 300,
        latencyMs: Date.now() - started,
        status: r.status,
      }))
      .catch((err: any) => ({
        ok: false,
        latencyMs: Date.now() - started,
        status: err.response?.status,
        error: err.message,
      }));

    res.json({
      backend: { ok: true, latencyMs: 0, uptimeSeconds: Math.round(process.uptime()) },
      analyzer,
    });
  } catch (err) {
    next(err);
  }
}