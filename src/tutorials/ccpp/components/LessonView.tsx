import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import type { Curriculum, Module, Lesson } from "@/tutorials/ccpp/content/types";
import { neighbours } from "@/tutorials/ccpp/content/types";
import { ConceptCard } from "./cards/ConceptCard";
import { lessonKey, useProgress } from "@/tutorials/ccpp/hooks/useProgress";

export function LessonView({
  curriculum,
  module,
  lesson,
}: {
  curriculum: Curriculum;
  module: Module;
  lesson: Lesson;
}) {
  const { prev, next, index, total } = neighbours(curriculum, module.id, lesson.id);
  const route = curriculum.track === "c" ? "/cpp-tutorial/c/$moduleId/$lessonId" : "/cpp-tutorial/cpp/$moduleId/$lessonId";
  const trackRoute = curriculum.track === "c" ? "/c" : "/cpp";
  const navigate = useNavigate();
  const { isDone, toggle } = useProgress();
  const key = lessonKey(curriculum.track, module.id, lesson.id);
  const complete = isDone(key);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target && (e.target as HTMLElement).closest("input, textarea, [contenteditable=true]")) return;
      if (e.key === "ArrowRight" && next) {
        navigate({ to: route, params: { moduleId: next.module.id, lessonId: next.lesson.id } });
      } else if (e.key === "ArrowLeft" && prev) {
        navigate({ to: route, params: { moduleId: prev.module.id, lessonId: prev.lesson.id } });
      } else if (e.key.toLowerCase() === "m") {
        toggle(key);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, route, navigate, toggle, key]);

  const pct = Math.round(((index + 1) / total) * 100);
  return (
    <article className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <nav className="mono mb-4 flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
        <Link to="/cpp-tutorial" className="hover:text-foreground">Home</Link>
        <span>›</span>
        <Link to={trackRoute} className="hover:text-foreground">{curriculum.name}</Link>
        <span>›</span>
        <span style={{ color: module.color }}>{module.title}</span>
        <span>›</span>
        <span className="text-foreground">{lesson.title}</span>
      </nav>
      <div
        className="mb-8 animate-fade-in rounded-2xl border p-6 text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${module.color}, color-mix(in oklab, ${module.color} 55%, black))`,
          borderColor: module.color,
        }}
      >
        <div className="mono mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest opacity-90">
          <span>{curriculum.name} · {module.title}</span>
          <span className="rounded-full bg-black/40 px-3 py-1">{index + 1} / {total} · {pct}%</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{lesson.title}</h1>
        <p className="mt-2 text-sm text-white/90 md:text-base">{lesson.tagline}</p>
        {lesson.examples && (
          <p className="mono mt-3 text-xs text-white/80">
            <span className="opacity-70">Examples:</span> {lesson.examples}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => toggle(key)}
            className={`mono flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest transition ${
              complete
                ? "border-white bg-white text-black"
                : "border-white/60 text-white hover:bg-white/10"
            }`}
          >
            <span>{complete ? "✓ Completed" : "○ Mark complete"}</span>
          </button>
          <span className="mono text-[10px] uppercase tracking-widest text-white/70">
            shortcuts: ← prev · → next · M mark
          </span>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-black/30">
          <div className="h-full bg-white/90 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lesson.cards.map((c, i) => (
          <div key={i} className="animate-fade-in" style={{ animationDelay: `${Math.min(i, 6) * 60}ms`, animationFillMode: "both" }}>
            <ConceptCard card={c} />
          </div>
        ))}
      </div>

      <nav className="mt-10 flex items-center justify-between gap-4">
        {prev ? (
          <Link
            to={route}
            params={{ moduleId: prev.module.id, lessonId: prev.lesson.id }}
            className="flex-1 rounded-xl border border-border p-4 transition hover:border-[color:var(--java-orange)]"
          >
            <div className="mono text-xs text-muted-foreground">← Previous</div>
            <div className="mt-1 font-semibold">{prev.lesson.title}</div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <Link
            to={route}
            params={{ moduleId: next.module.id, lessonId: next.lesson.id }}
            className="flex-1 rounded-xl border border-border p-4 text-right transition hover:border-[color:var(--java-orange)]"
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