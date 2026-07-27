import { Link } from "@tanstack/react-router";
import { useMounted } from "@/tutorials/pyspark/hooks/use-mounted";
import type { Lesson, Module } from "@/tutorials/pyspark/content/pyspark-lessons";
import { neighbours } from "@/tutorials/pyspark/content/pyspark-lessons";
import { CodeBlock } from "@/tutorials/pyspark/components/CodeBlock";
import { SceneFor } from "@/tutorials/pyspark/components/SceneRegistry";

function Callout({ tone, text }: { tone: "tip" | "warn" | "note"; text: string }) {
  const colors = {
    tip: "border-[color:var(--teal)] bg-[color:var(--teal)]/10",
    warn: "border-destructive bg-destructive/10",
    note: "border-[color:var(--java-blue)] bg-[color:var(--java-blue)]/10",
  }[tone];
  const label = { tip: "TIP", warn: "WATCH OUT", note: "NOTE" }[tone];
  return (
    <div className={`my-4 rounded-xl border-l-4 p-4 ${colors}`}>
      <div className="mono mb-1 text-[10px] font-bold uppercase tracking-widest opacity-80">
        {label}
      </div>
      <div className="text-sm leading-relaxed">{text}</div>
    </div>
  );
}

export function LessonView({ module, lesson }: { module: Module; lesson: Lesson }) {
  const { prev, next, index, total } = neighbours(module.id, lesson.id);
  const mounted = useMounted();
  return (
    <article className="mx-auto max-w-3xl px-6 py-10">
      <div className="mono mb-3 text-xs uppercase tracking-widest" style={{ color: module.color }}>
        {module.title} · lesson {index + 1} of {total}
      </div>
      <h1 className="text-4xl font-bold tracking-tight">{lesson.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{lesson.tagline}</p>

      <div className="mt-8 space-y-1">
        {lesson.blocks.map((b, i) => {
          if (b.kind === "p") return <p key={i} className="my-4 leading-relaxed">{b.text}</p>;
          if (b.kind === "code") return <CodeBlock key={i} code={b.code} caption={b.caption} />;
          if (b.kind === "list")
            return (
              <ul key={i} className="my-4 space-y-2">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="mono text-[color:var(--java-orange)]">▸</span>
                    <span className="text-sm leading-relaxed">{it}</span>
                  </li>
                ))}
              </ul>
            );
          return <Callout key={i} tone={b.tone} text={b.text} />;
        })}
      </div>

      {lesson.scene && (
        <div className="my-8">
          {mounted ? (
            <SceneFor sceneKey={lesson.scene} />
          ) : (
            <div className="grid h-[420px] place-items-center rounded-2xl border border-border bg-[color:var(--surface2)]">
              <span className="mono text-xs text-muted-foreground">Loading 3D scene…</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-border bg-[color:var(--surface2)] p-6">
        <div className="mono mb-3 text-xs uppercase tracking-widest text-[color:var(--java-orange)]">
          Key takeaways
        </div>
        <ul className="space-y-2">
          {lesson.takeaways.map((t, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="mono text-[color:var(--teal)]">✓</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <nav className="mt-10 flex items-center justify-between gap-4">
        {prev ? (
          <Link
            to="/pyspark-tutorial/learn/$moduleId/$lessonId"
            params={{ moduleId: prev.module.id, lessonId: prev.lesson.id }}
            className="group flex-1 rounded-xl border border-border p-4 hover:border-[color:var(--java-orange)]"
          >
            <div className="mono text-xs text-muted-foreground">← Previous</div>
            <div className="mt-1 font-semibold">{prev.lesson.title}</div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <Link
            to="/pyspark-tutorial/learn/$moduleId/$lessonId"
            params={{ moduleId: next.module.id, lessonId: next.lesson.id }}
            className="group flex-1 rounded-xl border border-border p-4 text-right hover:border-[color:var(--java-orange)]"
          >
            <div className="mono text-xs text-muted-foreground">Next →</div>
            <div className="mt-1 font-semibold">{next.lesson.title}</div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </nav>
    </article>
  );
}