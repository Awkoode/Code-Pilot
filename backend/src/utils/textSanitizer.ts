/**
 * Limpeza do texto que vem do modelo de linguagem.
 *
 * Mesmo pedindo JSON estrito, os modelos às vezes devolvem marcação dentro
 * do campo aiSummary (tags <br>, <li>, <p>, entidades HTML). Como o front
 * renderiza esse campo com `whitespace-pre-line`, as tags apareciam cruas
 * para o usuário.
 *
 * A limpeza acontece na escrita, então vale tanto para o que é devolvido
 * na resposta da API quanto para o que é gravado no banco.
 */

/** Tags de bloco viram quebras de linha antes de serem removidas. */
const BLOCK_TAGS = /<\s*br\s*\/?\s*>|<\/\s*p\s*>|<\/\s*div\s*>|<\/\s*tr\s*>/gi;
/** Listas viram marcadores de texto plano. */
const LIST_ITEM = /<\s*li[^>]*>/gi;
/** Qualquer outra tag é descartada. */
const ANY_TAG = /<[^>]+>/g;

/**
 * Entidades decodificadas. `&lt;` e `&gt;` ficam de fora de propósito:
 * descodificá-las transformaria texto escapado em tag viva, que passaria a
 * ser XSS caso o front passe a renderizar com dangerouslySetInnerHTML.
 */
const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

export function sanitizeModelText(input: unknown): string {
  if (typeof input !== 'string') return '';

  let out = input;

  out = out.replace(BLOCK_TAGS, '\n');
  out = out.replace(LIST_ITEM, '\n- ');
  out = out.replace(ANY_TAG, '');

  for (const [entity, char] of Object.entries(ENTITIES)) {
    out = out.split(entity).join(char);
  }

  // normaliza quebras: sem espaços no fim, máximo uma linha em branco
  out = out
    .split('\n')
    .map((line) => line.replace(/\s+$/, '').replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return out;
}
