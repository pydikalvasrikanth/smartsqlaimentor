import { useEffect, useRef, useState } from "react";
import { Play, Loader2, RotateCcw } from "lucide-react";

// Declare global loadPyodide function
declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<any>;
    __pyodidePromise?: Promise<any>;
  }
}

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

function loadPyodideOnce() {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.__pyodidePromise) return window.__pyodidePromise;

  window.__pyodidePromise = (async () => {
    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = `${PYODIDE_URL}pyodide.js`;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load Pyodide script"));
        document.head.appendChild(s);
      });
    }
    const pyodide = await window.loadPyodide!({ indexURL: PYODIDE_URL });
    return pyodide;
  })();

  return window.__pyodidePromise;
}

export default function PyRunner({ initial }: { initial: string }) {
  const [code, setCode] = useState(initial);
  const [output, setOutput] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "ready">("idle");
  const [err, setErr] = useState<string | null>(null);
  const pyRef = useRef<any>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setCode(initial), [initial]);

  async function ensure() {
    if (pyRef.current) return pyRef.current;
    setStatus("loading");
    try {
      const py = await loadPyodideOnce();
      pyRef.current = py;
      setStatus("ready");
      return py;
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load Python runtime");
      setStatus("idle");
      throw e;
    }
  }

  async function run() {
    setErr(null);
    setOutput("");
    let py;
    try {
      py = await ensure();
    } catch {
      return;
    }
    setStatus("running");
    const chunks: string[] = [];
    py.setStdout({ batched: (s: string) => chunks.push(s) });
    py.setStderr({ batched: (s: string) => chunks.push(s) });
    try {
      await py.runPythonAsync(code);
    } catch (e: any) {
      chunks.push(String(e?.message ?? e));
    }
    setOutput(chunks.join("\n"));
    setStatus("ready");
  }

  // Tab key = 4 spaces
  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart, end = ta.selectionEnd;
      const next = code.slice(0, start) + "    " + code.slice(end);
      setCode(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      run();
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-2/60">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
          <span className="mono">python playground</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCode(initial)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-surface-2"
            title="Reset"
          >
            <RotateCcw className="h-3 w-3" /> reset
          </button>
          <button
            onClick={run}
            disabled={status === "running" || status === "loading"}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {status === "loading" ? <><Loader2 className="h-3 w-3 animate-spin" />loading python…</>
              : status === "running" ? <><Loader2 className="h-3 w-3 animate-spin" />running…</>
              : <><Play className="h-3 w-3" />run  <span className="opacity-60">⌘⏎</span></>}
          </button>
        </div>
      </div>
      <textarea
        ref={taRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={onKey}
        spellCheck={false}
        className="mono w-full min-h-[200px] resize-y bg-surface-2/40 p-4 text-[13px] leading-6 text-foreground outline-none"
      />
      <div className="border-t border-border">
        <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground bg-surface-2/60">
          output
        </div>
        <pre className="mono max-h-64 overflow-auto whitespace-pre-wrap p-4 text-[13px] leading-6 min-h-[60px]">
          {err && <span className="text-destructive">{err}</span>}
          {!err && output === "" && status !== "running" && (
            <span className="text-muted-foreground">Press Run to execute. Pyodide loads on first run (~5MB).</span>
          )}
          {output}
        </pre>
      </div>
    </div>
  );
}