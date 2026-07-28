import { createFileRoute, Link, notFound, useNavigate, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { TOPIC_BY_ID, TOPICS, neighborTopics, type Topic } from "@/tutorials/python/data/topics";
import { CodeBlock } from "@/tutorials/python/components/CodeBlock";
import { StepVisualizer } from "@/tutorials/python/components/StepVisualizer";
import { Quiz } from "@/tutorials/python/components/Quiz";
import { getProgress, markComplete } from "@/tutorials/python/lib/progress";

const PyRunner = lazy(() => import("@/tutorials/python/components/PyRunner"));

export const Route = createFileRoute("/python-tutorial/$topicId")({
  loader: ({ params }): { topic: Topic } => {
    const topic = TOPIC_BY_ID[params.topicId];
    if (!topic) throw notFound();
    return { topic };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Topic not found · Python Visual Explainer" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { topic } = loaderData;
    const title = `${topic.title} — Python Visual Explainer`;
    return {
      meta: [
        { title },
        { name: "description", content: topic.tagline },
        { property: "og:title", content: title },
        { property: "og:description", content: topic.tagline },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: TopicPage,
  notFoundComponent: TopicComingSoon,
});

function TopicComingSoon() {
  return (
    <div className="px-5 sm:px-6 lg:px-10 py-16 max-w-2xl mx-auto">
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <div className="text-4xl mb-3">🚧</div>
        <h1 className="text-2xl font-extrabold tracking-tight">This topic isn't published yet</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We're working on it — this lesson will be added soon. In the meantime, browse the topics that are
          already live.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/python-tutorial"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Browse all topics
          </Link>
          <Link
            to="/python-tutorial/$topicId"
            params={{ topicId: TOPICS[0].id }}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2"
          >
            Start from the beginning
          </Link>
        </div>
      </div>
    </div>
  );
}

function TopicPage() {
  const { topic } = Route.useLoaderData();
  const { prev, next } = neighborTopics(topic.id);
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(!!getProgress().completed[topic.id]);
    const sync = () => setDone(!!getProgress().completed[topic.id]);
    window.addEventListener("pve-progress", sync);
    return () => window.removeEventListener("pve-progress", sync);
  }, [topic.id]);

  const hasContent = topic.sections.length > 0 || !!topic.example?.code;
  if (!hasContent) return <TopicComingSoon />;

  return (
    <>
      <motion.article
        key={topic.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-5 sm:px-6 lg:px-10 py-8 max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span className="mono">L{topic.level}</span>
            <span>·</span>
            <span>{topic.levelName}</span>
            {done && (
              <span className="ml-auto flex items-center gap-1 text-ok">
                <CheckCircle2 className="h-3.5 w-3.5" /> Complete
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <span className="text-4xl">{topic.emoji}</span>
            {topic.title}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">{topic.tagline}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {topic.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-surface px-2 py-0.5 mono text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Explanation sections */}
        <section className="space-y-6 mb-10">
          {topic.sections.map((sec: { heading: string; body: string; code?: string }, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-xl border border-border bg-surface/60 p-5"
            >
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="mono text-xs text-primary">§ {idx + 1}</span>
                {sec.heading}
              </h3>
              <p className="text-sm text-foreground/85 leading-relaxed">{sec.body}</p>
              {sec.code && (
                <div className="mt-3">
                  <CodeBlock code={sec.code} />
                </div>
              )}
            </motion.div>
          ))}
        </section>

        {/* Step visualizer */}
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            {topic.example.trace ? "Animated step-through" : "Example"}
          </h2>
          {topic.example.trace ? (
            <StepVisualizer code={topic.example.code} trace={topic.example.trace} />
          ) : (
            <CodeBlock code={topic.example.code} />
          )}
        </section>

        {/* Live runner */}
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Try it live · Python runs in your browser
          </h2>
          <ClientOnly
            fallback={
              <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
                Loading playground…
              </div>
            }
          >
            <Suspense
              fallback={
                <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
                  Loading playground…
                </div>
              }
            >
              <PyRunner initial={topic.challenge?.starter ?? topic.example.code} />
            </Suspense>
          </ClientOnly>
          {topic.challenge && (
            <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
              <span className="mono text-[10px] uppercase tracking-widest text-primary mr-2">Challenge</span>
              {topic.challenge.prompt}
            </div>
          )}
        </section>

        {/* Quiz */}
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Checkpoint quiz</h2>
          <Quiz topicId={topic.id} questions={topic.quiz} />
        </section>

        {/* Manual complete + nav */}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-6">
          {prev ? (
            <Link
              to="/python-tutorial/$topicId"
              params={{ topicId: prev.id }}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <div className="text-left">
                <div className="text-[10px] uppercase text-muted-foreground">Prev</div>
                <div className="text-xs">{prev.title}</div>
              </div>
            </Link>
          ) : (
            <span />
          )}

          <button
            onClick={() => {
              markComplete(topic.id);
              if (next) navigate({ to: "/python-tutorial/$topicId", params: { topicId: next.id } });
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {done ? (next ? "Next topic" : "Finish") : "Mark complete →"}
          </button>

          {next ? (
            <Link
              to="/python-tutorial/$topicId"
              params={{ topicId: next.id }}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-2"
            >
              <div className="text-right">
                <div className="text-[10px] uppercase text-muted-foreground">Next</div>
                <div className="text-xs">{next.title}</div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      </motion.article>
    </>
  );
}
