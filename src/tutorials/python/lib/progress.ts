const KEY = "pve-progress-v1";

export type Progress = {
  completed: Record<string, boolean>;
  quizScores: Record<string, number>; // 0..1
};

function read(): Progress {
  if (typeof window === "undefined") return { completed: {}, quizScores: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { completed: {}, quizScores: {} };
    return JSON.parse(raw);
  } catch {
    return { completed: {}, quizScores: {} };
  }
}

function write(p: Progress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event("pve-progress"));
}

export function getProgress(): Progress {
  return read();
}

export function markComplete(topicId: string) {
  const p = read();
  p.completed[topicId] = true;
  write(p);
}

export function setQuizScore(topicId: string, score: number) {
  const p = read();
  p.quizScores[topicId] = score;
  if (score >= 0.8) p.completed[topicId] = true;
  write(p);
}

export function resetProgress() {
  write({ completed: {}, quizScores: {} });
}