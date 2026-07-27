import { Link } from "@tanstack/react-router";
import type { Curriculum } from "@/tutorials/ccpp/content/types";
import { flatLessons } from "@/tutorials/ccpp/content/types";

export function TrackIndex({ curriculum }: { curriculum: Curriculum }) {
  const total = flatLessons(curriculum).length;
  const route = curriculum.track === "c" ? "/c/$moduleId/$lessonId" : "/cpp/$moduleId/$lessonId";
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="font-mono mb-3 text-xs uppercase tracking-widest" style={{ color: curriculum.accent }}>
        {curriculum.name} · {curriculum.modules.length} modules · {total} lessons
      </div>
      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
        Learn <span style={{ color: curriculum.accent }}>{curriculum.name}</span> — basics to job-ready.
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{curriculum.tagline}</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {curriculum.modules.map((m, i) => (
          <div
            key={m.id}
            className="rounded-2xl border p-5"
            style={{ borderColor: `color-mix(in oklab, ${m.color} 35%, var(--border))`, background: "var(--card)" }}
          >
            <div
              className="font-mono mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: m.color }}
            >
              <span className="grid h-6 w-6 place-items-center rounded-full text-[10px] text-white" style={{ background: m.color }}>{i + 1}</span>
              Module {i + 1}
            </div>
            <h2 className="text-xl font-bold">{m.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {m.lessons.map((l) => (
                <li key={l.id}>
                  <Link to={route} params={{ moduleId: m.id, lessonId: l.id }}
                    className="text-muted-foreground transition hover:text-foreground">
                    · {l.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}