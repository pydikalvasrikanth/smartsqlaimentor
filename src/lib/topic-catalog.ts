// Static MySQL topic catalog used by the planner and topic mastery pages.
// 16 topics × 4 tiers. Deterministic order for curriculum generation.

export type Tier = "beginner" | "intermediate" | "advanced" | "professional";

export interface Topic {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  // Concept tags per tier — used as `target_concept` to bias the AI question generator.
  concepts: Record<Tier, string[]>;
}

export const TIER_ORDER: Tier[] = ["beginner", "intermediate", "advanced", "professional"];

export const TOPICS: Topic[] = [
  {
    slug: "select-where",
    name: "SELECT & WHERE",
    emoji: "🎯",
    description: "Filtering, ordering, distinct, limit.",
    concepts: {
      beginner: ["select-basics", "where-filter", "order-limit", "distinct"],
      intermediate: ["multi-condition-where", "in-between-like", "null-filter"],
      advanced: ["regexp", "case-in-where"],
      professional: ["sargable-predicates", "predicate-pushdown"],
    },
  },
  {
    slug: "joins",
    name: "JOINs",
    emoji: "🔗",
    description: "Inner, left, right, self, cross.",
    concepts: {
      beginner: ["inner-join", "left-join"],
      intermediate: ["multi-join", "self-join", "anti-join"],
      advanced: ["semi-join", "join-on-derived-table"],
      professional: ["join-order-optimization", "hash-vs-nested-loop"],
    },
  },
  {
    slug: "aggregates",
    name: "Aggregates & GROUP BY",
    emoji: "Σ",
    description: "COUNT, SUM, AVG, MIN, MAX, HAVING.",
    concepts: {
      beginner: ["basic-aggregates", "group-by"],
      intermediate: ["having", "group-concat", "rollup"],
      advanced: ["filtered-aggregates", "conditional-count"],
      professional: ["aggregate-pushdown"],
    },
  },
  {
    slug: "subqueries",
    name: "Subqueries",
    emoji: "🔍",
    description: "Scalar, correlated, EXISTS, IN.",
    concepts: {
      beginner: ["scalar-subquery", "in-subquery"],
      intermediate: ["correlated-subquery", "exists"],
      advanced: ["lateral-derived"],
      professional: ["subquery-to-join-rewrite"],
    },
  },
  {
    slug: "ctes",
    name: "CTEs (WITH)",
    emoji: "📦",
    description: "Common table expressions.",
    concepts: {
      beginner: ["simple-cte"],
      intermediate: ["chained-cte", "cte-for-readability"],
      advanced: ["multi-cte-aggregation"],
      professional: ["cte-vs-subquery-perf"],
    },
  },
  {
    slug: "recursive-ctes",
    name: "Recursive CTEs",
    emoji: "🌳",
    description: "Hierarchies and graph walks.",
    concepts: {
      beginner: ["recursive-counter"],
      intermediate: ["org-hierarchy"],
      advanced: ["bill-of-materials", "shortest-path"],
      professional: ["cycle-detection"],
    },
  },
  {
    slug: "window-functions",
    name: "Window Functions",
    emoji: "🪟",
    description: "OVER, PARTITION BY, ranking, framing.",
    concepts: {
      beginner: ["row-number", "sum-over"],
      intermediate: ["rank", "dense-rank", "ntile"],
      advanced: ["lag-lead", "moving-average", "running-total"],
      professional: ["frame-clause", "named-windows"],
    },
  },
  {
    slug: "ranking",
    name: "Ranking & Top-N per group",
    emoji: "🏆",
    description: "Top-N within partitions.",
    concepts: {
      beginner: ["top-n-overall"],
      intermediate: ["top-n-per-group"],
      advanced: ["second-highest-per-group", "ties-handling"],
      professional: ["ranking-with-windowed-filter"],
    },
  },
  {
    slug: "string-functions",
    name: "String Functions",
    emoji: "🔤",
    description: "CONCAT, SUBSTRING, REPLACE, REGEXP.",
    concepts: {
      beginner: ["concat", "substring", "upper-lower"],
      intermediate: ["like-pattern", "replace", "trim-length"],
      advanced: ["regexp", "split-on-delimiter"],
      professional: ["regexp-perf"],
    },
  },
  {
    slug: "date-functions",
    name: "Date & Time",
    emoji: "📅",
    description: "DATE_ADD, DATEDIFF, DATE_FORMAT, INTERVAL.",
    concepts: {
      beginner: ["date-format", "date-add"],
      intermediate: ["datediff", "extract", "month-bucket"],
      advanced: ["fiscal-period", "rolling-window"],
      professional: ["timezone-aware"],
    },
  },
  {
    slug: "null-3vl",
    name: "NULLs & 3-Valued Logic",
    emoji: "Ø",
    description: "IS NULL, COALESCE, NOT IN traps.",
    concepts: {
      beginner: ["is-null", "coalesce-ifnull"],
      intermediate: ["null-in-aggregates", "null-in-joins"],
      advanced: ["not-in-3vl-trap"],
      professional: ["sql-92-vs-mysql-null"],
    },
  },
  {
    slug: "pivots",
    name: "Pivots",
    emoji: "🔄",
    description: "Rows → columns via CASE.",
    concepts: {
      beginner: ["pivot-with-case"],
      intermediate: ["dynamic-pivot"],
      advanced: ["pivot-aggregation"],
      professional: ["unpivot-via-union"],
    },
  },
  {
    slug: "set-ops",
    name: "Set Operations",
    emoji: "∪",
    description: "UNION, INTERSECT, EXCEPT patterns.",
    concepts: {
      beginner: ["union-all"],
      intermediate: ["union-distinct"],
      advanced: ["set-difference", "set-intersection"],
      professional: ["sorted-union-perf"],
    },
  },
  {
    slug: "indexing",
    name: "Indexing & EXPLAIN",
    emoji: "⚡",
    description: "Performance reasoning, index choice.",
    concepts: {
      beginner: ["primary-key-lookup"],
      intermediate: ["composite-index", "covering-index"],
      advanced: ["index-skip-scan", "explain-rows"],
      professional: ["index-strategy-design"],
    },
  },
  {
    slug: "transactions",
    name: "Transactions & Isolation",
    emoji: "🔒",
    description: "ACID, locking, isolation levels.",
    concepts: {
      beginner: ["begin-commit"],
      intermediate: ["read-committed-vs-rr"],
      advanced: ["deadlock-handling"],
      professional: ["mvcc-snapshot"],
    },
  },
  {
    slug: "json",
    name: "JSON Functions",
    emoji: "{}",
    description: "JSON_EXTRACT, JSON_TABLE, paths.",
    concepts: {
      beginner: ["json-extract"],
      intermediate: ["json-path-array"],
      advanced: ["json-table"],
      professional: ["jsonb-indexing"],
    },
  },
];

