import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

interface Props {
  content: string;
  /** Extra classes for the bubble wrapper. */
  className?: string;
}

/**
 * Renders an assistant reply as left-aligned markdown with a copy-to-clipboard
 * button. Shared across the chat page and the floating AI assistant so the
 * formatting and copy behaviour stay consistent everywhere.
 */
export function AiMessage({ content, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className={`group relative ${className}`}>
      <button
        onClick={copy}
        aria-label="Copy response"
        title={copied ? "Copied" : "Copy response"}
        className="absolute top-1.5 right-1.5 z-10 h-7 w-7 grid place-items-center rounded-md border border-border bg-background/80 text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:text-foreground"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <div className="prose prose-sm dark:prose-invert w-full min-w-0 max-w-none overflow-hidden text-left break-words leading-relaxed pr-7
        [overflow-wrap:anywhere] [word-break:break-word]
        prose-p:my-2 prose-p:text-left
        prose-headings:text-left prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground
        prose-h1:text-base prose-h1:mt-3 prose-h1:mb-2
        prose-h2:text-sm prose-h2:mt-3 prose-h2:mb-1.5 prose-h2:uppercase prose-h2:tracking-wide prose-h2:text-muted-foreground
        prose-h3:text-sm prose-h3:mt-2 prose-h3:mb-1
        prose-strong:text-foreground
        prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-li:marker:text-primary
        prose-blockquote:border-l-2 prose-blockquote:border-primary/50 prose-blockquote:pl-3 prose-blockquote:text-muted-foreground prose-blockquote:not-italic
        prose-hr:my-3 prose-hr:border-border
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-pre:bg-surface-2 prose-pre:text-foreground prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:p-3 prose-pre:my-2 prose-pre:max-w-full prose-pre:overflow-x-auto prose-pre:text-xs
        prose-pre:prose-code:text-foreground
        prose-code:text-primary prose-code:font-semibold dark:prose-code:text-primary-glow prose-code:break-words prose-code:before:hidden prose-code:after:hidden prose-code:bg-surface-2 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-table:text-xs prose-th:bg-surface-2 prose-th:px-2 prose-th:py-1 prose-th:text-left prose-td:px-2 prose-td:py-1 prose-td:border-t prose-td:border-border">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            pre: ({ children }: any) => (
              <pre className="max-w-full overflow-x-auto">{children}</pre>
            ),
            table: ({ children }: any) => (
              <div className="my-2 w-full max-w-full overflow-x-auto">
                <table className="w-full">{children}</table>
              </div>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
