// Data Engineering curriculum for the "Data Engineering (MySQL)" practice mode.
// Drives the AI engine to simulate realistic day-to-day Data Engineering work
// (ETL/ELT, warehouse modeling, SCD, validation, production incidents) instead
// of puzzle/interview questions.

export type DeDifficulty = "beginner" | "intermediate" | "advanced" | "professional";

export interface DeLevel {
  level: number;
  name: string;
  difficulty: DeDifficulty;
  focus: string;
  blurb: string;
  concepts: string[]; // ordered kebab-case teaching tags
}

export interface DeCategory {
  key: string;
  label: string;
  emoji: string;
}

// Senior Data Engineer mentor context — biases schema + question generation
// toward production-grade Data Engineering scenarios. Kept compact (< ~1.5k chars)
// so the combined topic_prompt stays within the 2,000-char server limit.
export const DE_MENTOR_CONTEXT =
  `You are an elite Senior Data Engineer & Data Architect (ex-Google/Amazon/Uber/Netflix) acting as a hands-on mentor. ` +
  `Simulate REALISTIC day-to-day Data Engineering work, NOT puzzle/interview trivia. ` +
  `Use realistic business scenarios with production-grade tables (fact/dimension, staging, audit, source vs target). ` +
  `Default dialect MySQL 8.0. Each task must read like a real ticket: ETL/ELT loads, incremental/delta loads, idempotent reruns, ` +
  `CDC & merge/upsert, SCD Type 1/2, data cleaning & standardization, source↔target reconciliation, KPI/reporting, ` +
  `window analytics, query optimization, partitioning/pruning, late-arriving data, JSON/semi-structured, backfills, and incident RCA. ` +
  `Favor clean, maintainable, production-ready SQL and explain tradeoffs like a senior reviewer.`;

export const DE_CATEGORIES: DeCategory[] = [
  { key: "extraction", label: "Data Extraction", emoji: "🔎" },
  { key: "cleaning", label: "Data Cleaning", emoji: "🧹" },
  { key: "transformation", label: "Data Transformation", emoji: "🔁" },
  { key: "warehousing", label: "Data Warehousing", emoji: "🏛️" },
  { key: "etl", label: "ETL / ELT Development", emoji: "⚙️" },
  { key: "reporting", label: "Reporting & KPIs", emoji: "📊" },
  { key: "window", label: "Window Functions", emoji: "🪟" },
  { key: "advanced", label: "Advanced SQL", emoji: "🧠" },
  { key: "optimization", label: "Query Optimization", emoji: "🚀" },
  { key: "validation", label: "Data Validation", emoji: "✅" },
  { key: "production", label: "Production Engineering", emoji: "🛠️" },
  { key: "lakehouse", label: "Cloud & Lakehouse", emoji: "☁️" },
];

export const DE_LEVELS: DeLevel[] = [
  {
    level: 1,
    name: "Junior Data Engineer",
    difficulty: "beginner",
    focus: "SELECT, WHERE, ORDER BY, GROUP BY, HAVING, LIMIT, simple joins, basic aggregations.",
    blurb: "Foundations: extract, filter and aggregate clean data.",
    concepts: [
      "select-where",
      "order-by-limit",
      "distinct-values",
      "basic-aggregates",
      "group-by-having",
      "date-filtering",
      "conditional-filtering",
      "simple-inner-join",
    ],
  },
  {
    level: 2,
    name: "Associate Data Engineer",
    difficulty: "intermediate",
    focus: "Multi-table joins, subqueries, CTEs, data cleaning, validation, intermediate reporting.",
    blurb: "Combine sources, clean messy data and validate it.",
    concepts: [
      "multi-table-joins",
      "subqueries",
      "cte-basics",
      "null-handling-cleaning",
      "duplicate-detection",
      "data-standardization",
      "intermediate-reporting",
      "row-count-validation",
    ],
  },
  {
    level: 3,
    name: "Data Engineer",
    difficulty: "intermediate",
    focus: "Window functions, ETL logic, incremental loads, warehouse design, fact/dimension tables, KPI logic.",
    blurb: "Build pipelines, model warehouses and ship KPIs.",
    concepts: [
      "window-functions",
      "running-totals",
      "incremental-load-logic",
      "fact-dimension-modeling",
      "surrogate-keys",
      "revenue-kpi",
      "retention-churn-kpi",
      "pivot-transformation",
    ],
  },
  {
    level: 4,
    name: "Senior Data Engineer",
    difficulty: "advanced",
    focus: "SCD Type 1/2, CDC, merge logic, query optimization, partitioning, production troubleshooting.",
    blurb: "Own slowly-changing dimensions, CDC merges and tuning.",
    concepts: [
      "scd-type-2",
      "cdc-merge-upsert",
      "idempotent-rerun",
      "query-optimization-index",
      "partitioning-pruning",
      "late-arriving-data",
      "source-target-reconciliation",
      "production-backfill",
    ],
  },
  {
    level: 5,
    name: "Staff Data Engineer",
    difficulty: "advanced",
    focus: "Enterprise architecture, recursive CTEs, large-scale transformations, cost optimization, observability, incident RCA.",
    blurb: "Architect at scale: cost, observability and root-cause analysis.",
    concepts: [
      "recursive-cte",
      "enterprise-architecture",
      "large-scale-transformation",
      "cost-optimization",
      "json-semi-structured",
      "bronze-silver-gold",
      "schema-evolution-contracts",
      "incident-rca",
    ],
  },
];

export const DE_LEVEL_BY_NUMBER: Record<number, DeLevel> = Object.fromEntries(
  DE_LEVELS.map((l) => [l.level, l]),
) as Record<number, DeLevel>;

// Pick the next concept for a level, preferring uncovered ones for variety.
export function pickDeConcept(level: number, covered: string[], idx = 0): string {
  const lvl = DE_LEVEL_BY_NUMBER[level] ?? DE_LEVELS[0];
  const pool = lvl.concepts;
  const uncovered = pool.filter((c) => !covered.includes(c));
  if (uncovered.length) return uncovered[idx % uncovered.length];
  return pool[idx % pool.length];
}

// Build the topic_prompt sent to the AI engine for a given level + category.
export function buildDePrompt(level: number, categoryKey: string): string {
  const lvl = DE_LEVEL_BY_NUMBER[level] ?? DE_LEVELS[0];
  const cat = DE_CATEGORIES.find((c) => c.key === categoryKey);
  const catLine =
    cat && cat.key !== "mix"
      ? `Primary exercise category: ${cat.label}.`
      : `Rotate across categories (ETL, reporting, validation, warehousing, window functions, optimization, production incidents, lakehouse).`;
  return (
    `${DE_MENTOR_CONTEXT}\n\n` +
    `Difficulty level ${lvl.level} — ${lvl.name}. Focus: ${lvl.focus}\n${catLine}`
  ).slice(0, 1990);
}
