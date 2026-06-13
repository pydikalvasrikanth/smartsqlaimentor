import { useEffect, useRef, useState } from "react";

interface Props {
  chart: string;
}

export function ErdDiagram({ chart }: Props) {
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
        const id = "erd-" + Math.random().toString(36).slice(2, 9);
        const cleaned = chart.trim().replace(/^```mermaid\s*/i, "").replace(/```$/, "").trim();
        const { svg } = await mermaid.render(id, cleaned);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (e: any) {
        console.error("Mermaid render failed", e);
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
      <div className="text-xs text-destructive p-3 font-mono whitespace-pre-wrap">
        Diagram error: {error}
      </div>
    );
  }

  return <div ref={ref} className="mermaid-erd w-full overflow-auto" />;
}
