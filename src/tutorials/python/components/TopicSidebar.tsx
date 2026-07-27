import { Link, useRouterState } from "@tanstack/react-router";
import { LEVELS, TOPICS } from "@/data/topics";
import { useEffect, useState } from "react";
import { getProgress } from "@/lib/progress";
import { Check } from "lucide-react";

export function TopicSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const sync = () => setCompleted(getProgress().completed);
    sync();
    window.addEventListener("pve-progress", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pve-progress", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border bg-surface/50 h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto">
      <div className="p-4 space-y-6">
        {LEVELS.map((lvl) => {
          const items = TOPICS.filter((t) => t.level === lvl.n);
          const doneCount = items.filter((t) => completed[t.id]).length;
          return (
            <div key={lvl.n}>
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {lvl.n}. {lvl.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {doneCount}/{items.length}
                </span>
              </div>
              <ul className="space-y-0.5">
                {items.map((topic) => {
                  const isActive = pathname === `/learn/${topic.id}`;
                  const isDone = !!completed[topic.id];
                  return (
                    <li key={topic.id}>
                      <Link
                        to="/learn/$topicId"
                        params={{ topicId: topic.id }}
                        className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition ${
                          isActive
                            ? "bg-primary/15 text-primary font-medium"
                            : "text-foreground/80 hover:bg-surface-2 hover:text-foreground"
                        }`}
                      >
                        <span className="w-4 shrink-0 text-center">
                          {isDone ? <Check className="h-3.5 w-3.5 text-ok inline" /> : <span className="text-xs opacity-40">·</span>}
                        </span>
                        <span className="opacity-70">{topic.emoji}</span>
                        <span className="truncate">{topic.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </aside>
  );
}