import { useEffect, useRef, useState } from "react";

interface Props {
  chart: string;
  /** Visual variant: 'flow' animates arrows; 'static' does not. */
  variant?: "flow" | "static";
}

/**
 * Renders a mermaid diagram (typically a `flowchart LR`) with animated
 * arrows so students can watch how rows travel through the SQL pipeline.
 * The stroke-dash animation is applied via CSS in `src/styles.css`.
 */
export function FlowDiagram({ chart, variant = "flow" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      if (!chart || !ref.current) return;
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "strict",
          suppressErrorRendering: true,
          fontFamily: "JetBrains Mono, monospace",
          themeVariables: {
            background: "transparent",
            primaryColor: "#1f2540",
            primaryBorderColor: "#7c6cff",
            lineColor: "#a99cff",
            textColor: "#e8eaf3",
          },
        });
        const id = "flow-" + Math.random().toString(36).slice(2, 9);
        const cleaned = chart
          .trim()
          .replace(/^```mermaid\s*/i, "")
          .replace(/```$/, "")
          .trim();
        const { svg } = await mermaid.render(id, cleaned);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (e: any) {
        console.error("Mermaid flow render failed", e);
        if (!cancelled) setError(e?.message || "Failed to render diagram");
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="text-xs text-destructive p-2 font-mono whitespace-pre-wrap">
        Diagram error: {error}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`mermaid-flow w-full overflow-auto rounded-md border border-border bg-surface-2/40 p-2 my-2 ${
        variant === "flow" ? "mermaid-flow--animated" : ""
      }`}
    />
  );
}