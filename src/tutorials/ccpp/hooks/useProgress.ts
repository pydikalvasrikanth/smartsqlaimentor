import { useCallback, useEffect, useState } from "react";

const KEY = "cxx-progress-v1";

function read(): Record<string, true> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(v: Record<string, true>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
    window.dispatchEvent(new Event("cxx-progress"));
  } catch {
    /* quota */
  }
}

export function lessonKey(track: string, moduleId: string, lessonId: string) {
  return `${track}/${moduleId}/${lessonId}`;
}

export function useProgress() {
  const [map, setMap] = useState<Record<string, true>>({});

  useEffect(() => {
    setMap(read());
    const on = () => setMap(read());
    window.addEventListener("cxx-progress", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("cxx-progress", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  const toggle = useCallback((key: string) => {
    const cur = read();
    if (cur[key]) delete cur[key];
    else cur[key] = true;
    write(cur);
  }, []);

  const isDone = useCallback((key: string) => !!map[key], [map]);

  return { map, toggle, isDone };
}