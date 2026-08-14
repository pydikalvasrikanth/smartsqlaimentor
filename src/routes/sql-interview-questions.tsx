import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/sql-interview-questions")({
  head: () => ({
    meta: [
      { title: "SQL Interview Questions & Practice — Smart AI Code Playground" },
      { name: "description", content: "500+ AI-graded SQL interview questions with schemas, hints and semantic feedback. Practice joins, window functions, CTEs and query tuning for MNC interviews." },
      { property: "og:title", content: "SQL Interview Questions & Practice" },
      { property: "og:description", content: "AI-graded SQL interview practice — joins, windows, CTEs, tuning. Generated schemas, hints and instant feedback." },
      { property: "og:url", content: "https://smartsqlaimentor.live/sql-interview-questions" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.live/sql-interview-questions" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "How many SQL questions are covered?", acceptedAnswer: { "@type": "Answer", text: "Over 500 AI-generated SQL interview questions across joins, aggregation, window functions, CTEs, subqueries, indexing and query tuning." } },
            { "@type": "Question", name: "Which SQL dialect is used?", acceptedAnswer: { "@type": "Answer", text: "MySQL 8 syntax by default, with equivalent PostgreSQL and BigQuery variants for advanced topics." } },
            { "@type": "Question", name: "Is my solution graded automatically?", acceptedAnswer: { "@type": "Answer", text: "Yes — the AI mentor grades semantic correctness (not just string match), explains mistakes and suggests optimizations." } },
          ],
        }),
      },
    ],
  }),
  component: SqlLanding,
});

const TOPICS = [
  "SELECT & filtering", "JOIN patterns (INNER/LEFT/SEMI/ANTI)", "GROUP BY & aggregation",
  "Window functions (RANK, LAG, LEAD)", "Common Table Expressions (CTE)", "Recursive CTEs",
  "Subqueries & EXISTS", "Set operations (UNION, INTERSECT)", "Indexing & EXPLAIN",
  "Query tuning & partitioning", "Transactions & isolation levels", "Data modeling & normalization",
];

function SqlLanding() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">SQL practice</p>
        <h1 className="mb-4">SQL Interview Questions with AI Grading</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Practice 500+ SQL interview questions asked at Google, Amazon, Uber, Stripe and top Indian MNCs. Every question ships with a generated schema, seed data, hints, and semantic AI grading — not just answer matching.
        </p>
        <div className="flex flex-wrap gap-3 mb-12">
          <Link to="/mysql" className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90">
            Start practicing <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/tutorial" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent">
            MySQL tutorial
          </Link>
        </div>

        <h2 className="mb-4">Topics covered</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-12">
          {TOPICS.map((t) => (
            <li key={t} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> {t}
            </li>
          ))}
        </ul>

        <h2 className="mb-4">How the AI grades your SQL</h2>
        <p className="text-muted-foreground mb-4">
          Instead of comparing your query string to a canonical answer, the mentor runs semantic checks: does your result set match the expected rows and column semantics, does the join topology match, and is the query correct for edge cases in the seed data. When it disagrees with your solution, it explains why with plain-English feedback and suggests a rewrite.
        </p>
        <p className="text-muted-foreground mb-12">
          For window functions and CTEs — where two different queries can produce the same output — the grader inspects the execution shape, not just the output.
        </p>

        <h2 className="mb-4">Interview modes</h2>
        <div className="grid gap-4 sm:grid-cols-2 mb-12">
          <div className="rounded-xl border border-border p-5">
            <h3 className="mb-2">Free practice</h3>
            <p className="text-sm text-muted-foreground">Pick a topic, get a fresh question with schema + hints. Resume anytime — your progress is saved automatically.</p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <h3 className="mb-2">Live mock interview</h3>
            <p className="text-sm text-muted-foreground">Voice-driven AI interviewer with barge-in, adaptive difficulty and a post-interview scorecard.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-8 text-center">
          <h2 className="mb-3">Ready to level up your SQL?</h2>
          <p className="text-muted-foreground mb-5">Start a 15-question adaptive session — free.</p>
          <Link to="/mysql" className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium">
            Open SQL Playground <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}