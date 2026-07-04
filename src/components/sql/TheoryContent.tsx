import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FlowDiagram } from "./FlowDiagram";

interface Props {
  content: string;
}

/**
 * Renders theory markdown with two visual upgrades over the plain AiMessage:
 *  1. ```mermaid fenced blocks render as animated FlowDiagrams so students
 *     can watch the query pipeline move.
 *  2. Tables/headings pick up the same prose styling as chat replies.
 */
export function TheoryContent({ content }: Props) {
  return (
    <div
      className="prose prose-sm prose-invert max-w-none text-left break-words leading-relaxed
        prose-p:my-2 prose-p:text-left
        prose-headings:text-left prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground
        prose-h1:text-base prose-h1:mt-3 prose-h1:mb-2
        prose-h2:text-sm prose-h2:mt-3 prose-h2:mb-1.5 prose-h2:uppercase prose-h2:tracking-wide prose-h2:text-muted-foreground
        prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1
        prose-strong:text-foreground
        prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-li:marker:text-primary
        prose-hr:my-3 prose-hr:border-border
        prose-pre:bg-background prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:p-3 prose-pre:my-2 prose-pre:overflow-x-auto prose-pre:text-xs
        prose-code:text-primary-glow prose-code:break-words prose-code:before:hidden prose-code:after:hidden prose-code:bg-surface-2 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-table:text-xs prose-th:bg-surface-2 prose-th:px-2 prose-th:py-1 prose-th:text-left prose-td:px-2 prose-td:py-1 prose-td:border-t prose-td:border-border"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Intercept ```mermaid blocks and render animated flow diagrams.
          code({ inline, className, children, ...props }: any) {
            const lang = /language-(\w+)/.exec(className || "")?.[1];
            if (!inline && lang === "mermaid") {
              return <FlowDiagram chart={String(children)} />;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Skip <pre> wrapping for mermaid so the diagram is not rendered
          // inside a scrollable code block.
          pre({ children }: any) {
            const child: any = Array.isArray(children) ? children[0] : children;
            const lang = /language-(\w+)/.exec(child?.props?.className || "")?.[1];
            if (lang === "mermaid") {
              return <>{children}</>;
            }
            return <pre>{children}</pre>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}