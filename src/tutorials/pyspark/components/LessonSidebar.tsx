import { Link, useRouterState } from "@tanstack/react-router";
import { modules } from "@/content/pyspark-lessons";

export function LessonSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-border bg-[color:var(--sidebar)] py-6 md:block">
      <Link
        to="/"
        className="mx-6 mb-6 flex items-center gap-2 text-sm font-semibold text-foreground"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[color:var(--java-orange)] text-[color:var(--primary-foreground)]">
          ⚡
        </span>
        PySpark Explainer
      </Link>
      {modules.map((m) => (
        <div key={m.id} className="mb-5">
          <div
            className="mono mb-2 px-6 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: m.color }}
          >
            {m.title}
          </div>
          <ul>
            {m.lessons.map((l) => {
              const to = `/learn/${m.id}/${l.id}`;
              const active = pathname === to;
              return (
                <li key={l.id}>
                  <Link
                    to="/learn/$moduleId/$lessonId"
                    params={{ moduleId: m.id, lessonId: l.id }}
                    className={`block border-l-2 px-6 py-1.5 text-sm transition-colors ${
                      active
                        ? "border-[color:var(--java-orange)] bg-[color:var(--surface2)] text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {l.title}
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