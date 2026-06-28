import { useCallback } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/themes/prism-tomorrow.css";

const INDENT = "    ";

interface Props {
  value: string;
  onChange: (next: string) => void;
  minHeight?: number;
}

/**
 * Professional Python editor: Prism syntax highlighting + 4-space Tab/Shift+Tab
 * (via react-simple-code-editor) and Enter auto-indent that carries the
 * previous line's indentation, adding an extra level after `:` `(` `[` `{`.
 */
export function PythonEditor({ value, onChange, minHeight = 420 }: Props) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement | HTMLTextAreaElement>) => {
      // react-simple-code-editor already handles Tab / Shift+Tab via tabSize.
      // We only intercept Enter for Python-aware auto-indent.
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
    <div
      className="bg-[#1e1e1e] text-sm font-mono overflow-auto"
      style={{ minHeight }}
    >
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={(code) => Prism.highlight(code, Prism.languages.python, "python")}
        padding={14}
        tabSize={4}
        insertSpaces={true}
        onKeyDown={handleKeyDown}
        textareaClassName="outline-none"
        textareaId="python-editor"
        className="min-h-full"
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 14,
          lineHeight: 1.55,
          minHeight,
          caretColor: "#fff",
        }}
        spellCheck={false}
      />
    </div>
  );
}