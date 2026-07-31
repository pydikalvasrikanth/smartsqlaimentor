import { Link, useRouterState } from "@tanstack/react-router";
import type { Curriculum } from "@/content/types";
import { lessonKey, useProgress } from "@/hooks/useProgress";
import { flatLessons } from "@/content/types";

export function LessonSidebar({ curriculum, onNavigate }: { curriculum: Curriculum; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const route = curriculum.track === "c" ? "/c/$moduleId/$lessonId" : "/cpp/$moduleId/$lessonId";
  const badge = curriculum.track === "c" ? "C" : "C++";
  const { isDone } = useProgress();
  const total = flatLessons(curriculum).length;
  const done = flatLessons(curriculum).filter(({ module: m, lesson: l }) =>
    isDone(lessonKey(curriculum.track, m.id, l.id))
  ).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col overflow-y-auto border-r border-border bg-[color:var(--sidebar)] py-6">
      <Link to="/" onClick={onNavigate} className="mx-6 mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span
          className="grid h-8 w-8 place-items-center rounded-lg text-white"
          style={{ background: curriculum.accent }}
        >
          {badge}
        </span>
        {curriculum.name} Explainer
      </Link>
      <div className="mx-6 mb-4">
        <div className="mono mb-1 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Progress</span>
          <span>{done}/{total} · {pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--surface2)]">
          <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: curriculum.accent }} />
        </div>
      </div>
      <div className="mx-6 mb-5 flex gap-1 rounded-lg bg-[color:var(--surface2)] p-1 text-xs">
        <Link
          to="/c"
          onClick={onNavigate}
          className={`flex-1 rounded-md px-2 py-1 text-center font-semibold transition ${
            curriculum.track === "c" ? "bg-[color:var(--java-blue)] text-white" : "text-muted-foreground"
          }`}
        >
          C
        </Link>
        <Link
          to="/cpp"
          onClick={onNavigate}
          className={`flex-1 rounded-md px-2 py-1 text-center font-semibold transition ${
            curriculum.track === "cpp" ? "bg-[color:var(--purple)] text-white" : "text-muted-foreground"
          }`}
        >
          C++
        </Link>
      </div>
      {curriculum.modules.map((m) => (
        <div key={m.id} className="mb-5">
          <div
            className="mono mb-2 px-6 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: m.color }}
          >
            {m.title}
          </div>
          <ul>
            {m.lessons.map((l) => {
              const active = pathname.endsWith(`/${m.id}/${l.id}`);
              const complete = isDone(lessonKey(curriculum.track, m.id, l.id));
              return (
                <li key={l.id}>
                  <Link
                    to={route}
                    params={{ moduleId: m.id, lessonId: l.id }}
                    onClick={onNavigate}
                    className={`flex items-center gap-2 border-l-2 px-6 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-[color:var(--surface2)] text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                    style={active ? { borderLeftColor: m.color } : undefined}
                  >
                    <span
                      aria-hidden="true"
                      className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold"
                      style={{
                        background: complete ? m.color : "transparent",
                        border: complete ? "none" : "1px solid color-mix(in oklab, currentColor 40%, transparent)",
                        color: complete ? "white" : "transparent",
                      }}
                    >
                      ✓
                    </span>
                    <span className="truncate">{l.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}