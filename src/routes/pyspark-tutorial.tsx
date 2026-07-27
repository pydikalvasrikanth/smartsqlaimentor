import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { ArrowLeft } from "lucide-react";
import { modules, flatLessons } from "@/tutorials/pyspark/content/pyspark-lessons";
import { useMounted } from "@/tutorials/pyspark/hooks/use-mounted";
import { ThreeScene } from "@/tutorials/pyspark/components/scenes/ThreeScene";

const HeroScene = lazy(() => import("@/tutorials/pyspark/components/scenes/JvmScene"));

export const Route = createFileRoute("/pyspark-tutorial")({
  head: () => ({
    meta: [
      { title: "PySpark Visual Explainer — Learn PySpark with 3D Visualizations" },
      { name: "description", content: "An interactive PySpark tutorial with 3D visualizations covering SparkSession, partitions, shuffles, Catalyst and structured streaming." },
      { property: "og:title", content: "PySpark Visual Explainer" },
      { property: "og:description", content: "Learn PySpark by watching it run — interactive 3D visualizations for every core concept." },
      { property: "og:url", content: "https://smartsqlaimentor.live/pyspark-tutorial" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.live/pyspark-tutorial" }],
  }),
  component: Landing,
});

function Landing() {
  const mounted = useMounted();
  const total = flatLessons().length;
  const first = flatLessons()[0];
  return (
    <div className="tut-dark min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[color:var(--java-orange)] text-[color:var(--primary-foreground)]">
              ⚡
            </span>
            PySpark Visual Explainer
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/pyspark"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to PySpark playground
            </Link>
            <Link
              to="/pyspark-tutorial/learn/$moduleId/$lessonId"
              params={{ moduleId: first.module.id, lessonId: first.lesson.id }}
              className="rounded-lg bg-[color:var(--java-orange)] px-4 py-2 font-semibold text-[color:var(--primary-foreground)] hover:opacity-90"
            >
              Start learning →
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden grid-bg">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <div className="mono mb-4 text-xs uppercase tracking-widest text-[color:var(--java-orange)]">
              Interactive · 3D · {total} lessons
            </div>
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Learn <span className="text-[color:var(--java-orange)]">PySpark</span> by
              <br /> watching it run.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              From your first <span className="mono text-foreground">SparkSession</span> to
              shuffles, Catalyst and structured streaming — every concept ships with an
              interactive 3D visualization you can rotate, zoom and inspect.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/pyspark-tutorial/learn/$moduleId/$lessonId"
                params={{ moduleId: first.module.id, lessonId: first.lesson.id }}
                className="rounded-lg bg-[color:var(--java-orange)] px-6 py-3 font-semibold text-[color:var(--primary-foreground)] hover:opacity-90"
              >
                Start with lesson 1
              </Link>
            </div>
            <div className="mt-8 flex gap-6 text-sm text-muted-foreground">
              <div>
                <div className="text-2xl font-bold text-foreground">{total}</div>
                lessons
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">9</div>
                3D scenes
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">4</div>
                modules
              </div>
            </div>
          </div>
          {mounted ? (
            <ThreeScene camera={[8, 4, 10]} height={420}>
              <Suspense fallback={null}>
                <HeroScene />
              </Suspense>
            </ThreeScene>
          ) : (
            <div className="grid h-[420px] place-items-center rounded-2xl border border-border bg-[color:var(--surface2)]">
              <span className="mono text-xs text-muted-foreground">Booting Spark…</span>
            </div>
          )}
        </div>
      </section>

      {/* Curriculum */}
      <section className="border-t border-border bg-[color:var(--surface2)]/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mono mb-3 text-xs uppercase tracking-widest text-[color:var(--java-orange)]">
            Curriculum
          </div>
          <h2 className="mb-2 text-3xl font-bold">Basics → Advanced, in {total} lessons</h2>
          <p className="mb-10 max-w-2xl text-muted-foreground">
            Four modules take you from your first SparkSession to the internals — partitions,
            shuffles, Catalyst — that make Spark scale to petabytes.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <div
                key={m.id}
                className="group rounded-2xl border border-border bg-[color:var(--surface2)] p-5 transition hover:border-[color:var(--java-orange)]"
              >
                <div
                  className="mono mb-3 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: m.color }}
                >
                  {m.title}
                </div>
                <div className="mb-4 text-sm text-muted-foreground">
                  {m.lessons.length} lessons
                </div>
                <ul className="space-y-1.5 text-sm">
                  {m.lessons.map((l) => (
                    <li key={l.id}>
                      <Link
                        to="/pyspark-tutorial/learn/$moduleId/$lessonId"
                        params={{ moduleId: m.id, lessonId: l.id }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {l.title}
                        {l.scene && <span className="ml-2 text-[10px] text-[color:var(--java-orange)]">3D</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Built with TanStack Start · React Three Fiber · love for PySpark.
      </footer>
    </div>
  );
}
