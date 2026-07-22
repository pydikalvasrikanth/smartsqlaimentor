// Prism ships as CJS; the default export can be undefined under certain SSR
// interop paths, which then leaves `globalThis.Prism` unset and any later
// prism-* component module throws `ReferenceError: Prism is not defined`
// during renderToReadableStream. Import as a namespace and fall back to it
// so we always end up with a real Prism instance.
import * as PrismNS from "prismjs";
const Prism: any =
  (PrismNS as any).default ?? (PrismNS as any).Prism ?? (PrismNS as any);

if (typeof globalThis !== "undefined") {
  (globalThis as any).Prism = Prism;
}

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