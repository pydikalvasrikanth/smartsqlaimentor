import type { ConceptCard, Curriculum, Lesson } from "./types";

/** Shared accent colors used across every lesson file. */
export const A = "var(--java-orange)";
export const B = "var(--java-blue)";
export const T = "var(--teal)";
export const P = "var(--purple)";
export const K = "var(--pink)";
export const G = "oklch(0.72 0.16 145)";
export const R = "var(--destructive)";

/** Concise concept-card factory (same signature the original lesson files use). */
export const c = (
  n: number,
  title: string,
  color: string,
  description: string,
  rest: Partial<ConceptCard> = {},
): ConceptCard => ({ kind: "concept", number: n, title, color, description, ...rest });

/** Appends extra lessons onto existing modules, keyed by module id. */
export function withExtraLessons(curr: Curriculum, extra: Record<string, Lesson[]>): Curriculum {
  return {
    ...curr,
    modules: curr.modules.map((m) =>
      extra[m.id] ? { ...m, lessons: [...m.lessons, ...extra[m.id]] } : m,
    ),
  };
}

/** Merges several extra-lesson maps into one. */
export function mergeExtras(...maps: Record<string, Lesson[]>[]): Record<string, Lesson[]> {
  const out: Record<string, Lesson[]> = {};
  for (const map of maps) {
    for (const [k, v] of Object.entries(map)) {
      out[k] = [...(out[k] ?? []), ...v];
    }
  }
  return out;
}
