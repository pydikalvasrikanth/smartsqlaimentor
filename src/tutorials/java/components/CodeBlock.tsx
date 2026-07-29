import { useMemo } from "react";

const KEYWORDS = new Set([
  "abstract","assert","boolean","break","byte","case","catch","char","class","const","continue",
  "default","do","double","else","enum","extends","final","finally","float","for","goto","if",
  "implements","import","instanceof","int","interface","long","native","new","package","private",
  "protected","public","record","return","sealed","permits","short","static","strictfp","super",
  "switch","synchronized","this","throw","throws","transient","try","void","volatile","while",
  "yield","var","non-sealed","when",
]);
const BUILTINS = new Set([
  "String","System","Math","Integer","Long","Double","Float","Boolean","Character","Byte","Short",
  "Object","List","ArrayList","LinkedList","Map","HashMap","Set","HashSet","LinkedHashMap",
  "Optional","Stream","IntStream","Collectors","Files","Path","Paths","StandardCharsets",
  "Scanner","Thread","Runnable","Executors","ExecutorService","Future","CompletableFuture",
  "ReentrantLock","AtomicInteger","Duration","Function","BiFunction","Predicate","Comparator",
  "Comparable","Iterator","Iterable","Class","Exception","RuntimeException","IOException",
  "NoSuchFileException","IllegalArgumentException","StringBuilder","PrintStream",
  "SpringApplication","StringBuffer","NotFoundException","ArrayIndexOutOfBoundsException",
  "ConcurrentModificationException","StackOverflowError","Direction","Shape","Animal","Dog",
  "Cat","Cow","Circle","Square","Point","User","Counter","Box","Hello","Ask","App","Number",
  "HelloController","Benchmark","Retention","RetentionPolicy","Target","ElementType","Drawable",
]);

function tokenize(src: string) {
  const tokens: { type: string; value: string }[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
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
    // strings (incl. text blocks)
    if (c === '"') {
      if (src.slice(i, i + 3) === '"""') {
        const end = src.indexOf('"""', i + 3);
        const stop = end === -1 ? src.length : end + 3;
        tokens.push({ type: "st", value: src.slice(i, stop) });
        i = stop;
        continue;
      }
      let j = i + 1;
      while (j < src.length && src[j] !== '"') {
        if (src[j] === "\\") j++;
        j++;
      }
      tokens.push({ type: "st", value: src.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    // char
    if (c === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== "'") {
        if (src[j] === "\\") j++;
        j++;
      }
      tokens.push({ type: "st", value: src.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    // annotation
    if (c === "@") {
      let j = i + 1;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      tokens.push({ type: "an", value: src.slice(i, j) });
      i = j;
      continue;
    }
    // number
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9._xXa-fA-FlLfFdD]/.test(src[j])) j++;
      tokens.push({ type: "nm", value: src.slice(i, j) });
      i = j;
      continue;
    }
    // identifier
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const word = src.slice(i, j);
      let type = "id";
      if (KEYWORDS.has(word)) type = "kw";
      else if (word === "true" || word === "false" || word === "null") type = "kw";
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
  cm: "text-muted-foreground italic",
  st: "text-[color:var(--teal)]",
  nm: "text-[color:var(--pink)]",
  bi: "text-[color:var(--java-blue)]",
  cl: "text-[color:var(--purple)]",
  an: "text-[color:var(--pink)]",
  id: "text-foreground",
  pn: "text-muted-foreground",
};

export function CodeBlock({ code, caption }: { code: string; caption?: string }) {
  const tokens = useMemo(() => tokenize(code), [code]);
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-border bg-[color:var(--surface2)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--teal)]/60" />
        </div>
        <span className="mono text-xs text-muted-foreground">
          {caption ?? "Java"}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="mono">
          {tokens.map((t, idx) => (
            <span key={idx} className={COLOR[t.type]}>
              {t.value}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}