export const TOPIC_BY_SLUG: Record<string, Topic> = Object.fromEntries(
  TOPICS.map((t) => [t.slug, t]),
);

/** Pick a concept tag for a topic at a given tier. Falls back to lower tiers. */
export function pickConceptForTopic(topicSlug: string, tier: Tier, avoid: string[] = []): string {
  const topic = TOPIC_BY_SLUG[topicSlug];
  if (!topic) return "select-basics";
  const tierIdx = TIER_ORDER.indexOf(tier);
  for (let i = tierIdx; i >= 0; i--) {
    const pool = topic.concepts[TIER_ORDER[i]];
    const remaining = pool.filter((c) => !avoid.includes(c));
    if (remaining.length) return remaining[Math.floor(Math.random() * remaining.length)];
  }
  return topic.concepts.beginner[0];
}

/**
 * Deterministic curriculum generator.
 * Spreads N days across topics, ramping difficulty toward the user's target level.
 */
export function generateCurriculum(days: number, target: Tier): Array<{
  day_index: number;
  topic_slug: string;
  target_concept: string;
  difficulty: Tier;
}> {
  const targetIdx = TIER_ORDER.indexOf(target);
  // Each user covers all 16 topics, repeating until `days` is filled.
  // Difficulty starts at beginner and ramps linearly to target.
  const out: Array<{ day_index: number; topic_slug: string; target_concept: string; difficulty: Tier }> = [];
  for (let i = 0; i < days; i++) {
    const topic = TOPICS[i % TOPICS.length];
    // ramp: progress 0..1, then map to tier in [0, targetIdx]
    const progress = days > 1 ? i / (days - 1) : 1;
    const tierIdx = Math.min(targetIdx, Math.round(progress * targetIdx));
    const tier = TIER_ORDER[tierIdx];
    const concept = topic.concepts[tier]?.[0] ?? topic.concepts.beginner[0];
    out.push({
      day_index: i + 1,
      topic_slug: topic.slug,
      target_concept: concept,
      difficulty: tier,
    });
  }
  return out;
}
