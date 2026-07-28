import { useEffect, useRef, useState } from "react";
import { Play, Loader2, RotateCcw, AlertTriangle } from "lucide-react";

// Declare global loadPyodide function
declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<any>;
    __pyodidePromise?: Promise<any>;
  }
}

const PYODIDE_MIRRORS = [
  "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
  "https://pyodide-cdn2.iodide.io/v0.26.4/full/",
];

function injectScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-pyodide="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "1") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Pyodide")));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.dataset.pyodide = src;
    s.onload = () => {
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => reject(new Error("Failed to load Pyodide"));
    document.head.appendChild(s);
  });
}

function loadPyodideOnce() {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.__pyodidePromise) return window.__pyodidePromise;

  window.__pyodidePromise = (async () => {
    let lastErr: unknown = null;
    for (const base of PYODIDE_MIRRORS) {
      try {
        if (!window.loadPyodide) await injectScript(`${base}pyodide.js`);
        return await window.loadPyodide!({ indexURL: base });
      } catch (e) {
        lastErr = e;
      }
    }
    // Let a later attempt retry from scratch.
    window.__pyodidePromise = undefined;
    throw lastErr instanceof Error ? lastErr : new Error("Failed to load the Python runtime");
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
      setErr(
        "Couldn't load the Python runtime (it downloads ~5 MB from a CDN). Check your connection and press Run again."
      );
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
      // Fresh namespace per run so leftovers from a previous run can't leak.
      const globals = py.globals.get("dict")();
      try {
        await py.runPythonAsync(code, { globals });
      } finally {
        globals.destroy?.();
      }
    } catch (e: any) {
      chunks.push(String(e?.message ?? e));
    }
    py.setStdout({});
    py.setStderr({});
    setOutput(chunks.join("\n").replace(/\n+$/, ""));
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
              : <><Play className="h-3 w-3" />run <span className="hidden sm:inline opacity-60">⌘⏎</span></>}
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
          {err && (
            <span className="flex items-start gap-2 text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {err}
            </span>
          )}
          {!err && output === "" && status !== "running" && (
            <span className="text-muted-foreground">Press Run to execute. Pyodide loads on first run (~5MB).</span>
          )}
          {output}
        </pre>
      </div>
    </div>
  );
}