import Editor, { type Monaco } from "@monaco-editor/react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  height: string;
  onMount: () => void;
}

/**
 * Monaco-backed SQL editor. Loaded lazily so the ~heavy Monaco loader never
 * lands in the first paint of a practice page — SqlEditor paints the
 * lightweight Prism editor instantly and swaps this in once it is ready.
 */
export default function MonacoSqlEditor({ value, onChange, height, onMount }: Props) {
  return (
    <Editor
      height={height}
      defaultLanguage="sql"
      value={value}
      onChange={(v: string | undefined) => onChange(v ?? "")}
      onMount={onMount}
      beforeMount={(monaco: Monaco) => {
        monaco.editor.defineTheme("sql-ide", {
          base: "vs-dark",
          inherit: true,
          rules: [
            { token: "keyword.sql", foreground: "a99cff", fontStyle: "bold" },
            { token: "operator.sql", foreground: "a99cff" },
            { token: "string.sql", foreground: "9be7c4" },
            { token: "number.sql", foreground: "ffd49b" },
            { token: "comment.sql", foreground: "6a7290", fontStyle: "italic" },
          ],
          colors: {
            "editor.background": "#1d2238",
            "editor.foreground": "#e8eaf3",
            "editorLineNumber.foreground": "#5b6385",
            "editorCursor.foreground": "#bdaaff",
            "editor.selectionBackground": "#3a3a7a55",
            "editor.lineHighlightBackground": "#262c47",
          },
        });
      }}
      theme="sql-ide"
      options={{
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        fontSize: 13,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        automaticLayout: true,
        lineNumbersMinChars: 3,
        padding: { top: 12, bottom: 12 },
        scrollbar: {
          alwaysConsumeMouseWheel: false,
          vertical: "auto",
          horizontal: "auto",
        },
      }}
      loading={null}
    />
  );
}
