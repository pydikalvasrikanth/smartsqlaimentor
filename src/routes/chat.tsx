import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useResumableState } from "@/lib/resume";
import { ResumePrompt } from "@/components/ResumePrompt";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { chat } from "@/lib/chat.functions";
import {
  Paperclip,
  Image as ImageIcon,
  Video,
  Send,
  Loader2,
  X,
  Sparkles,
  ArrowLeft,
  Wand2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { AiMessage } from "@/components/AiMessage";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — Interview Intelligence" },
      { name: "description", content: "Chat with an AI mentor. Attach images, code screenshots, or files and get instant answers. Generate images on demand." },
      { property: "og:title", content: "AI Chat — Interview Intelligence" },
      { property: "og:description", content: "Chat with an AI mentor. Attach images, code screenshots, or files and get instant answers." },
      { property: "og:url", content: "https://smartsqlaimentor.lovable.app/chat" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.lovable.app/chat" }],
  }),
  component: ChatPage,
});

type Attachment = {
  id: string;
  kind: "image" | "file";
  name: string;
  mimeType: string;
  dataUrl?: string;
  textPreview?: string;
  previewUrl?: string;
};

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  imageUrl?: string;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function readAsText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsText(file);
  });
}

function ChatPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const sendChat = useServerFn(chat);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"chat" | "image">("chat");

  // Persist chat: trim to last 40 messages, strip base64 image data URLs to keep the row small.
  const resume = useResumableState<{ messages: Msg[]; mode: "chat" | "image"; input: string }>(
    "chat",
    { messages: [], mode: "chat", input: "" },
    { isEmpty: (s: any) => !s || (s.messages?.length === 0 && !s.input) },
  );
  useEffect(() => {
    if (!resume.ready) return;
    const trimmed = messages.slice(-40).map((m) => ({
      ...m,
      attachments: m.attachments?.map((a) => ({ ...a, dataUrl: undefined, previewUrl: undefined })),
    }));
    resume.setState({ messages: trimmed, mode, input });
  }, [messages, mode, input, resume.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  async function handleFiles(files: FileList | null, forceKind?: "image" | "video" | "file") {
    if (!files) return;
    const next: Attachment[] = [];
    for (const f of Array.from(files)) {
      if (f.size > MAX_FILE_BYTES) {
        toast.error(`${f.name} is larger than 5MB and was skipped.`);
        continue;
      }
      const isImage = f.type.startsWith("image/") || forceKind === "image";
      const isVideo = f.type.startsWith("video/") || forceKind === "video";
      if (isVideo) {
        // Videos aren't sent to the model (gateway only accepts images), but show a thumbnail/url.
        const url = URL.createObjectURL(f);
        next.push({ id: crypto.randomUUID(), kind: "file", name: f.name, mimeType: f.type, previewUrl: url, textPreview: `[video attached: ${f.name}]` });
        continue;
      }
      if (isImage) {
        const dataUrl = await readAsDataUrl(f);
        next.push({ id: crypto.randomUUID(), kind: "image", name: f.name, mimeType: f.type, dataUrl, previewUrl: dataUrl });
      } else {
        let textPreview: string | undefined;
        if (f.type.startsWith("text/") || /\.(md|json|csv|sql|py|ts|tsx|js|jsx|yml|yaml)$/i.test(f.name)) {
          try { textPreview = (await readAsText(f)).slice(0, 4000); } catch {}
        }
        next.push({ id: crypto.randomUUID(), kind: "file", name: f.name, mimeType: f.type || "application/octet-stream", textPreview });
      }
    }
    if (next.length) setPending((p) => [...p, ...next].slice(0, 10));
  }

  function removeAttachment(id: string) {
    setPending((p) => p.filter((a) => a.id !== id));
  }

  async function send() {
    const text = input.trim();
    if (!text && pending.length === 0) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text, attachments: pending };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setPending([]);
    setBusy(true);
    try {
      const history = [...messages, userMsg].slice(-12).map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments?.map((a) => ({
          kind: a.kind,
          name: a.name,
          mimeType: a.mimeType,
          dataUrl: a.kind === "image" ? a.dataUrl : undefined,
          textPreview: a.textPreview,
        })),
      }));
      const res: any = await sendChat({ data: { messages: history, mode } });
      if (res?.error) {
        toast.error(res.error);
      } else if (mode === "image" && res?.imageUrl) {
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: "Generated image:", imageUrl: res.imageUrl }]);
      } else {
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: res?.reply || "(empty reply)" }]);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to send.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toaster richColors position="top-center" />
      <header className="border-b border-border bg-surface-2/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1100px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Home
          </Link>
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight">AI Chat</h1>
            <p className="text-[11px] text-muted-foreground font-mono">attach images, files or videos · ask anything</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-[11px] font-mono">
            <button
              onClick={() => setMode("chat")}
              className={`px-2 py-1 rounded border ${mode === "chat" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
            >Chat</button>
            <button
              onClick={() => setMode("image")}
              className={`px-2 py-1 rounded border inline-flex items-center gap-1 ${mode === "image" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
            ><Wand2 className="h-3 w-3" /> Image</button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 py-6 space-y-4 overflow-y-auto">
        {resume.hasResumable && resume.savedSnapshot && (
          <ResumePrompt
            updatedAt={resume.savedSnapshot.updatedAt}
            meta={`${resume.savedSnapshot.state.messages?.length ?? 0} messages`}
            onResume={() => {
              const s = resume.savedSnapshot!.state;
              setMessages(s.messages ?? []);
              setMode(s.mode ?? "chat");
              setInput(s.input ?? "");
              resume.hydrate(resume.savedSnapshot);
            }}
            onDismiss={resume.dismiss}
          />
        )}
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground mt-12 space-y-2">
            <p>Start a conversation. Tap the paperclip to attach images, files or videos.</p>
            <p className="text-xs">Switch to <b>Image</b> mode to generate pictures from a prompt.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground whitespace-pre-wrap" : "bg-surface-2 border border-border text-left"}`}>
              {m.attachments && m.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {m.attachments.map((a) => (
                    <div key={a.id} className="text-[11px] opacity-90">
                      {a.previewUrl && a.kind === "image" ? (
                        <img src={a.previewUrl} alt="" className="max-h-32 rounded border border-border/40" />
                      ) : a.previewUrl ? (
                        <video src={a.previewUrl} className="max-h-32 rounded border border-border/40" controls />
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-background/30 border border-border/40">
                          <Paperclip className="h-3 w-3" /> {a.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {m.content && (
                m.role === "assistant"
                  ? <AiMessage content={m.content} />
                  : <div>{m.content}</div>
              )}
              {m.imageUrl && <img src={m.imageUrl} alt={m.content ? `Illustration for: ${m.content.slice(0, 120)}` : "AI generated illustration"} className="mt-2 rounded border border-border/40 max-w-full" />}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-lg px-3 py-2 text-sm bg-surface-2 border border-border inline-flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </main>

      <footer className="border-t border-border bg-surface-2/60 backdrop-blur sticky bottom-0">
        <div className="max-w-[1100px] mx-auto px-4 py-3">
          {pending.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pending.map((a) => (
                <div key={a.id} className="relative group">
                  {a.previewUrl && a.kind === "image" ? (
                    <img src={a.previewUrl} alt="" className="h-16 w-16 object-cover rounded border border-border" />
                  ) : a.previewUrl ? (
                    <video src={a.previewUrl} className="h-16 w-24 object-cover rounded border border-border" />
                  ) : (
                    <div className="px-2 py-1 text-[11px] rounded border border-border bg-background inline-flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />{a.name}
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(a.id)}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground grid place-items-center opacity-90"
                    aria-label="Remove attachment"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="flex items-center gap-1">
              <button
                title="Attach image"
                onClick={() => imageRef.current?.click()}
                className="h-9 w-9 grid place-items-center rounded border border-border hover:bg-accent"
              ><ImageIcon className="h-4 w-4" /></button>
              <button
                title="Attach video"
                onClick={() => videoRef.current?.click()}
                className="h-9 w-9 grid place-items-center rounded border border-border hover:bg-accent"
              ><Video className="h-4 w-4" /></button>
              <button
                title="Attach file"
                onClick={() => fileRef.current?.click()}
                className="h-9 w-9 grid place-items-center rounded border border-border hover:bg-accent"
              ><Paperclip className="h-4 w-4" /></button>
              <input ref={imageRef} type="file" accept="image/*" multiple hidden onChange={(e) => { handleFiles(e.target.files, "image"); e.target.value = ""; }} />
              <input ref={videoRef} type="file" accept="video/*" multiple hidden onChange={(e) => { handleFiles(e.target.files, "video"); e.target.value = ""; }} />
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder={mode === "image" ? "Describe an image to generate…" : "Ask anything, or attach an image of code/error…"}
              rows={1}
              className="flex-1 resize-none rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[36px] max-h-40"
            />
            <button
              onClick={send}
              disabled={busy || (!input.trim() && pending.length === 0)}
              className="h-9 px-3 rounded bg-primary text-primary-foreground inline-flex items-center gap-1 text-sm disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Images are read by the AI. Video files are attached for reference but not sent to the model. Free AI video generation isn't available through the Lovable AI Gateway yet.
          </p>
        </div>
      </footer>
    </div>
  );
}
