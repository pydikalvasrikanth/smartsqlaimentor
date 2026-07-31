import { useMemo, useState } from "react";

// Combined C + C++ keyword / type / builtin sets.
const KEYWORDS = new Set([
  // C keywords
  "auto","break","case","const","continue","default","do","else","enum","extern","for","goto",
  "if","register","return","signed","sizeof","static","struct","switch","typedef","union",
  "unsigned","volatile","while","inline","restrict","_Atomic","_Bool","_Thread_local",
  // C++ additions
  "class","namespace","using","template","typename","this","new","delete","public","private",
  "protected","virtual","override","final","friend","operator","try","catch","throw","noexcept",
  "constexpr","consteval","constinit","explicit","mutable","nullptr","and","or","not","xor",
  "decltype","concept","requires","co_await","co_yield","co_return","import","module",
  "static_cast","dynamic_cast","const_cast","reinterpret_cast","typeid","alignas","alignof",
  "thread_local",
]);

const TYPES = new Set([
  "int","char","short","long","float","double","void","bool","size_t","ssize_t","ptrdiff_t",
  "uint8_t","uint16_t","uint32_t","uint64_t","int8_t","int16_t","int32_t","int64_t",
  "FILE","string","wstring","vector","map","unordered_map","set","unordered_set","list","deque",
  "array","pair","tuple","optional","variant","function","shared_ptr","unique_ptr","weak_ptr",
  "atomic","mutex","condition_variable","thread","jthread","future","promise","span","string_view",
  "T","U","K","V",
]);

const BUILTINS = new Set([
  "printf","scanf","malloc","free","calloc","realloc","memcpy","memset","memmove","strlen",
  "strcpy","strncpy","strcmp","strcat","fopen","fclose","fread","fwrite","fprintf","fscanf",
  "fgets","fputs","perror","exit","abort","assert","NULL","EOF","errno","true","false",
  "std","cout","cin","cerr","endl","make_shared","make_unique","move","forward","swap",
  "begin","end","size","push_back","emplace_back","pop_back","insert","erase","find","sort",
  "for_each","accumulate","transform","copy","lock_guard","unique_lock","async","launch",
]);

function tokenize(src: string) {
  const tokens: { type: string; value: string }[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    // preprocessor directive (whole line, but keep string highlighting nested by tokenizing tail)
    if (c === "#" && (i === 0 || src[i - 1] === "\n")) {
      const end = src.indexOf("\n", i);
      const stop = end === -1 ? src.length : end;
      tokens.push({ type: "pp", value: src.slice(i, stop) });
      i = stop;
      continue;
    }
    // line comment
    if (c === "/" && src[i + 1] === "/") {
      const end = src.indexOf("\n", i);
      const stop = end === -1 ? src.length : end;
      tokens.push({ type: "cm", value: src.slice(i, stop) });
      i = stop;
      continue;
    }
    // block comment
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? src.length : end + 2;
      tokens.push({ type: "cm", value: src.slice(i, stop) });
      i = stop;
      continue;
    }
    // double-quoted string
    if (c === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== '"') {
        if (src[j] === "\\") j++;
        j++;
      }
      tokens.push({ type: "st", value: src.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    // char literal
    if (c === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== "'") {
        if (src[j] === "\\") j++;
        j++;
      }
      tokens.push({ type: "ch", value: src.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    // number
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9._xXa-fA-FlLuU]/.test(src[j])) j++;
      tokens.push({ type: "nm", value: src.slice(i, j) });
      i = j;
      continue;
    }
    // identifier
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j);
      let type = "id";
      if (KEYWORDS.has(word)) type = "kw";
      else if (TYPES.has(word)) type = "ty";
      else if (BUILTINS.has(word)) type = "bi";
      else if (/^[A-Z]/.test(word)) type = "cl";
      tokens.push({ type, value: word });
      i = j;
      continue;
    }
    tokens.push({ type: "pn", value: c });
    i++;
  }
  return tokens;
}

const COLOR: Record<string, string> = {
  kw: "text-[color:var(--java-orange)]",
  ty: "text-[color:var(--java-blue)]",
  pp: "text-[color:var(--purple)]",
  cm: "text-muted-foreground italic",
  st: "text-[color:var(--teal)]",
  ch: "text-[color:var(--teal)]",
  nm: "text-[color:var(--pink)]",
  bi: "text-[color:var(--java-blue)]",
  cl: "text-[color:var(--purple)]",
  id: "text-foreground",
  pn: "text-muted-foreground",
};

export function CodeBlock({ code, caption }: { code: string; caption?: string }) {
  const tokens = useMemo(() => tokenize(code), [code]);
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n").length;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[color:var(--surface2)]">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--teal)]/60" />
        </div>
        <div className="flex items-center gap-3">
          <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {caption ?? "C / C++"}
          </span>
          <button
            onClick={copy}
            aria-label="Copy code"
            className="mono rounded-md border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition hover:border-[color:var(--java-orange)] hover:text-[color:var(--java-orange)]"
          >
            {copied ? "✓ copied" : "copy"}
          </button>
        </div>
      </div>
      <div className="flex overflow-x-auto text-[13px] leading-relaxed">
        <pre
          aria-hidden="true"
          className="mono select-none border-r border-border/60 bg-[color:var(--surface3)]/40 px-2 py-3 text-right text-muted-foreground/60"
        >
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </pre>
        <pre className="flex-1 p-3">
          <code className="mono">
            {tokens.map((t, idx) => (
              <span key={idx} className={COLOR[t.type]}>
                {t.value}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}