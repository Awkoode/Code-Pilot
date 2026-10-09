import { pool } from "../db/pool";
import { AppError } from "../utils/AppError";
import { getModel } from "./modelCatalog";
import { sanitizeModelText } from "../utils/textSanitizer";

/**
 * Comentário da IA, linha a linha, nos achados mais graves.
 *
 * Não é viável comentar toda discrepância de um repositório: o
 * anthropic-sdk-python tem 2552 arquivos e mais de 200 mil linhas, o que
 * estoura contexto e cota do free tier. O desenho é em camadas:
 *
 *   - a cobertura de 100% das linhas é determinística (codeInspector);
 *   - aqui a IA só explica os achados mais graves, em lote.
 *
 * O teto padrão de 24 cobre os casos reais: no pallets/click há 3 achados
 * críticos e 13 médios.
 */

export const DEFAULT_MAX_COMMENTS = 24;

export interface ExplainableIssue {
  id: string;
  file: string;
  line: number;
  severity: string;
  ruleId: string;
  title: string;
  snippet: string | null;
}

export async function explainFindings(
  analysisId: string,
  modelId: string | undefined,
  max = DEFAULT_MAX_COMMENTS
): Promise<{ explained: number; skipped: number; model: string }> {
  const model = getModel(modelId);
  const limit = Math.min(Math.max(max, 1), 60);

  // Só explica o que ainda está sem comentário.
  const { rows } = await pool.query(
    `select id, file, line, severity, rule_id, title, snippet
     from issues
     where analysis_id = $1 and ai_comment is null
     order by
       case severity
         when 'critical' then 5
         when 'high' then 4
         when 'medium' then 3
         when 'low' then 2
         else 1
       end desc,
       file asc, line asc
     limit $2`,
    [analysisId, limit]
  );

  const issues = rows as ExplainableIssue[];

  const total = await pool.query(
    "select count(*)::int as n from issues where analysis_id = $1 and ai_comment is null",
    [analysisId]
  );
  const pending = total.rows[0].n as number;

  if (issues.length === 0) {
    return { explained: 0, skipped: pending, model: model.id };
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AppError(
      "Nenhuma chave de IA configurada para explicar os achados",
      503,
      "AI_NOT_CONFIGURED"
    );
  }

  const listing = issues
    .map(
      (i, n) =>
        `[${n}] ${i.file}:${i.line} (${i.severity} / ${i.ruleId})\n` +
        `    ${i.title}\n` +
        `    codigo: ${(i.snippet ?? "").slice(0, 240)}`
    )
    .join("\n");

  const prompt = `Você é um revisor de código sênior. Para cada item listado abaixo, escreva UMA explicação curta em português do Brasil dizendo:

1. Qual é o problema real nesta linha.
2. Qual o impacto prático (segurança, correção ou manutenibilidade).
3. O que fazer para corrigir, em uma frase.

Não repita o que o título já diz. Seja direto e específico. Não use markdown nem listas.

Responda ESTRITAMENTE com um array JSON de objetos, na mesma ordem dos itens, com a chave "id" (o número entre colchetes) e a chave "comment". Exemplo:

{"comentarios":[{"id":0,"comment":"..."},{"id":1,"comment":"..."}]}

Itens:
${listing}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: model.id,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 900,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Groq respondeu ${response.status}: ${text.slice(0, 300)}`);
    }

    const data = await response.json();
    const raw = JSON.parse(data.choices[0].message.content);
    const list = Array.isArray(raw?.comentarios) ? raw.comentarios : [];

    const updates: unknown[] = [];
    const tuples: string[] = [];
    let explained = 0;

    for (const item of list) {
      const idx = Number(item?.id);
      const comment = sanitizeModelText(item?.comment);
      if (!Number.isInteger(idx) || !comment) continue;
      const target = issues[idx];
      if (!target) continue;

      const b = explained * 2;
      updates.push(comment, target.id);
      // Cast explícito: sem isso o VALUES infere tudo como text e o
      // `issues.id = c.id` falha com "operator does not exist: uuid = text".
      tuples.push(`($${b + 1}::text,$${b + 2}::uuid)`);
      explained++;
    }

    if (explained > 0) {
      await pool.query(
        `update issues i
         set ai_comment = c.comment
         from (values ${tuples.join(",")}) as c(comment, id)
         where i.id = c.id`,
        updates
      );
    }

    console.log("[ai-findings] explicado:", { analysisId, explained, model: model.id });

    return { explained, skipped: Math.max(0, pending - explained), model: model.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[ai-findings] falha ao explicar achados:", { modelo: model.id, erro: msg });
    throw new AppError(
      "Não foi possível gerar os comentários da IA agora. Tente novamente.",
      502,
      "AI_FINDINGS_ERROR"
    );
  }
}

/** Quantos achados ainda não têm comentário da IA. */
export async function countPendingComments(analysisId: string): Promise<number> {
  const { rows } = await pool.query(
    "select count(*)::int as n from issues where analysis_id = $1 and ai_comment is null",
    [analysisId]
  );
  return rows[0].n as number;
}