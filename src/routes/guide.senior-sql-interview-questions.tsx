import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const SITE = "https://smartsqlaimentor.live";
const URL = `${SITE}/guide/senior-sql-interview-questions`;
const TITLE = "Senior SQL Interview Questions — Advanced Practice Guide";
const DESC =
  "A senior-level SQL interview guide: window functions, recursive CTEs, query optimization and data-modelling questions, each with a worked answer and AI-mentor feedback.";

export const Route = createFileRoute("/guide/senior-sql-interview-questions")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESC,
          url: URL,
          about: "Senior SQL interview preparation",
        }),
      },
    ],
  }),
  component: SeniorSqlGuide,
});

const SECTIONS: { h: string; body: string; qs: { q: string; a: string }[] }[] = [
  {
    h: "Window functions",
    body:
      "Senior interviews rarely ask you to write a GROUP BY. They ask for running totals, gap-and-island detection, and per-partition ranking where a self-join would be too slow. Know the difference between ROWS and RANGE framing, and why RANK, DENSE_RANK and ROW_NUMBER produce different row counts after filtering.",
    qs: [
      {
        q: "Return each customer's most recent order without a correlated subquery.",
        a: "Rank inside the partition and filter the rank: SELECT * FROM (SELECT o.*, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at DESC) rn FROM orders o) t WHERE rn = 1. ROW_NUMBER guarantees exactly one row per customer even when two orders share a timestamp; RANK would return both.",
      },
      {
        q: "Compute a 7-day rolling revenue average per store.",
        a: "AVG(revenue) OVER (PARTITION BY store_id ORDER BY day RANGE BETWEEN INTERVAL 6 DAY PRECEDING AND CURRENT ROW). RANGE on a date column handles missing days correctly; ROWS BETWEEN 6 PRECEDING silently averages the last 7 *rows*, which is wrong when a store has no sales on some days.",
      },
      {
        q: "Find consecutive streaks of active days per user (gaps and islands).",
        a: "Subtract a row number from the date: day - INTERVAL ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day) DAY gives a constant island key. Group by that key to get streak start, end and length.",
      },
    ],
  },
  {
    h: "Recursive CTEs",
    body:
      "Hierarchies, bill-of-materials explosions and date spines are the standard senior probes. The interviewer is watching for a termination condition, cycle protection and an awareness that recursion is a loop, not a set operation.",
    qs: [
      {
        q: "List every employee under a given manager, with depth.",
        a: "WITH RECURSIVE tree AS (SELECT id, manager_id, name, 1 AS depth FROM employees WHERE id = ? UNION ALL SELECT e.id, e.manager_id, e.name, t.depth + 1 FROM employees e JOIN tree t ON e.manager_id = t.id) SELECT * FROM tree. Add a path column and a NOT LIKE check on it if the data can contain cycles.",
      },
      {
        q: "Generate a continuous calendar to fill reporting gaps.",
        a: "Recurse from the min date adding one day until the max date, then LEFT JOIN facts onto the spine. This is what turns a sparse events table into a chart-ready series without client-side gap filling.",
      },
    ],
  },
  {
    h: "Query optimization",
    body:
      "At senior level, correctness is assumed and performance is the interview. Read the plan out loud: access method, join order, join algorithm, row estimates versus actuals. Say why the optimizer chose what it chose before proposing an index.",
    qs: [
      {
        q: "A query on a 200M-row table suddenly got slow. Walk through your diagnosis.",
        a: "Compare estimated versus actual rows in EXPLAIN ANALYZE — a large gap points at stale statistics or a non-sargable predicate. Check for functions wrapping indexed columns (DATE(created_at) = ...), implicit type casts, leading wildcards, and OR chains that defeat index usage. Only then consider a covering or composite index, ordered by equality columns first, range column last.",
      },
      {
        q: "When is a composite index better than two single-column indexes?",
        a: "When the query filters on both columns together. An index merge of two single-column indexes costs an extra intersection step; a composite index on (tenant_id, created_at) serves the filter and the sort in one range scan, and can become covering if you add the selected columns.",
      },
      {
        q: "How do you make a skewed join scale?",
        a: "Identify the hot key, then either pre-aggregate the large side before joining, split the hot key into its own branch and UNION the results, or salt the key. In warehouses, also check partition pruning and clustering keys before touching the SQL.",
      },
    ],
  },
  {
    h: "Data modelling and semantics",
    body:
      "Expect design discussion: slowly changing dimensions, grain, idempotent loads and how you would model late-arriving facts. Answer with the grain first — most wrong answers are wrong because the grain was never stated.",
    qs: [
      {
        q: "How do you model an attribute that changes over time?",
        a: "SCD type 2: one row per version with valid_from / valid_to and an is_current flag. Joins from the fact use the fact timestamp against the validity range, so historical reports stay correct after the attribute changes.",
      },
      {
        q: "How do you make a nightly load idempotent?",
        a: "Make the batch deterministic by partition: delete-and-insert the affected partitions inside a transaction, or MERGE on a natural key with a deterministic dedupe (ROW_NUMBER over the key ordered by ingestion time). Re-running the same input must produce the same table.",
      },
    ],
  },
];

