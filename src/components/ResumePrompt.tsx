import { History, RotateCcw } from "lucide-react";
import { formatAgo } from "@/lib/resume";

interface ResumePromptProps {
  updatedAt: number;
  meta?: string;
  onResume: () => void;
  onDismiss: () => void;
}

export function ResumePrompt({ updatedAt, meta, onResume, onDismiss }: ResumePromptProps) {
  return (
    <div className="mb-3 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2.5 flex items-center gap-3 shadow-sm">
      <History className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">
          Continue where you left off?
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {formatAgo(updatedAt)}
          {meta ? ` · ${meta}` : ""}
        </p>
      </div>
      <button
        onClick={onResume}
        className="text-[11px] px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition font-medium"
      >
        Resume
      </button>
      <button
        onClick={onDismiss}
        className="text-[11px] px-2 py-1 rounded-md border border-border text-muted-foreground hover:bg-accent transition inline-flex items-center gap-1"
        title="Start fresh"
      >
        <RotateCcw className="h-3 w-3" />
        Start fresh
      </button>
    </div>
  );
}