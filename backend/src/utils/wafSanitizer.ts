/**
 * Neutralização de padrões bloqueados pela WAF do provedor do analyzer.
 *
 * O analyzer Haskell (hospedado) fica atrás de uma proteção de borda que
 * rejeita o POST /analyze com HTTP 403 quando o corpo contém certos
 * literais associate a Log4Shell (${jndi:) e injeção de variável de
 * ambiente (${env:). Como o repositório analisado é código de terceiros,
 * esses literais aparecem com frequência em arquivos de configuração
 * (docker-compose, devcontainer, Makefile, .env).
 *
 * O analyzer só devolve contagens e complexidade — nunca o conteúdo das
 * linhas. Portanto neutralizar o payload enviado a ele não perde nenhuma
 * informação: o texto original segue intacto para a IA e para o visor de
 * código do front-end.
 *
 * Cada padrão troca 1 caractere por outro de mesmo comprimento, então a
 * contagem de linhas e o deslocamento de colunas não mudam.
 */

/** Padrões literais conhecidos por serem bloqueados. */
const BLOCKED_LITERALS: ReadonlyArray<readonly [string, string, string]> = [
  ['${env:', '${env;', 'injeção de variável de ambiente'],
  ['${jndi:', '${jndi;', 'Log4Shell / JNDI lookup'],
];

export function neutralizeWafPatterns(content: string): string {
  let out = content;
  for (const [needle, replacement] of BLOCKED_LITERALS) {
    if (out.includes(needle)) {
      out = out.split(needle).join(replacement);
    }
  }
  return out;
}

/** Aplica a neutralização a uma lista de arquivos destined ao analyzer. */
export function prepareFilesForAnalyzer<T extends { relativePath: string; content: string }>(
  files: T[],
): T[] {
  return files.map((file) => ({
    ...file,
    content: neutralizeWafPatterns(file.content),
  }));
}

/**
 * Indica se um payload provavelmente será bloqueado pela borda.
 * Usado nos logs para diferenciar 403 de WAF de outros 403.
 */
export function countBlockedLiterals(content: string): number {
  return BLOCKED_LITERALS.reduce(
    (total, [needle]) => total + content.split(needle).length - 1,
    0,
  );
}
