import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

type SubjectLink =
  | "/"
  | "/auth"
  | "/faq"
  | "/mysql"
  | "/python"
  | "/java"
  | "/cpp"
  | "/pyspark"
  | "/gcp"
  | "/tutorial"
  | "/python-tutorial"
  | "/java-tutorial"
  | "/cpp-tutorial"
  | "/pyspark-tutorial"
  | "/sql-interview-questions"
  | "/python-coding-practice"
  | "/c-cpp-coding-practice"
  | "/pyspark-practice"
  | "/gcp-data-engineer-interview";

interface SubjectSeoShellProps {
  eyebrow: string;
  title: string;
  summary: string;
  overview: string[];
  topics: string[];
  workflow: string[];
  links: Array<{ to: SubjectLink; label: string; description: string }>;
}

export function SubjectSeoShell({
  eyebrow,
  title,
  summary,
  overview,
  topics,
  workflow,
  links,
}: SubjectSeoShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <section className="max-w-3xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-primary">{eyebrow}</p>
          <h1 className="text-3xl font-bold text-foreground sm:text-5xl">{title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{summary}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Sign in to start <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
            >
              Explore all subjects
            </Link>
          </div>
        </section>

        <section className="mt-14 border-t border-border pt-10">
          <h2 className="text-2xl font-semibold text-foreground">What you will practice</h2>
          <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
            {overview.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {topics.map((topic) => (
              <li key={topic} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {topic}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 border-t border-border pt-10">
          <h2 className="text-2xl font-semibold text-foreground">How a practice session works</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {workflow.map((step, index) => (
              <li key={step} className="border-l-2 border-primary pl-4">
                <p className="font-mono text-xs text-primary">Step {index + 1}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 border-t border-border pt-10">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Continue learning</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="border-b border-border py-4 text-left hover:border-primary"
              >
                <h3 className="font-semibold text-foreground">{link.label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{link.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}