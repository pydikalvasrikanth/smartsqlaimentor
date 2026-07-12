import { memo } from "react";
import { Database } from "lucide-react";

interface Question {
  question_id: number;
  difficulty: string;
  business_context: string;
  task: string;
}

interface Props {
  question: Question | null;
  attempt: number;
  rightSlot?: React.ReactNode;
}

function QuestionCardImpl({ question, attempt, rightSlot }: Props) {
  if (!question) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Pick a topic to start your first challenge.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-2">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Database className="h-3.5 w-3.5" />
          Question #{question.question_id}
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
          <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground">
            {question.difficulty}
          </span>
          {attempt > 0 && (
            <span className="text-muted-foreground">attempt {attempt}</span>
          )}
          {rightSlot}
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            Business context
          </div>
          <p className="text-sm leading-relaxed text-foreground/85">
            {question.business_context}
          </p>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-primary-glow mb-1">
            Your task
          </div>
          <p className="text-sm leading-relaxed font-medium">{question.task}</p>
        </div>
      </div>
    </div>
  );
}
export const QuestionCard = memo(QuestionCardImpl);
