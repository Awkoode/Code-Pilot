import axios from "axios";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

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

export async function runHaskellAnalysis(files: FileToAnalyze[]): Promise<AnalysisResponse> {
  try {
    const response = await axios.post<AnalysisResponse>(`${HASKELL_ANALYZER_URL}/analyze`, { files });
    return response.data;
  } catch (err: any) {
    console.error("Erro na comunicação com o Haskell Analyzer:", err.message);
    throw new AppError("Falha ao processar métricas determinísticas do projeto", 502, "ANALYZER_SERVICE_ERROR");
  }
}