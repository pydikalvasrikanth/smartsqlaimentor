// Prism ships as CJS; the default export can be undefined under certain SSR
// interop paths, which then leaves `globalThis.Prism` unset and any later
// prism-* component module throws `ReferenceError: Prism is not defined`
// during renderToReadableStream. Import as a namespace and fall back to it
// so we always end up with a real Prism instance.
import * as PrismNS from "prismjs";

// Pick the candidate that actually looks like a Prism instance (has
// `.languages` + `.highlight`). Under some SSR interop paths `default` is a
// wrapper namespace, and using it leaves `globalThis.Prism` without those
// members, so prism-* component modules throw "Prism is not defined".
function resolvePrism(): any {
  const candidates = [
    (PrismNS as any).default,
    (PrismNS as any).Prism,
    (PrismNS as any).default?.default,
    (PrismNS as any).default?.Prism,
    PrismNS as any,
    (globalThis as any).Prism,
  ];
  for (const c of candidates) {
    if (c && c.languages && typeof c.highlight === "function") return c;
  }
  return undefined;
}

const Prism: any = resolvePrism();

if (typeof globalThis !== "undefined" && Prism) {
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
  // Grammar modules mutate the global Prism instance; only ever do that in the
  // browser so SSR can never evaluate them.
  if (typeof window === "undefined" || !Prism) return Promise.resolve();
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
  if (!Prism) return escapeHtml(code);
  const grammar = (Prism.languages as any)[normalized] ?? (Prism.languages as any).clike;
  if (!grammar) return escapeHtml(code);
  return Prism.highlight(code, grammar, normalized);
}

export { Prism };