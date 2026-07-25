import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/gcp-data-engineer-interview")({
  head: () => ({
    meta: [
      { title: "GCP Data Engineer Interview Questions — BigQuery, Dataflow, Pub/Sub" },
      { name: "description", content: "180+ curated GCP Data Engineer interview questions: BigQuery, Dataflow, Pub/Sub, Composer, IAM, Power BI and cost optimization — asked at Google, Stripe, Uber and top MNCs." },
      { property: "og:title", content: "GCP Data Engineer Interview Questions" },
      { property: "og:description", content: "BigQuery, Dataflow, Pub/Sub, Composer, IAM — with interviewer rationale and progress tracking." },
      { property: "og:url", content: "https://smartsqlaimentor.live/gcp-data-engineer-interview" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.live/gcp-data-engineer-interview" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: "GCP Data Engineer Interview Prep",
          teaches: "BigQuery, Dataflow, Pub/Sub, Composer, IAM, Power BI and cost optimization on Google Cloud",
          url: "https://smartsqlaimentor.live/gcp-data-engineer-interview",
        }),
      },
    ],
  }),
  component: GcpLanding,
});

const TOPICS = [
  "BigQuery architecture & pricing", "Partitioning & clustering", "SQL modeling & warehousing",
  "Dataflow (Apache Beam)", "Pub/Sub messaging patterns", "Cloud Composer / Airflow",
  "IAM & least-privilege design", "Cost optimization playbooks", "ETL vs ELT design",
  "Streaming ingestion", "Power BI reporting", "Data governance & lineage",
];

function GcpLanding() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">GCP Data Engineer</p>
        <h1 className="mb-4">GCP Data Engineer Interview Questions</h1>
        <p className="text-muted-foreground text-lg mb-8">
          180+ curated questions across BigQuery, Dataflow, Pub/Sub, Composer, IAM, SQL modeling and Power BI. Every answer ships with the interviewer's rationale — what they actually want to hear, and the follow-up they'll drop if you nail the first pass.
        </p>
        <div className="flex flex-wrap gap-3 mb-12">
          <Link to="/gcp" className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90">
            Open GCP question bank <ArrowRight className="h-4 w-4" />
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

        <h2 className="mb-4">How the question bank is organized</h2>
        <p className="text-muted-foreground mb-4">
          Filter by difficulty (Beginner, Intermediate, Advanced, Professional) and by topic. Mark questions as "Done" and they move to a Covered section — the bank never re-asks you the same one until you reset it. Progress is synced to your account, so you can leave and come back on any device.
        </p>
        <p className="text-muted-foreground mb-12">
          Every SQL / MySQL question is a full coding problem with an executable model answer and an explanation of every function used (window functions, CTEs, JSON operators, EXPLAIN plan reads).
        </p>

        <div className="rounded-2xl border border-border bg-surface-2 p-8 text-center">
          <h2 className="mb-3">Land your next data engineer role</h2>
          <Link to="/gcp" className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium">
            Start preparing <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}