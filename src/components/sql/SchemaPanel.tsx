import { useState } from "react";
import { ErdDiagram } from "./ErdDiagram";

interface Props {
  schemaSql: string;
  seedSql: string;
  erdMermaid: string;
  description: string;
}

type Tab = "erd" | "schema" | "data" | "about";

export function SchemaPanel({ schemaSql, seedSql, erdMermaid, description }: Props) {
  const [tab, setTab] = useState<Tab>("erd");

  const tabs: { id: Tab; label: string }[] = [
    { id: "erd", label: "ERD" },
    { id: "schema", label: "Schema" },
    { id: "data", label: "Seed" },
    { id: "about", label: "About" },
  ];

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col h-full min-h-0">
      <div className="flex border-b border-border bg-surface-2 text-xs font-mono">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 transition-colors ${
              tab === t.id
                ? "text-foreground border-b-2 border-primary-glow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3 min-h-0">
        {tab === "erd" && (
          erdMermaid ? <ErdDiagram chart={erdMermaid} /> : <Empty />
        )}
        {tab === "schema" && (
          <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/85">
            {schemaSql || "—"}
          </pre>
        )}
        {tab === "data" && (
          <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/85">
            {seedSql || "—"}
          </pre>
        )}
        {tab === "about" && (
          <p className="text-sm text-foreground/85 leading-relaxed">
            {description || "No environment loaded yet."}
          </p>
        )}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="text-xs text-muted-foreground p-4">
      Initialize an environment to see the entity-relationship diagram.
    </div>
  );
}
