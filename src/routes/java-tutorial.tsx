import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen } from "lucide-react";
import { HeaderTimer } from "@/components/HeaderTimer";

export const Route = createFileRoute("/java-tutorial")({
  head: () => ({
    meta: [
      { title: "Java Visual Explainer — Interactive Java Tutorial" },
      {
        name: "description",
        content:
          "Learn Java visually: JVM internals, OOP, collections, generics, streams, concurrency and memory model explained with infographic-style walkthroughs.",
      },
      { property: "og:title", content: "Java Visual Explainer — Interactive Java Tutorial" },
      {
        property: "og:description",
        content: "Visual Java tutorial: JVM, OOP, collections, streams, threads and memory — explained step by step.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.live/java-tutorial" }],
  }),
  component: JavaTutorialPage,
});

function JavaTutorialPage() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-surface-2/60 backdrop-blur z-10 shrink-0">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/java" aria-label="Back to Java playground" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight">Java Visual Explainer</h1>
            <p className="text-[11px] text-muted-foreground font-mono">interactive tutorial · basics to advanced</p>
          </div>
          <div className="ml-auto">
            <HeaderTimer storageKey="header_timer:java" />
          </div>
        </div>
      </header>
      <iframe src="/java-visual-explainer.html" title="Java Visual Explainer" className="flex-1 w-full border-0" />
    </div>
  );
}