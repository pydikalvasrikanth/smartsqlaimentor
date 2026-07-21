import { useCallback, useEffect, useState } from "react";
import * as RSCE from "react-simple-code-editor";
import { highlightWithPrism, loadPrismLanguage } from "@/lib/prism-setup";
import "prismjs/themes/prism-tomorrow.css";
import { Maximize2, Minimize2 } from "lucide-react";

// react-simple-code-editor ships as CJS. Vite's interop sometimes exposes the
// module namespace instead of the default export, which makes React throw
// "Element type is invalid: ... got: object". Resolve the real component
// defensively so the editor works under both shapes.
// Vite wraps the CJS module so the namespace looks like
// { default: { default: EditorClass } }. Unwrap until we find a function.
function resolveEditor(mod: any): any {
  let cur = mod;
  for (let i = 0; i < 4; i++) {
    if (typeof cur === "function") return cur;
    if (cur && typeof cur.default !== "undefined") {
      cur = cur.default;
      continue;
    }
    if (cur && typeof cur.Editor === "function") return cur.Editor;
    break;
  }
  return cur;
}
const Editor: any = resolveEditor(RSCE);

const INDENT = "    ";

interface Props {
  value: string;
  onChange: (next: string) => void;
  minHeight?: number;
}

/**
 * Professional Java editor: Prism syntax highlighting + 4-space Tab/Shift+Tab
 * (via react-simple-code-editor) and Enter auto-indent that carries the
 * previous line's indentation, adding an extra level after `:` `(` `[` `{`.
 * Supports vertical resize and a maximize toggle so the user can grow the
 * editor against the question panel.
 */
export function JavaEditor({ value, onChange, minHeight = 420 }: Props) {
  const [maximized, setMaximized] = useState(false);
  const [, setGrammarVersion] = useState(0);
  const effectiveMin = maximized ? Math.max(minHeight, 720) : minHeight;

  useEffect(() => {
    let cancelled = false;
    loadPrismLanguage("java").then(() => {
      if (!cancelled) setGrammarVersion((version) => version + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement | HTMLTextAreaElement>) => {
      // react-simple-code-editor already handles Tab / Shift+Tab via tabSize.
      // We only intercept Enter for Java-aware auto-indent.
      if (e.key !== "Enter" || e.shiftKey) return;
      const ta = e.target as HTMLTextAreaElement;
      if (!(ta instanceof HTMLTextAreaElement)) return;
      const { selectionStart: s, selectionEnd: en, value: v } = ta;
      if (s !== en) return;
      e.preventDefault();
      e.stopPropagation();
      const lineStart = v.lastIndexOf("\n", s - 1) + 1;
      const curLine = v.slice(lineStart, s);
      const indent = curLine.match(/^ */)?.[0] ?? "";
      const trimmed = curLine.replace(/\s+$/, "");
      const extra = /[:\[\(\{]$/.test(trimmed) ? INDENT : "";
      const insert = "\n" + indent + extra;
      const next = v.slice(0, s) + insert + v.slice(en);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = s + insert.length;
      });
    },
    [onChange],
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMaximized((m) => !m)}
        title={maximized ? "Minimize editor" : "Maximize editor"}
        className="absolute top-1.5 right-1.5 z-10 inline-flex items-center gap-1 px-2 py-1 rounded bg-black/40 text-white/80 hover:text-white text-[10px] border border-white/10"
      >
        {maximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
        {maximized ? "Minimize" : "Maximize"}
      </button>
      <div
        className="bg-[#1e1e1e] text-sm font-mono overflow-auto resize-y"
        style={{ minHeight: effectiveMin, height: effectiveMin }}
      >
        <Editor
        value={value}
        onValueChange={onChange}
        highlight={(code: string) => highlightWithPrism(code, "java")}
        padding={14}
        tabSize={4}
        insertSpaces={true}
        onKeyDown={handleKeyDown}
        textareaClassName="outline-none"
        textareaId="java-editor"
        className="min-h-full"
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 14,
          lineHeight: 1.55,
          minHeight: effectiveMin,
          caretColor: "#fff",
        }}
        spellCheck={false}
        />
      </div>
    </div>
  );
}