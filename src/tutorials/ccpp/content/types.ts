export type Track = "c" | "cpp";

export type CodeExample = { code: string; caption?: string };

export type BeforeAfter = {
  kind: "beforeAfter";
  before: { title: string; rows: string[][]; headers?: string[] };
  after: { title: string; rows: string[][]; headers?: string[] };
  note?: string;
};

export type DiagramKind =
  | "memory-layout"
  | "pointer-arrow"
  | "stack-frame"
  | "heap-vs-stack"
  | "vtable"
  | "class-tree"
  | "vector-grow"
  | "linked-list"
  | "compilation-pipeline"
  | "threads"
  | "smart-pointer"
  | "move-vs-copy";

export type DiagramCard = {
  kind: "diagram";
  diagram: DiagramKind;
  caption?: string;
};

export type CalloutCard = {
  kind: "callout";
  tone: "tip" | "warn" | "note";
  text: string;
};

export type ComplexityCard = {
  kind: "complexity";
  rows: { op: string; big_o: string; note?: string }[];
};

export type PitfallCard = {
  kind: "pitfall";
  items: string[];
};

export type InterviewCard = {
  kind: "interview";
  q: string;
  a: string;
};

export type QuizCard = {
  kind: "quiz";
  question: string;
  options: string[];
  correct: number;
  explain: string;
};

export type TryItCard = {
  kind: "tryIt";
  code: string;
  lang?: "c" | "cpp";
  caption?: string;
};

export type ConceptCard = {
  kind: "concept";
  number: number;
  title: string;
  color: string; // accent color for badge & border
  description: string;
  syntax?: CodeExample;
  example?: CodeExample;
  output?: string;
  note?: string;
  extras?: Extra[];
};
export type Extra =
  | BeforeAfter
  | DiagramCard
  | CalloutCard
  | ComplexityCard
  | PitfallCard
  | InterviewCard
  | QuizCard
  | TryItCard;

export type Card = ConceptCard;

export type Lesson = {
  id: string;
  title: string;
  tagline: string;
  intro?: string; // module-header intro sentence
  examples?: string; // "Examples: printf, scanf, ..."
  cards: Card[];
};

export type Module = {
  id: string;
  title: string;
  color: string;
  description: string;
  lessons: Lesson[];
};

export type Curriculum = {
  track: Track;
  name: string; // "C" or "C++"
  tagline: string;
  accent: string;
  modules: Module[];
};

export function findLesson(curr: Curriculum, moduleId: string, lessonId: string) {
  const m = curr.modules.find((x) => x.id === moduleId);
  if (!m) return null;
  const l = m.lessons.find((x) => x.id === lessonId);
  if (!l) return null;
  return { module: m, lesson: l };
}

export function flatLessons(curr: Curriculum) {
  return curr.modules.flatMap((m) => m.lessons.map((l) => ({ module: m, lesson: l })));
}

export function neighbours(curr: Curriculum, moduleId: string, lessonId: string) {
  const flat = flatLessons(curr);
  const idx = flat.findIndex((x) => x.module.id === moduleId && x.lesson.id === lessonId);
  return {
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null,
    index: idx,
    total: flat.length,
  };
}
