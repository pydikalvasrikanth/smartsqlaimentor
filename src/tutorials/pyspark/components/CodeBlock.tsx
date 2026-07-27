import { useMemo } from "react";

const KEYWORDS = new Set([
  "False","None","True","and","as","assert","async","await","break","class","continue",
  "def","del","elif","else","except","finally","for","from","global","if","import","in",
  "is","lambda","nonlocal","not","or","pass","raise","return","try","while","with","yield",
  "match","case",
]);
const BUILTINS = new Set([
  "print","len","range","list","dict","set","tuple","str","int","float","bool","bytes",
  "map","filter","zip","enumerate","sum","min","max","abs","open","type","isinstance",
  "SparkSession","SparkContext","DataFrame","Row","Column","Window","StorageLevel",
  "functions","F","types","pd","pyspark","sql","spark","StructType","StructField",
  "IntegerType","LongType","StringType","DoubleType","FloatType","BooleanType",
  "TimestampType","DateType","ArrayType","MapType","GroupedData","Series","DataFrameWriter",
  "DataFrameReader","StreamingQuery","broadcast","udf","pandas_udf","col","lit","when",
  "expr","from_json","to_json","window","sum","avg","count","countDistinct","row_number",
  "rank","dense_rank","lag","lead","year","month","day","upper","lower","coalesce",
]);

function tokenize(src: string) {
  const tokens: { type: string; value: string }[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    // line comment
    if (c === "#") {
      const end = src.indexOf("\n", i);
      const stop = end === -1 ? src.length : end;
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
    // single-quoted string
    if (c === "'") {
      if (src.slice(i, i + 3) === "'''") {
        const end = src.indexOf("'''", i + 3);
        const stop = end === -1 ? src.length : end + 3;
        tokens.push({ type: "st", value: src.slice(i, stop) });
        i = stop;
        continue;
      }
      let j = i + 1;
      while (j < src.length && src[j] !== "'") {
        if (src[j] === "\\") j++;
        j++;
      }
      tokens.push({ type: "st", value: src.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    // decorator
    if (c === "@") {
      let j = i + 1;
      while (j < src.length && /[A-Za-z0-9_.]/.test(src[j])) j++;
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
      else if (word === "self" || word === "cls") type = "kw";
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
          {caption ?? "Python"}
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