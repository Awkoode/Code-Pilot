import { ScannedFile } from "./scanner.service";
import { sanitizeModelText } from "../utils/textSanitizer";
import { getModel, DEFAULT_MODEL_ID } from "./modelCatalog";

export interface AIAnalysisOutput {
  aiSummary: string;
  architectureScore: number;
  securityScore: number;
  performanceScore: number;
  maintainabilityScore: number;
  documentationScore: number;
  /** Modelo que respondeu de fato (ou o pretendido, se caiu no fallback). */
  model: string;
  /** true quando a IA falhou e os scores vieram das métricas determinísticas. */
  usedFallback: boolean;
}

export async function generateAIRefactoringReport(
  files: ScannedFile[],
  baseMetrics: any,
  modelId?: string
): Promise<AIAnalysisOutput> {
  // Valida contra o catálogo: id desconhecido vira 400 antes de gastar request.
  const model = getModel(modelId);

  const filesToAnalyze = files
    .slice(0, 5)
    .map((f) => `Ficheiro: ${f.relativePath}\nConteúdo:\n${f.content.slice(0, 1500)}`)
    .join("\n\n---\n\n");

  const prompt = `
Você é um Arquiteto de Software Sênior especialista em refatoração e boas práticas.
Analise os seguintes ficheiros do repositório e suas métricas determinísticas:

Métricas Iniciais:
- Total de Ficheiros: ${baseMetrics.totalFilesCount}
- Linhas de Código: ${baseMetrics.totalCodeLines}
- Complexidade Média: ${baseMetrics.avgComplexityPerFile}

Código do Projeto:
${filesToAnalyze}

Gere um relatório JSON estrito no seguinte formato:
{
  "architectureScore": number (0 a 100),
  "securityScore": number (0 a 100),
  "performanceScore": number (0 a 100),
  "maintainabilityScore": number (0 a 100),
  "documentationScore": number (0 a 100),
  "aiSummary": "Resumo conciso das principais sugestões de refatoração, apontando trechos específicos a serem melhorados."
}
`;

  try {
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("Nenhuma API Key encontrada no ambiente (.env)");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: model.id,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        // Limite explícito: sem max_tokens a API assume 2048, o que estoura
        // o teto de tokens por minuto do modelo (o qwen/qwen3.8-27b aceita
        // 1000 e falhava com 429 em toda chamada). O relatório precisa de
        // few hundred tokens, então 900 folga com sobra.
        max_tokens: 900,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API de IA (${response.status}) no modelo ${model.id}: ${errorText}`);
    }

    const data = await response.json();
    const parsedContent = JSON.parse(data.choices[0].message.content);

    return {
      architectureScore: parsedContent.architectureScore ?? 80,
      securityScore: parsedContent.securityScore ?? 85,
      performanceScore: parsedContent.performanceScore ?? 80,
      maintainabilityScore: parsedContent.maintainabilityScore ?? 80,
      documentationScore: parsedContent.documentationScore ?? 75,
      aiSummary:
        sanitizeModelText(parsedContent.aiSummary) ||
        "Refatoração recomendada para reduzir complexidade.",
      model: model.id,
      usedFallback: false,
    };
  } catch (error) {
    // Log estruturado: sem o status/modelo era impossível diagnosticar
    // falha de IA pela mensagem genérica que chega no front.
    console.error("[ai] falhou, usando fallback determinístico:", {
      modelo: model.id,
      erro: error instanceof Error ? error.message : String(error),
    });

    return {
      architectureScore: baseMetrics.healthScore,
      securityScore: baseMetrics.healthScore,
      performanceScore: baseMetrics.healthScore,
      maintainabilityScore: baseMetrics.healthScore,
      documentationScore: baseMetrics.healthScore,
      aiSummary: `Análise determinística efetuada pelo motor Haskell. A IA (${model.label}) não respondeu, então as notas vêm das métricas objetivas.`,
      model: model.id,
      usedFallback: true,
    };
  }
}