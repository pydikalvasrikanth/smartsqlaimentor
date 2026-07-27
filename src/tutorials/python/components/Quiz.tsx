import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Trophy, RotateCcw } from "lucide-react";
import type { QuizQ } from "@/tutorials/python/data/topics";
import { setQuizScore } from "@/tutorials/python/lib/progress";

export function Quiz({ topicId, questions }: { topicId: string; questions: QuizQ[] }) {
  const [i, setI] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [locked, setLocked] = useState<boolean>(false);
  const [done, setDone] = useState(false);

  const q = questions[i];

  function pick(idx: number) {
    if (locked) return;
    setLocked(true);
    const next = [...picks, idx];
    setPicks(next);
    setTimeout(() => {
      if (i >= questions.length - 1) {
        const correct = next.reduce((acc, p, k) => acc + (p === questions[k].answer ? 1 : 0), 0);
        setQuizScore(topicId, correct / questions.length);
        setDone(true);
      } else {
        setI(i + 1);
        setLocked(false);
      }
    }, 1200);
  }

  function reset() {
    setI(0); setPicks([]); setLocked(false); setDone(false);
  }

  if (done) {
    const correct = picks.reduce((acc, p, k) => acc + (p === questions[k].answer ? 1 : 0), 0);
    const pct = Math.round((correct / questions.length) * 100);
    const passed = pct >= 80;
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-surface p-6 text-center"
      >
        <Trophy className={`mx-auto h-10 w-10 mb-2 ${passed ? "text-primary" : "text-muted-foreground"}`} />
        <div className="text-2xl font-bold">{correct} / {questions.length}</div>
        <div className={`text-sm mb-4 ${passed ? "text-ok" : "text-muted-foreground"}`}>
          {passed ? "Passed! Topic marked complete." : "Not quite — try again to unlock."}
        </div>
        <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-2">
          <RotateCcw className="h-3.5 w-3.5" /> Retry
        </button>
      </motion.div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Question {i + 1} / {questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, k) => (
            <span
              key={k}
              className={`h-1.5 w-6 rounded-full ${
                k < picks.length
                  ? picks[k] === questions[k].answer ? "bg-ok" : "bg-destructive"
                  : k === i ? "bg-primary" : "bg-line"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="text-base font-medium mb-4">{q.q}</div>
      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          const isCorrect = idx === q.answer;
          const isPicked = locked && idx === picks[picks.length - 1];
          const state = !locked ? "idle" : isCorrect ? "correct" : isPicked ? "wrong" : "dim";
          return (
            <button
              key={idx}
              onClick={() => pick(idx)}
              disabled={locked}
              className={`w-full text-left rounded-md border px-3 py-2 text-sm transition flex items-center gap-2
                ${state === "idle" ? "border-border hover:bg-surface-2 hover:border-primary/40" : ""}
                ${state === "correct" ? "border-ok bg-ok/10 text-ok" : ""}
                ${state === "wrong" ? "border-destructive bg-destructive/10 text-destructive" : ""}
                ${state === "dim" ? "border-border opacity-40" : ""}`}
            >
              <span className="mono text-xs w-5 shrink-0">{String.fromCharCode(65 + idx)}.</span>
              <span className="flex-1">{opt}</span>
              {state === "correct" && <Check className="h-4 w-4" />}
              {state === "wrong" && <X className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {locked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mt-3 rounded-md border border-border bg-surface-2/60 px-3 py-2 text-xs text-muted-foreground"
          >
            <span className="text-foreground/80 font-medium">Why:</span> {q.explain}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}