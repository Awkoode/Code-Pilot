import axios from "axios";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";
import { prepareFilesForAnalyzer, countBlockedLiterals } from "../utils/wafSanitizer";

const HASKELL_ANALYZER_URL = env.HASKELL_ANALYZER_URL;

export interface FileToAnalyze {
  relativePath: string;
  content: string;
}

export interface FileMetric {
  filePath: string;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  cyclomaticComplexity: number;
}

export interface AnalysisResponse {
  totalFilesCount: number;
  totalLinesCount: number;
  totalCodeLines: number;
  totalCommentLines: number;
  totalBlankLines: number;
  avgComplexityPerFile: number;
  healthScore: number;
  fileMetrics: FileMetric[];
}

export async function runHaskellAnalysis(
  files: FileToAnalyze[],
  attempts = 3
): Promise<AnalysisResponse> {
  const payload = prepareFilesForAnalyzer(files);
  const blocked = files.reduce((total, f) => total + countBlockedLiterals(f.content), 0);

  let lastError: any = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await axios.post<AnalysisResponse>(
        `${HASKELL_ANALYZER_URL}/analyze`,
        { files: payload },
        // O analyzer pode demorar em repositório grande; sem timeout o request
        // ficaria pendurado até o proxy desistir.
        { timeout: 90_000 }
      );
      return response.data;
    } catch (err: any) {
      lastError = err;
      const status = err.response?.status;

      // 403/429 aqui é throttling do host, não erro de conteúdo: o mesmo
      // payload passa depois de alguns segundos. Repete com espera
      // exponencial antes de desistir.
      const retryable = status === 403 || status === 429 || !status;
      if (!retryable || attempt === attempts) break;

      const waitMs = 2000 * 2 ** (attempt - 1);
      console.warn(
        `[analyzer] tentativa ${attempt}/${attempts} falhou (${status ?? "sem resposta"}), retentando em ${waitMs}ms`
      );
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  const status = lastError?.response?.status;
  console.error("[analyzer] falha definitiva ao chamar o motor de métricas:", {
    url: `${HASKELL_ANALYZER_URL}/analyze`,
    status: status ?? "sem resposta",
    mensagem: lastError?.message,
    arquivos: files.length,
    blockedLiteralsNeutralizados: blocked,
  });

  if (status === 403 || status === 429) {
    throw new AppError(
      "O serviço de métricas está limitando requisições. Tente novamente em instantes.",
      503,
      "ANALYZER_THROTTLED"
    );
  }

  throw new AppError(
    "Falha ao processar métricas determinísticas do projeto",
    502,
    "ANALYZER_SERVICE_ERROR"
  );
}
