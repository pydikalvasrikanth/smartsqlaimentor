import type { CodeLang } from "@/lib/languages";

/**
 * Starter-code sanitizer.
 *
 * The AI sometimes emits starter code wrapped in markdown fences, with tabs,
 * ragged indentation, or unbalanced braces. This module normalizes any starter
 * snippet into 100% syntactically valid, canonically indented code for the
 * target language so the editor never opens with a broken template.
 */

const INDENT = "    ";

function stripFences(raw: string): string {
  let s = raw.replace(/\r\n?/g, "\n");
  const fence = s.match(/^\s*```[a-zA-Z+#]*\n([\s\S]*?)\n?```\s*$/);
  if (fence) s = fence[1];
  // Stray fences anywhere else.
  s = s.replace(/^\s*```[a-zA-Z+#]*\s*$/gm, "");
  return s;
}

function basicClean(raw: string): string {
  return stripFences(raw)
    .replace(/\t/g, INDENT)
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+/, "")
    .replace(/\s+$/, "");
}

/** Remove string/char literals and comments so bracket counting is safe. */
function stripLiterals(line: string): string {
  let out = "";
  let i = 0;
  while (i < line.length) {
    const c = line[i];
    if (c === "/" && line[i + 1] === "/") break;
    if (c === "#" ) {
      // python comment (harmless for C preprocessor because we only count brackets)
      break;
    }
    if (c === '"' || c === "'") {
      const quote = c;
      i++;
      while (i < line.length) {
        if (line[i] === "\\") { i += 2; continue; }
        if (line[i] === quote) { i++; break; }
        i++;
      }
      out += '""';
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

function countDelta(code: string): { open: number; close: number } {
  let open = 0;
  let close = 0;
  for (const ch of code) {
    if (ch === "{" || ch === "(" || ch === "[") open++;
    if (ch === "}" || ch === ")" || ch === "]") close++;
  }
  return { open, close };
}

/** Re-indent brace-based languages (C, C++, Java) with 4-space levels. */
function reindentBraceLang(code: string, lang: CodeLang = "java"): string {
  const lines = code.split("\n");
  const out: string[] = [];
  const needsSemicolon: boolean[] = [];
  let depth = 0;
  let inBlockComment = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      out.push("");
      continue;
    }

    if (inBlockComment) {
      out.push(INDENT.repeat(Math.max(depth, 0)) + " " + trimmed);
      if (trimmed.includes("*/")) inBlockComment = false;
      continue;
    }

    // Preprocessor directives always sit at column 0.
    if (trimmed.startsWith("#")) {
      out.push(trimmed);
      continue;
    }

    const logical = stripLiterals(trimmed);
    const leadingClosers = (logical.match(/^[\}\)\]]+/) ?? [""])[0].length;
    const isCaseLabel = /^(case\b|default\s*:)/.test(trimmed);
    const isAccessLabel = /^(public|private|protected)\s*:$/.test(trimmed);

    let lineDepth = depth - leadingClosers;
    if (isCaseLabel || isAccessLabel) lineDepth -= 1;
    if (lineDepth < 0) lineDepth = 0;

    out.push(INDENT.repeat(lineDepth) + trimmed);

    const { open, close } = countDelta(logical);
    if (open > close && /\b(class|struct|union|enum)\b/.test(logical) && lang !== "java") {
      needsSemicolon[depth] = true;
    }
    depth += open - close;
    if (depth < 0) depth = 0;

    if (trimmed.includes("/*") && !trimmed.includes("*/")) inBlockComment = true;
  }

  // Close any unbalanced blocks so the template always compiles.
  let result = out.join("\n");
  if (depth > 0) {
    const closers: string[] = [];
    for (let d = depth - 1; d >= 0; d--)
      closers.push(INDENT.repeat(d) + (needsSemicolon[d] ? "};" : "}"));
    result += "\n" + closers.join("\n");
  }
  return result;
}

/** Normalize python-family indentation: dedent, fix ragged bodies, add pass. */
function reindentPython(code: string): string {
  const lines = code.split("\n");
  const meaningful = lines.filter((l) => l.trim());
  const minIndent = meaningful.length
    ? Math.min(...meaningful.map((l) => (l.match(/^ */) as RegExpMatchArray)[0].length))
    : 0;
  const dedented = lines.map((l) => (l.trim() ? l.slice(minIndent) : ""));

  const out: string[] = [];
  for (let i = 0; i < dedented.length; i++) {
    const line = dedented[i];
    const trimmed = line.trim();
    if (!trimmed) {
      out.push("");
      continue;
    }
    // Snap indentation to the nearest 4-space multiple (fixes 2/3/5-space drift).
    const indentSize = (line.match(/^ */) as RegExpMatchArray)[0].length;
    const level = Math.round(indentSize / 4);
    out.push(INDENT.repeat(level) + trimmed);

    // A block opener with no body following it is a syntax error -> add pass.
    if (/:\s*$/.test(trimmed)) {
      let j = i + 1;
      while (j < dedented.length && !dedented[j].trim()) j++;
      const nextIndent =
        j < dedented.length ? (dedented[j].match(/^ */) as RegExpMatchArray)[0].length : -1;
      if (j >= dedented.length || nextIndent <= indentSize) {
        out.push(INDENT.repeat(level + 1) + "pass");
      }
    }
  }
  return out.join("\n");
}

function ensureCMain(code: string, lang: "c" | "cpp"): string {
  if (/\bint\s+main\s*\(/.test(code)) return code;
  const main =
    lang === "c"
      ? "\n\nint main(void) {\n    /* TODO: call your function and print the result */\n    return 0;\n}"
      : "\n\nint main() {\n    // TODO: call your function and print the result\n    return 0;\n}";
  return code + main;
}

function ensureJavaShell(code: string): string {
  let out = code;
  if (!/\b(class|interface|enum|record)\s+\w+/.test(out)) {
    out = `class Solution {\n${out
      .split("\n")
      .map((l) => (l.trim() ? INDENT + l : ""))
      .join("\n")}\n}`;
  }
  if (!/static\s+void\s+main\s*\(/.test(out)) {
    const idx = out.lastIndexOf("}");
    const main = `\n${INDENT}public static void main(String[] args) {\n${INDENT}${INDENT}// TODO: call your solution and print the result\n${INDENT}}\n`;
    if (idx >= 0) out = out.slice(0, idx) + main + out.slice(idx);
  }
  return out;
}

/**
 * Returns starter code that is syntactically valid, canonically indented and
 * free of markdown/formatting artefacts for the given language.
 */
export function normalizeStarterCode(raw: unknown, lang: CodeLang): string {
  if (typeof raw !== "string" || !raw.trim()) return "";
  const cleaned = basicClean(raw);

  if (lang === "python" || lang === "pyspark") {
    return reindentPython(cleaned) + "\n";
  }

  let code = reindentBraceLang(cleaned, lang);
  if (lang === "java") code = reindentBraceLang(ensureJavaShell(code), lang);
  else code = reindentBraceLang(ensureCMain(code, lang), lang);
  return code + "\n";
}

/** Same cleanup for reference/model solutions shown to the user. */
export function normalizeSolutionCode(raw: unknown, lang: CodeLang): string {
  if (typeof raw !== "string" || !raw.trim()) return "";
  const cleaned = basicClean(raw);
  if (lang === "python" || lang === "pyspark") return reindentPython(cleaned) + "\n";
  return reindentBraceLang(cleaned, lang) + "\n";
}
