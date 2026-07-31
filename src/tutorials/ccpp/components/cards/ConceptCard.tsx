import type { Card } from "@/content/types";
import { CodeBlock } from "../CodeBlock";
import { Diagram } from "./Diagram";
import { QuizCard } from "./QuizCard";
import { useState } from "react";

function BeforeAfter({ before, after, note }: any) {
  return (
    <div className="rounded-lg border border-border bg-[color:var(--surface2)] p-3">
      <div className="flex items-center gap-3">
        <MiniTable {...before} />
        <span className="text-2xl text-[color:var(--java-orange)]">→</span>
        <MiniTable {...after} />
      </div>
      {note && <div className="mt-2 text-xs text-muted-foreground">{note}</div>}
    </div>
  );
}

function MiniTable({ title, headers, rows }: { title: string; headers?: string[]; rows: string[][] }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="mono mb-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <table className="w-full border-collapse text-[11px]">
        {headers && (
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} className="border border-border bg-[color:var(--surface3)] px-2 py-1 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="mono border border-dashed border-border px-2 py-3 text-center text-muted-foreground" colSpan={headers?.length ?? 1}>
                (empty)
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="mono border border-border px-2 py-1">{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Callout({ tone, text }: { tone: "tip" | "warn" | "note"; text: string }) {
  const map = {
    tip: { color: "var(--teal)", label: "TIP" },
    warn: { color: "var(--destructive)", label: "WATCH OUT" },
    note: { color: "var(--java-blue)", label: "NOTE" },
  } as const;
  const { color, label } = map[tone];
  return (
    <div
      className="rounded-lg border-l-4 p-3 text-xs"
      style={{ borderLeftColor: color, background: `color-mix(in oklab, ${color} 10%, transparent)` }}
    >
      <div className="mono mb-1 text-[9px] font-bold uppercase tracking-widest" style={{ color }}>
        {label}
      </div>
      <div className="text-foreground/90">{text}</div>
    </div>
  );
}

function Complexity({ rows }: { rows: { op: string; big_o: string; note?: string }[] }) {
  return (
    <div className="rounded-lg border border-border bg-[color:var(--surface2)] p-3">
      <div className="mono mb-2 text-[9px] font-bold uppercase tracking-widest text-[color:var(--teal)]">
        Complexity
      </div>
      <table className="w-full text-[12px]">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border/60 first:border-0">
              <td className="mono py-1.5 pr-3 text-foreground">{r.op}</td>
              <td className="mono py-1.5 pr-3 font-bold text-[color:var(--java-orange)]">{r.big_o}</td>
              <td className="py-1.5 text-xs text-muted-foreground">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pitfalls({ items }: { items: string[] }) {
  return (
    <div
      className="rounded-lg border-l-4 p-3 text-xs"
      style={{ borderLeftColor: "var(--destructive)", background: "color-mix(in oklab, var(--destructive) 8%, transparent)" }}
    >
      <div className="mono mb-2 text-[9px] font-bold uppercase tracking-widest text-[color:var(--destructive)]">
        Common pitfalls
      </div>
      <ul className="space-y-1.5">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2 text-foreground/90">
            <span className="text-[color:var(--destructive)]">✕</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Interview({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-[color:var(--purple)]/40 bg-[color:var(--surface2)] p-3">
      <div className="mono mb-1 text-[9px] font-bold uppercase tracking-widest text-[color:var(--purple)]">
        Interview question
      </div>
      <div className="text-sm font-semibold text-foreground">{q}</div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="mono mt-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--purple)] hover:underline"
      >
        {open ? "− Hide answer" : "+ Show answer"}
      </button>
      {open && (
        <div className="mt-2 animate-fade-in rounded-md bg-[color:var(--surface3)] p-2 text-xs text-foreground/90">
          {a}
        </div>
      )}
    </div>
  );
}

function TryIt({ code, lang, caption }: { code: string; lang?: "c" | "cpp"; caption?: string }) {
  const url = `https://godbolt.org/#z:${encodeURIComponent(
    JSON.stringify({ sourcecode: code, language: lang === "cpp" ? "c++" : "c" })
  )}`;
  return (
    <div className="rounded-lg border border-[color:var(--teal)]/40 bg-[color:var(--surface2)] p-3">
      <div className="mono mb-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-[color:var(--teal)]">
        <span>Try it live</span>
        <a href={url} target="_blank" rel="noreferrer" className="hover:underline">Open in Compiler Explorer ↗</a>
      </div>
      <CodeBlock code={code} caption={caption ?? "try me"} />
    </div>
  );
}

export function ConceptCard({ card }: { card: Card }) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border bg-[color:var(--card)] p-4 shadow-sm"
      style={{ borderColor: `color-mix(in oklab, ${card.color} 35%, var(--border))` }}
    >
      <div className="flex items-center gap-3">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-[color:var(--primary-foreground)]"
          style={{ background: card.color }}
        >
          {card.number}
        </span>
        <h3 className="text-lg font-bold tracking-tight" style={{ color: card.color }}>
          {card.title}
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">{card.description}</p>

      {card.syntax && (
        <div>
          <div className="mono mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: card.color }}>
            Syntax
          </div>
          <CodeBlock code={card.syntax.code} caption={card.syntax.caption ?? "syntax"} />
        </div>
      )}
      {card.example && (
        <div>
          <div className="mono mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: card.color }}>
            Example
          </div>
          <CodeBlock code={card.example.code} caption={card.example.caption ?? "example"} />
        </div>
      )}
      {card.output && (
        <div>
          <div className="mono mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: card.color }}>
            Output
          </div>
          <pre className="mono overflow-x-auto rounded-lg border border-border bg-[color:var(--surface2)] p-3 text-[12px] text-[color:var(--teal)]">
            {card.output}
          </pre>
        </div>
      )}
      {card.extras?.map((ex, i) => {
        if (ex.kind === "beforeAfter") return <BeforeAfter key={i} {...ex} />;
        if (ex.kind === "diagram") return <Diagram key={i} name={ex.diagram} caption={ex.caption} />;
        if (ex.kind === "callout") return <Callout key={i} tone={ex.tone} text={ex.text} />;
        if (ex.kind === "complexity") return <Complexity key={i} rows={ex.rows} />;
        if (ex.kind === "pitfall") return <Pitfalls key={i} items={ex.items} />;
        if (ex.kind === "interview") return <Interview key={i} q={ex.q} a={ex.a} />;
        if (ex.kind === "quiz") return <QuizCard key={i} question={ex.question} options={ex.options} correct={ex.correct} explain={ex.explain} />;
        if (ex.kind === "tryIt") return <TryIt key={i} code={ex.code} lang={ex.lang} caption={ex.caption} />;
        return null;
      })}
      {card.note && (
        <div className="mt-auto rounded-md bg-[color:var(--surface2)] px-3 py-2 text-xs text-muted-foreground">
          {card.note}
        </div>
      )}
    </div>
  );
}