import type { ScannedFile } from "./scanner.service";

/**
 * Motor determinístico de análise linha a linha.
 *
 * Cobre 100% das linhas do repositório sem custo nem latência de IA: cada
 * regra é uma expressão regular avaliada localmente. A IA entra depois,
 * só nos achados mais graves (ver aiFindings.service.ts).
 *
 * As regras são institucionalizadas por categoria, não por framework: o
 * repositório analisado é de terceiros e a mistura de linguagens é a
 * norma, não a exceção.
 */

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface Finding {
  severity: Severity;
  category: string;
  ruleId: string;
  file: string;
  line: number;
  title: string;
  description: string;
  suggestion: string;
  snippet: string;
}

interface Rule {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  description: string;
  suggestion: string;
  /** Só dispara quando alguma dessas expressões casa (checagem barata). */
  test?: RegExp;
  /** Substitui o `test` quando o acerto depende do conteúdo capturado. */
  capture?: RegExp;
  /**
   * Roda mesmo dentro de linha de comentário.
   *
   * Regra sobre código ignora comentários, senão um trecho documentado com
   * `console.log(` viraria falso positivo. Mas regra que é *sobre* comentário
   * precisa rodar: TODO/FIXME, @ts-ignore e cabeçalho de chave privada só
   * aparecem em comentário, e filtrá-los tornava a regra inútil.
   */
  allowInComment?: boolean;
  /**
   * Testa a linha junto com a seguinte. Necessário para blocos de duas
   * linhas, como `except ValueError:` seguido de `pass` na linha de baixo.
   */
  window?: number;
}

/**
 * Caminhos que não são código de produção.
 *
 * Problema medido: no psf/requests, 59 dos 115 achados eram comentários
 * `# type: ignore` legítimos, e `docs/faqs.md` figurava entre os "arquivos
 * mais críticos". Estilo e manutenibilidade em documentação ou fixture de
 * teste não é dívida técnica acionável.
 *
 * Segurança é exceção: um segredo em diretório de teste continua sendo
 * problema, e fixtures com certificado são justamente o caso em que secret
 * scanner precisa de revisão humana.
 */
const NON_PRODUCTION_PATH =
  /(^|\/)(docs?|tests?|testing|examples?|fixtures?|testdata|samples?)(\/|$)|(^|\/)test_[^/]+\./i;

const DOC_EXTENSION = /\.(md|mdx|rst|txt|adoc)$/i;

function isNonProduction(file: string): boolean {
  return NON_PRODUCTION_PATH.test(file) || DOC_EXTENSION.test(file);
}

/** Categorias em que ruído em documentação/teste não é acionável. */
const NOISE_SENSITIVE: string[] = ["style", "maintainability"];

const MAX_SNIPPET = 200;

/** Linhas que não valem análise: vazias ou muito curtas. */
const SKIP_LINE = /^\s*$/;
const MAX_ANALYZED_LINE = 2000;

