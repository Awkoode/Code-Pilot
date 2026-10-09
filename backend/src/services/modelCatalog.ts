import { AppError } from "../utils/AppError";

/**
 * Catálogo de modelos de linguagem disponíveis para análise.
 *
 * A lista é fechada e curada de propósito. A API da Groq expõe 11 modelos,
 * mas só três servem para análise de código:
 *
 *   - gpt-oss-safeguard-20b e llama-prompt-guard-* são modelos de
 *     moderação de conteúdo, não geram análise.
 *   - whisper-* são transcrição de áudio.
 *   - allam-2-7b e orpheus-* têm janela de 4k, insuficiente: o prompt de
 *     análise carrega trechos de vários arquivos e estoura esse limite.
 *
 * Manter a lista aqui (em vez de buscar da API a cada request) evita que o
 * catálogo mude no meio de uma análise e evita depender da rede para
 * renderizar a tela de seleção.
 */

export interface ModelSpec {
  id: string;
  label: string;
  provider: string;
  contextLength: number;
  description: string;
  /** Texto curto exibido como badge no seletor. */
  badge: "recomendado" | "rapido" | "alternativa";
  sortOrder: number;
}

export const MODEL_CATALOG: readonly ModelSpec[] = [
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    provider: "OpenAI",
    contextLength: 131072,
    description:
      "Notas mais consistentes entre si. É o que menos erra — use quando a nota importar mais que a velocidade.",
    badge: "recomendado",
    sortOrder: 10,
  },
  {
    id: "openai/gpt-oss-20b",
    label: "GPT-OSS 20B",
    provider: "OpenAI",
    contextLength: 131072,
    description:
      "Bem mais rápido que o 120B. As notas variam mais: em testes deu nota máxima de segurança para um repositório sem código.",
    badge: "rapido",
    sortOrder: 20,
  },
  {
    id: "qwen/qwen3.8-27b",
    label: "Qwen 3.8 27B",
    provider: "Alibaba",
    contextLength: 131072,
    description:
      "O mais rápido dos três. Boa leitura de código, porém as notas foram as mais permissivas nos testes.",
    badge: "alternativa",
    sortOrder: 30,
  },
] as const;

export const DEFAULT_MODEL_ID = "openai/gpt-oss-20b";

export function listModels(): ModelSpec[] {
  return [...MODEL_CATALOG].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getModel(id: string | undefined | null): ModelSpec {
  if (!id) {
    return listModels().find((m) => m.id === DEFAULT_MODEL_ID)!;
  }

  const found = MODEL_CATALOG.find((m) => m.id === id);
  if (!found) {
    throw new AppError(
      `Modelo "${id}" não está disponível`,
      400,
      "INVALID_MODEL"
    );
  }

  return found;
}

/** Seed idempotente do catálogo na tabela models. */
export async function seedModels(): Promise<void> {
  const { query } = await import("../db/pool");

  for (const m of MODEL_CATALOG) {
    await query(
      `insert into models (id, label, provider, context_len, description, active, sort_order)
       values ($1, $2, $3, $4, $5, true, $6)
       on conflict (id) do update
         set label = excluded.label,
             provider = excluded.provider,
             context_len = excluded.context_len,
             description = excluded.description,
             active = excluded.active,
             sort_order = excluded.sort_order`,
      [m.id, m.label, m.provider, m.contextLength, m.description, m.sortOrder]
    );
  }
}
