import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Send, X, Loader2, Sparkles } from "lucide-react";
import { chat } from "@/lib/chat.functions";
import { AiMessage } from "@/components/AiMessage";

type Msg = { id: string; role: "user" | "assistant"; content: string };

interface Props {
  /** Short description of the current page so answers stay on-topic. */
  context?: string;
  /** Suggestion chips shown on first open. */
  suggestions?: string[];
}

const POS_KEY = "ai_assistant_pos_v1";
const BTN_SIZE = 56;

interface Pos {
  side: "left" | "right";
  y: number; // px from top
}

function loadPos(): Pos {
  if (typeof window === "undefined") return { side: "right", y: 0 };
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { side: "right", y: window.innerHeight - 140 };
}

export function AiAssistant({ context, suggestions = [] }: Props) {
  const ask = useServerFn(chat);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos>(() => loadPos());
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const dragState = useRef<{ dragging: boolean; moved: boolean; offsetY: number }>({
    dragging: false,
    moved: false,
    offsetY: 0,
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Default position once we have window dimensions.
  useEffect(() => {
    setPos((p) => (p.y === 0 ? { side: "right", y: window.innerHeight - 140 } : p));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(pos));
    } catch {
      /* ignore */
    }
  }, [pos]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, loading]);

  // ---- Dragging ----
  const onPointerDown = (e: React.PointerEvent) => {
    dragState.current = { dragging: true, moved: false, offsetY: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    dragState.current.moved = true;
    const maxY = window.innerHeight - BTN_SIZE - 8;
    const y = Math.max(8, Math.min(maxY, e.clientY - dragState.current.offsetY));
    const side: "left" | "right" = e.clientX < window.innerWidth / 2 ? "left" : "right";
    setPos({ side, y });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const wasDrag = dragState.current.moved;
    dragState.current.dragging = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!wasDrag) setOpen((o) => !o);
  };

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || loading) return;
      const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content };
      const history = [...msgs, userMsg];
      setMsgs(history);
      setInput("");
      setLoading(true);
      try {
        const payloadMessages = history.slice(-12).map((m) => ({ role: m.role, content: m.content }));
        const res: any = await ask({
          data: {
            messages: payloadMessages,
            mode: "chat",
            ...(context ? { context: context.slice(0, 500) } : {}),
          },
        });
        const reply = res?.reply ?? res?.error ?? "Sorry, I couldn't get a response.";
        setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
      } catch (err: any) {
        setMsgs((m) => [
          ...m,
          { id: crypto.randomUUID(), role: "assistant", content: err?.message ?? "Network error — please try again." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [ask, context, loading, msgs],
  );

  const panelStyle: React.CSSProperties = {
    top: Math.max(8, Math.min(pos.y - 360, (typeof window !== "undefined" ? window.innerHeight : 800) - 540)),
    [pos.side]: 16,
  };

  return (
    <>
      {/* Floating button */}
      <button
        aria-label="Open AI assistant"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ top: pos.y, [pos.side]: 16, width: BTN_SIZE, height: BTN_SIZE, touchAction: "none" }}
        className="fixed z-50 rounded-full grid place-items-center bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[0_10px_30px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)] cursor-grab active:cursor-grabbing hover:scale-105 transition-transform select-none"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={panelStyle}
          className="fixed z-50 w-[min(380px,calc(100vw-32px))] h-[520px] max-h-[calc(100vh-32px)] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">AI Mentor</p>
              <p className="text-[10px] font-mono text-muted-foreground">ask anything · drag the bubble to move</p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-muted-foreground hover:text-foreground" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {msgs.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Hi! I'm your AI mentor. Ask me to explain a concept, fix your code, or generate an example.
                </p>
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-accent text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {msgs.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-2 border border-border"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <AiMessage content={m.content} />
                  ) : (
                    <span className="whitespace-pre-wrap break-words">{m.content}</span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl px-3 py-2 bg-surface-2 border border-border">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-border p-2 flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask the AI mentor…"
              className="flex-1 resize-none bg-background border border-input rounded-md px-3 py-2 text-sm max-h-28 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-9 w-9 shrink-0 grid place-items-center rounded-md bg-gradient-to-br from-primary to-primary-glow text-primary-foreground disabled:opacity-50"
              aria-label="Send"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
