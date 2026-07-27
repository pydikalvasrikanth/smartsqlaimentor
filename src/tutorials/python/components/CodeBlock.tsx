// Very lightweight Python syntax highlighter — enough to look designed, not perfect.
import { useMemo } from "react";

const KEYWORDS = new Set([
  "and","or","not","if","elif","else","for","while","break","continue","return","def","class","import","from","as","in","is","with","yield","lambda","try","except","finally","raise","pass","global","nonlocal","async","await","match","case",
]);
const BUILTINS = new Set([
  "print","input","len","range","list","dict","set","tuple","str","int","float","bool","type","isinstance","issubclass","open","enumerate","zip","map","filter","sorted","sum","min","max","abs","round","id","hash","super","object","Exception","ValueError","TypeError","KeyError","AttributeError","StopIteration","None","True","False",
]);

type Token = { t: string; c?: string };

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    // comment
    if (ch === "#") {
      let j = i;
      while (j < src.length && src[j] !== "\n") j++;
      out.push({ t: src.slice(i, j), c: "tok-com" });
      i = j;
      continue;
    }
    // string
    if (ch === '"' || ch === "'") {
      const quote = ch;
      const triple = src.slice(i, i + 3) === quote.repeat(3);
      let j = i + (triple ? 3 : 1);
      while (j < src.length) {
        if (triple && src.slice(j, j + 3) === quote.repeat(3)) { j += 3; break; }
        if (!triple && src[j] === quote && src[j-1] !== "\\") { j += 1; break; }
        if (!triple && src[j] === "\n") break;
        j++;
      }
      out.push({ t: src.slice(i, j), c: "tok-str" });
      i = j;
      continue;
    }
    // number
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < src.length && /[0-9._]/.test(src[j])) j++;
      out.push({ t: src.slice(i, j), c: "tok-num" });
      i = j;
      continue;
    }
    // ident
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j);
      let cls: string | undefined;
      if (KEYWORDS.has(word)) cls = "tok-kw";
      else if (BUILTINS.has(word)) cls = "tok-bi";
      else if (src[j] === "(") cls = "tok-fn";
      out.push({ t: word, c: cls });
      i = j;
      continue;
    }
    // operator-ish
    if (/[+\-*/%=<>!&|^~]/.test(ch)) {
      out.push({ t: ch, c: "tok-op" });
      i++;
      continue;
    }
    out.push({ t: ch });
    i++;
  }
  return out;
}

export function CodeBlock({ code, highlightLine }: { code: string; highlightLine?: number }) {
  const lines = useMemo(() => code.split("\n"), [code]);
  return (
    <pre className="mono text-[13px] leading-6 overflow-x-auto rounded-lg border border-border bg-surface-2/70 p-4">
      <code>
        {lines.map((ln, idx) => {
          const toks = tokenize(ln);
          const isHl = highlightLine === idx + 1;
          return (
            <div
              key={idx}
              className={`flex ${isHl ? "bg-primary/15 -mx-4 px-4" : ""}`}
            >
              <span className="mr-4 select-none text-muted-foreground/60 text-right w-6 shrink-0">{idx + 1}</span>
              <span className="flex-1">
                {toks.map((tk, ti) => (
                  <span key={ti} className={tk.c}>{tk.t}</span>
                ))}
                {"\u200b"}
              </span>
            </div>
          );
        })}
      </code>
    </pre>
  );
}