const RULES: Rule[] = [
  // ---------------------------------------------------------------- critical
  {
    id: "secret-aws-access-key",
    severity: "critical",
    category: "security",
    title: "Chave de acesso AWS em texto plano",
    description:
      "Identificador de access key da AWS commitado no código. Quem leu o repositório consegue usar a credencial.",
    suggestion:
      "Revogue a chave no painel da AWS, rotacione imediatamente e mova o valor para variável de ambiente.",
    test: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    id: "secret-github-token",
    severity: "critical",
    category: "security",
    title: "Token do GitHub em texto plano",
    description: "Token de acesso do GitHub presente no código-fonte.",
    suggestion:
      "Revogue o token em Settings > Developer settings, rotacione e use um secret manager.",
    test: /\b(gh[pousr]_[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{20,})\b/,
  },
  {
    id: "secret-generic-key",
    severity: "critical",
    category: "security",
    title: "Possível segredo em texto plano",
    description:
      "Atribuição cujo nome sugere credencial (senha, chave, token, segredo) com valor literal.",
    suggestion:
      "Confirme se é credencial real. Se for, rotacione e mova para variável de ambiente ou secret manager.",
    capture:
      /\b(password|passwd|pwd|secret|api[_-]?key|apikey|access[_-]?token|auth[_-]?token|private[_-]?key)\b\s*[:=]\s*["'][^"']{6,}["']/i,
  },
  {
    id: "secret-private-key-block",
    severity: "critical",
    category: "security",
    title: "Bloco de chave privada",
    description: "Cabeçalho de chave privada presente no arquivo.",
    suggestion: "Remova do histórico do git e gere um par de chaves novo.",
    test: /-----BEGIN\s+(RSA|DSA|EC|OPENSSH|PGP)?\s*PRIVATE KEY/,
    allowInComment: true,
  },
  {
    id: "danger-eval",
    severity: "critical",
    category: "security",
    title: "Execução de código dinâmico",
    description:
      "eval/exec/Function constroem código em tempo de execução. Se a entrada vier de fora, é injeção de código.",
    suggestion:
      "Substitua por uma estrutura de dados explícita (dispatch table, switch) em vez de interpretar strings.",
    test: /\b(eval\s*\(|new\s+Function\s*\(|\bexec\s*\(|pickle\.loads?\s*\()/,
  },

  // -------------------------------------------------------------------- high
  {
    id: "danger-inner-html",
    severity: "high",
    category: "security",
    title: "Injeção de HTML sem sanitização",
    description:
      "dangerouslySetInnerHTML ou innerHTML com valor que pode vir de entrada externa.",
    suggestion:
      "Sanitize com DOMPurify antes de renderizar, ou renderize como texto puro.",
    test: /dangerouslySetInnerHTML|\.innerHTML\s*(=|\+=)/,
  },
  {
    id: "danger-shell-injection",
    severity: "high",
    category: "security",
    title: "Shell command com dados externos",
    description:
      "Execução de comando de shell. Se algum argumento vier de entrada do usuário, permite injeção de comandos.",
    suggestion:
      "Use execução sem shell (array de argumentos) e valide a entrada contra uma lista de permissões.",
    test: /\b(child_process\.(exec|execSync)|os\.system\s*\(|subprocess\.[a-z_]+\([^)]*shell\s*=\s*True)/,
  },
  {
    id: "danger-sql-concat",
    severity: "high",
    category: "security",
    title: "SQL montado por concatenação",
    description:
      "Query SQL interpolada com variável. Abre espaço para SQL injection.",
    suggestion: "Use queries parametrizadas (placeholders ? ou $1).",
    capture:
      /(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM)\b[^\n]*(\+\s*[A-Za-z_$]|%s|\$\{)/i,
  },
  {
    id: "danger-weak-crypto",
    severity: "high",
    category: "security",
    title: "Algoritmo criptográfico fraco",
    description:
      "MD5, SHA1 e DES não resistem a colisão. Use apenas para checksums não sensíveis.",
    suggestion: "Migre para SHA-256 ou, se for senha, use bcrypt/argon2.",
    test: /\b(hashlib\.(md5|sha1)\s*\(|createHash\s*\(\s*['"](md5|sha1)['"]|MessageDigest\.getInstance\s*\(\s*['"](MD5|SHA-?1)['"])/i,
  },

  // ------------------------------------------------------------------ medium
  {
    id: "smell-debug-statement",
    severity: "medium",
    category: "maintainability",
    title: "Instrução de depuração esquecida",
    description: "console.log, print ou equivalente, normalmente esquecido no código.",
    suggestion: "Remova ou troque por um logger com nível configurável.",
    test: /\b(console\.(log|debug|dir)\s*\(|^\s*print\s*\(|System\.out\.print|\bdbg!\s*\()/,
  },
  {
    id: "smell-todo-marker",
    severity: "medium",
    category: "maintainability",
    title: "Marcação pendente no código",
    description: "TODO/FIXME/HACK indica trabalho não concluído dentro do arquivo.",
    suggestion: "Transforme em issue com prazo, ou resolva antes de mesclar.",
    test: /\b(TODO|FIXME|HACK|XXX)\b[:\s]/,
    allowInComment: true,
  },
  {
    id: "smell-empty-catch",
    severity: "medium",
    category: "maintainability",
    title: "Tratamento de erro vazio",
    description:
      "Bloco catch/except sem ação. Erros são silenciados e o problema reaparece em outro lugar.",
    suggestion:
      "Registre o erro com contexto e, se for esperado, trate explicitamente em vez de engolir.",
    capture:
      /catch\s*(\([^)]*\))?\s*\{\s*\}|except[^\n:]*:\s*(pass|\.\.\.)\s*$|rescue\s*=>?\s*nil\s*$/,
    window: 2,
  },
  {
    id: "smell-suppression",
    severity: "info",
    category: "maintainability",
    title: "Regra de verificação desativada",
    description:
      "Supressão de type checker ou linter esconde erros que a regra existia para pegar. Em base de código tipada isso é comum e costuma ser intencional.",
    suggestion:
      "Se a supressão for evitável, corrija a causa. Se for necessária, comente o porquê.",
    test: /@ts-ignore|@ts-nocheck|eslint-disable|# noqa|@SuppressWarnings|# type:\s*ignore|\/\/nolint/,
    allowInComment: true,
  },
  {
    id: "smell-any-type",
    severity: "medium",
    category: "maintainability",
    title: "Tipagem permissiva demais",
    description:
      "Uso de any / interface vazia desliga a checagem de tipos a partir dali.",
    suggestion: "Use um tipo concreto, unknown com validação, ou genérico.",
    test: /(:\s*any\b|as\s+any\b|<any>|interface\s+\w+\s*\{\s*\}|dict\b.*:\s*Any\b)/,
  },

  // --------------------------------------------------------------------- low
  {
    id: "style-long-line",
    severity: "low",
    category: "style",
    title: "Linha muito longa",
    description: "Passa de 160 caracteres, o que dificulta revisão e diffs.",
    suggestion: "Quebre em múltiplas linhas ou extraia para uma constante nomeada.",
    capture: /^.{161,}$/,
  },
  {
    id: "style-deep-nesting",
    severity: "low",
    category: "style",
    title: "Aninhamento profundo",
    description: "Mais de 4 níveis de indentação normalmente indica lógica que pede extração.",
    suggestion: "Use guard clauses para achatar o fluxo.",
    capture: /^\s{17,}\S/,
  },
  {
    id: "style-trailing-whitespace",
    severity: "info",
    category: "style",
    title: "Espaço em branco no fim da linha",
    description: "Gera ruído em todo diff.",
    suggestion: "Deixe o editor remover em salvar.",
    test: /[ \t]+$/,
  },
];

/** Remove linhas de comentário para não acusar código dentro de comentário. */
function isCommentLike(trimmed: string): boolean {
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("--") ||
    trimmed.startsWith("<!--")
  );
}

/** Palavras-chave de string que sugerem que a linha é dado, não lógica. */
function looksLikeDataOnly(line: string): boolean {
  const q = (line.match(/["'`]/g) || []).length;
  return q >= 4;
}

export function inspectFiles(files: ScannedFile[]): Finding[] {
  const findings: Finding[] = [];

  for (const file of files) {
    const lines = file.content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      if (SKIP_LINE.test(raw)) continue;
      if (raw.length > MAX_ANALYZED_LINE) continue;

      const trimmed = raw.trim();
      const inComment = isCommentLike(trimmed);

      // Janela de 2 linhas para regras de bloco (except: + pass na linha seguinte).
      const nextLine = lines[i + 1] ?? "";
      const windowText = `${trimmed}\n${nextLine.trim()}`;

      const nonProduction = isNonProduction(file.relativePath);

      for (const rule of RULES) {
        // Em doc/teste, só segurança continua valendo.
        if (nonProduction && NOISE_SENSITIVE.includes(rule.category)) continue;

        const pattern = rule.capture ?? rule.test;

        // Padrão de código não deve acusar linha comentada.
        if (inComment && !rule.allowInComment) continue;

        // Regra de estilo de whitespace precisa do texto original: testar o
        // trim esconderia justamente o espaço que a regra procura.
        if (rule.id === "style-trailing-whitespace") {
          if (/[ \t]+$/.test(raw)) {
            findings.push(build(rule, file.relativePath, i + 1, raw));
          }
          continue;
        }

        const subject = rule.window ? windowText : trimmed;
        if (!pattern || !pattern.test(subject)) continue;

        // Não accuse segredo onde o "valor" é só texto de placeholder.
        if (rule.id === "secret-generic-key" && looksLikeDataOnly(trimmed)) continue;

        findings.push(build(rule, file.relativePath, i + 1, raw));
      }
    }
  }

  return findings;
}

function build(rule: Rule, file: string, line: number, snippet: string): Finding {
  return {
    severity: rule.severity,
    category: rule.category,
    ruleId: rule.id,
    file,
    line,
    title: rule.title,
    description: rule.description,
    suggestion: rule.suggestion,
    snippet: snippet.length > MAX_SNIPPET ? snippet.slice(0, MAX_SNIPPET) + "…" : snippet,
  };
}

export interface InspectorSummary {
  totalFindings: number;
  bySeverity: Record<Severity, number>;
  byCategory: Record<string, number>;
  filesWithFindings: number;
  /** Arquivos que mais merecem atenção, ordenados por peso de severidade. */
  criticalFiles: CriticalFile[];
  topRules: Array<{ ruleId: string; count: number; severity: Severity }>;
}

export interface CriticalFile {
  path: string;
  findings: number;
  worstSeverity: Severity;
  /** 5 = critical, 4 = high, 3 = medium, 2 = low, 1 = info */
  weight: number;
  breakdown: Record<Severity, number>;
  topRules: string[];
}

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];

export function summarize(findings: Finding[], maxFiles = 8): InspectorSummary {
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<Severity, number>;
  const byCategory: Record<string, number> = {};
  const ruleCounts = new Map<string, { count: number; severity: Severity }>();
  const perFile = new Map<string, Finding[]>();

  for (const f of findings) {
    bySeverity[f.severity]++;
    byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;

    const rc = ruleCounts.get(f.ruleId);
    if (rc) rc.count++;
    else ruleCounts.set(f.ruleId, { count: 1, severity: f.severity });

    const list = perFile.get(f.file);
    if (list) list.push(f);
    else perFile.set(f.file, [f]);
  }

  const criticalFiles: CriticalFile[] = [...perFile.entries()]
    .map(([path, list]) => {
      const breakdown = { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<Severity, number>;
      let weight = 0;
      for (const f of list) {
        breakdown[f.severity]++;
        weight += SEVERITY_WEIGHT[f.severity];
      }
      const worstSeverity = SEVERITY_ORDER.find((s) => breakdown[s] > 0) ?? "info";

      return {
        path,
        findings: list.length,
        worstSeverity,
        weight,
        breakdown,
        topRules: [...new Set(list.map((f) => f.ruleId))].slice(0, 4),
      };
    })
    // mais graves primeiro; empate resolvido por quantidade
    .sort((a, b) => b.weight - a.weight || b.findings - a.findings)
    .slice(0, maxFiles);

  return {
    totalFindings: findings.length,
    bySeverity,
    byCategory,
    filesWithFindings: perFile.size,
    criticalFiles,
    topRules: [...ruleCounts.entries()]
      .map(([ruleId, v]) => ({ ruleId, count: v.count, severity: v.severity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}

export const RULE_COUNT = RULES.length;
