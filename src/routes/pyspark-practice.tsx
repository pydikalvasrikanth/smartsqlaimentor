import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/pyspark-practice")({
  head: () => ({
    meta: [
      { title: "PySpark Practice — DataFrame, Window & Streaming Interview Questions" },
      { name: "description", content: "PySpark interview practice: DataFrame API, joins, window functions, UDFs, partitioning and structured streaming. AI-graded with real data-engineering scenarios." },
      { property: "og:title", content: "PySpark Practice — AI-Graded" },
      { property: "og:description", content: "PySpark DataFrame, window and streaming practice for data-engineering interviews." },
      { property: "og:url", content: "https://smartsqlaimentor.live/pyspark-practice" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.live/pyspark-practice" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: "PySpark Practice",
          teaches: "Apache Spark DataFrame API, window functions, joins, partitioning, and structured streaming",
          url: "https://smartsqlaimentor.live/pyspark-practice",
        }),
      },
    ],
  }),
  component: SparkLanding,
});

const TOPICS = [
  "DataFrame API vs Spark SQL", "Joins (broadcast, sort-merge, skew)", "Window functions",
  "UDFs & pandas UDFs", "Partitioning & bucketing", "Catalyst & AQE tuning",
  "Structured Streaming", "Delta Lake basics", "Checkpointing & watermarks",
  "Schema evolution", "Reading Parquet / ORC / Avro", "Job optimization patterns",
];

function SparkLanding() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">PySpark practice</p>
        <h1 className="mb-4">PySpark Interview Practice</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Real data-engineering scenarios: skewed joins, streaming pipelines, window analytics and Catalyst tuning. Every solution is graded against Spark 3.5 semantics with feedback on both correctness and performance.
        </p>
        <div className="flex flex-wrap gap-3 mb-12">
          <Link to="/pyspark" className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90">
            Start PySpark playground <ArrowRight className="h-4 w-4" />
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

        <h2 className="mb-4">Why PySpark matters for data engineers</h2>
        <p className="text-muted-foreground mb-12">
          PySpark is the default interview language at most data-platform teams (Databricks, Netflix, Uber, Airbnb). Comfort with the DataFrame API, execution plans and skew handling separates senior candidates from junior ones — this playground drills exactly those muscles.
        </p>

        <div className="rounded-2xl border border-border bg-surface-2 p-8 text-center">
          <Link to="/pyspark" className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium">
            Open PySpark Playground <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}