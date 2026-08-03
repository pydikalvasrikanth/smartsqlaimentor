import { useEffect, useState } from "react";
import * as RSCE from "react-simple-code-editor";
import { highlightWithPrism, loadPrismLanguage } from "@/lib/prism-setup";
import "prismjs/themes/prism-tomorrow.css";

function resolveEditor(mod: any): any {
  let cur = mod;
  for (let i = 0; i < 4; i++) {
    if (typeof cur === "function") return cur;
    if (cur && typeof cur.default !== "undefined") { cur = cur.default; continue; }
    if (cur && typeof cur.Editor === "function") return cur.Editor;
    break;
  }
  return cur;
}
const Editor: any = resolveEditor(RSCE);

interface Props {
  value: string;
  onChange: (v: string) => void;
  height?: string;
}

/** CDN-free SQL editor used when Monaco can't load. */
export function PlainSqlEditor({ value, onChange, height = "260px" }: Props) {
  const [, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadPrismLanguage("sql").then(() => {
      if (!cancelled) setVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="rounded-md border border-border overflow-auto bg-[#1d2238]"
      style={{ height, touchAction: "pan-y" }}
    >
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={(code: string) => highlightWithPrism(code, "sql")}
        padding={12}
        tabSize={2}
        insertSpaces={true}
        textareaClassName="outline-none"
        textareaId="sql-plain-editor"
        className="min-h-full"
        style={{
          fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 13,
          lineHeight: 1.6,
          minHeight: "100%",
          color: "#e8eaf3",
          caretColor: "#bdaaff",
        }}
        spellCheck={false}
      />
    </div>
  );
}