const CHECKLIST = [
  "State the grain before writing SQL",
  "Prefer window functions over correlated subqueries",
  "Know ROWS vs RANGE framing",
  "Read EXPLAIN plans, not just runtimes",
  "Watch for non-sargable predicates",
  "Handle NULLs in joins and aggregates explicitly",
  "Design composite indexes equality-first",
  "Make pipelines idempotent and re-runnable",
];

function SeniorSqlGuide() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-primary">Guide</p>
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Senior SQL Interview Questions
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Senior SQL rounds are not about syntax. They are about whether you can reason over a
          query plan, defend a data model, and explain the trade-off you just made. This guide
          collects the questions that actually separate senior candidates, with the answer a
          Senior Data Engineer interviewer is listening for — the same reasoning the AI mentor in
          the{" "}
          <Link to="/mysql" className="text-primary hover:underline">
            SQL playground
          </Link>{" "}
          gives on every submission.
        </p>

        <div className="mb-12 flex flex-wrap gap-3">
          <Link
            to="/mysql"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Practice these live <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/interview"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent"
          >
            Try a mock interview
          </Link>
        </div>

        {SECTIONS.map((s) => (
          <section key={s.h} className="mb-12">
            <h2 className="mb-3 text-2xl font-semibold tracking-tight text-foreground">{s.h}</h2>
            <p className="mb-5 text-muted-foreground">{s.body}</p>
            <div className="space-y-4">
              {s.qs.map((item) => (
                <article key={item.q} className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="text-base font-semibold text-foreground">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">
            Senior checklist
          </h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CHECKLIST.map((c) => (
              <li key={c} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> {c}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-foreground">
            How the AI mentor grades senior answers
          </h2>
          <p className="text-muted-foreground">
            Every submission is read semantically, not string-matched, so a correct answer written
            differently from the reference solution still passes. Alongside the verdict you get a
            performance note (why your plan would or would not hold at scale) and a best-practice
            tip. Deepen the theory in the{" "}
            <Link to="/tutorial" className="text-primary hover:underline">
              MySQL visual tutorial
            </Link>
            , drill warehouse-side design in the{" "}
            <Link to="/gcp-data-engineer-interview" className="text-primary hover:underline">
              GCP data engineer bank
            </Link>
            , or browse the broader{" "}
            <Link to="/sql-interview-questions" className="text-primary hover:underline">
              SQL interview question set
            </Link>
            .
          </p>
        </section>

        <div className="rounded-2xl border border-border bg-surface-2 p-8 text-center">
          <h2 className="mb-3 text-xl font-semibold text-foreground">Ready for the senior round?</h2>
          <Link
            to="/mysql"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground"
          >
            Open the SQL Playground <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}