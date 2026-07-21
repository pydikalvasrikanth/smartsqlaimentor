import Prism from "prismjs";

// Prism language components (prism-java, prism-c, etc.) reference a global
// `Prism` object. In an ESM build that global does not exist unless we set it
// ourselves before those component modules are evaluated.
(globalThis as any).Prism = Prism;

const loadedLanguages = new Set<string>();
const loadingLanguages = new Map<string, Promise<void>>();

const escapeHtml = (code: string) =>
  code.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });

async function importPrismLanguage(language: string) {
  switch (language) {
    case "python":
      await import("prismjs/components/prism-python");
      return;
    case "clike":
      await import("prismjs/components/prism-clike");
      return;
    case "c":
      await loadPrismLanguage("clike");
      await import("prismjs/components/prism-c");
      return;
    case "cpp":
      await loadPrismLanguage("c");
      await import("prismjs/components/prism-cpp");
      return;
    case "java":
      await loadPrismLanguage("clike");
      await import("prismjs/components/prism-java");
      return;
    default:
      return;
  }
}

export function loadPrismLanguage(language: string) {
  const normalized = language === "c++" ? "cpp" : language;
  if (loadedLanguages.has(normalized) || (Prism.languages as any)[normalized]) {
    loadedLanguages.add(normalized);
    return Promise.resolve();
  }
  const existing = loadingLanguages.get(normalized);
  if (existing) return existing;

  const promise = importPrismLanguage(normalized)
    .then(() => {
      loadedLanguages.add(normalized);
    })
    .catch((error) => {
      loadingLanguages.delete(normalized);
      console.error(error);
    });

  loadingLanguages.set(normalized, promise);
  return promise;
}

export function highlightWithPrism(code: string, language: string) {
  const normalized = language === "c++" ? "cpp" : language;
  const grammar = (Prism.languages as any)[normalized] ?? (Prism.languages as any).clike;
  if (!grammar) return escapeHtml(code);
  return Prism.highlight(code, grammar, normalized);
}

export { Prism };