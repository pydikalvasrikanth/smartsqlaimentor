import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { LEVELS, TOPICS } from "@/tutorials/python/data/topics";
import { getProgress } from "@/tutorials/python/lib/progress";

export const Route = createFileRoute("/python-tutorial/")({
  head: () => ({
    meta: [
      { title: "Python Visual Explainer — Interactive lessons from basics to expert" },
      {
        name: "description",
        content:
          "Learn Python interactively: 35+ animated topics with live in-browser Python, step-through visualizations, and quizzes. From variables to metaclasses.",
      },
      { property: "og:title", content: "Python Visual Explainer — Interactive lessons from basics to expert" },
      {
        property: "og:description",
        content: "Interactive, animated Python lessons — basics to expert. Live Python in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.live/python-tutorial" }],
  }),
  component: TutorialIndex,
});

function TutorialIndex() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const sync = () => setCompleted(getProgress().completed);
    sync();
    window.addEventListener("pve-progress", sync);
    return () => window.removeEventListener("pve-progress", sync);
  }, []);

  const totalDone = Object.values(completed).filter(Boolean).length;
  const pct = Math.round((totalDone / TOPICS.length) * 100);

  return (
    <div className="px-5 sm:px-6 lg:px-10 py-10 max-w-5xl mx-auto">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary uppercase tracking-widest mb-4">
          <Sparkles className="h-3 w-3" /> Interactive · Animated · Live
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
          Learn Python <span className="text-primary">visually</span>,
          <br />
          from basics to expert.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
          {TOPICS.length} topics across {LEVELS.length} levels. Every lesson has an animated step-through of
          the code, a live Python playground powered by Pyodide, and a quick quiz to lock it in.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/python-tutorial/$topicId"
            params={{ topicId: TOPICS[0].id }}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 glow-gold"
          >
            Start at the beginning <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="text-xs text-muted-foreground">
            <span className="text-primary font-semibold">{totalDone}</span> of {TOPICS.length} complete
            {totalDone > 0 && ` · ${pct}%`}
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full max-w-md rounded-full bg-surface-2 overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </motion.div>

      {/* Levels */}
      <div className="space-y-10">
        {LEVELS.map((lvl, idx) => {
          const items = TOPICS.filter((t) => t.level === lvl.n);
          const done = items.filter((t) => completed[t.id]).length;
          return (
            <motion.section
              key={lvl.n}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <span className="mono text-primary text-sm">L{lvl.n}</span>
                  {lvl.name}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {done}/{items.length} done
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{lvl.blurb}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((topic) => {
                  const isDone = !!completed[topic.id];
                  return (
                    <Link
                      key={topic.id}
                      to="/python-tutorial/$topicId"
                      params={{ topicId: topic.id }}
                      className="group relative rounded-lg border border-border bg-surface p-4 hover:border-primary/50 hover:bg-surface-2/60 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{topic.emoji}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate">{topic.title}</span>
                            {isDone && <span className="text-[10px] text-ok">✓</span>}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {topic.tagline}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.section>
          );
        })}
      </div>

      <footer className="mt-16 pt-8 border-t border-border text-xs text-muted-foreground">
        Built with TanStack Start, Pyodide, and Framer Motion. Progress is saved to your browser only.
      </footer>
    </div>
  );
}