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
      <div className="prose prose-sm prose-invert max-w-none text-left break-words leading-relaxed pr-7 prose-p:my-2 prose-p:text-left prose-headings:text-left prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-pre:bg-background prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:overflow-x-auto prose-code:text-primary-glow prose-code:break-words">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
