// Server-only implementation for the AI assistant chat server function.
// Prompts, gateway calls, payload schemas and the per-user rate limiter live
// here so they can never reach the client bundle and so the Worker's
// server-fn split can't drop sibling declarations.
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const IMAGE_URL = "https://ai.gateway.lovable.dev/v1/images/generations";
const TEXT_MODEL = "google/gemini-3-flash-preview";
const IMAGE_MODEL = "google/gemini-2.5-flash-image";

const AttachmentSchema = z.object({
  kind: z.enum(["image", "file"]),
  name: z.string().max(255),
  mimeType: z.string().max(120),
  // data URL (base64) for images; for non-image files we only send a description
  dataUrl: z.string().max(8_000_000).optional(),
  textPreview: z.string().max(4000).optional(),
});

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(20_000),
  attachments: z.array(AttachmentSchema).max(10).optional(),
});

export const ChatInput = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  mode: z.enum(["chat", "image"]).default("chat"),
  // Optional page-context string. The server turns this into a trusted system
  // message — clients can no longer supply system-role messages directly.
  context: z.string().max(500).optional(),
});

// Per-user rate limit. Backed by Postgres (public.consume_rate_limit) so the
// counter is shared across all Cloudflare Worker isolates instead of living in
// module-level Map state that each isolate would reset. Limits are unchanged:
// 20 requests per rolling 60s window per signed-in user.
const RATE_WINDOW_SECONDS = 60;
const RATE_MAX = 20;
const RATE_BUCKET = "chat";

async function checkRateLimit(userId: string): Promise<{ ok: boolean; retryAfter: number }> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
      _user_id: userId,
      _bucket: RATE_BUCKET,
      _max: RATE_MAX,
      _window_seconds: RATE_WINDOW_SECONDS,
    });
    if (error) {
      // Fail open: a counter outage must not take the assistant down.
      console.error("rate limit rpc error", error.message);
      return { ok: true, retryAfter: 0 };
    }
    const result = data as { allowed?: boolean; retry_after?: number } | null;
    if (result?.allowed === false) {
      return { ok: false, retryAfter: Math.max(1, Number(result.retry_after ?? RATE_WINDOW_SECONDS)) };
    }
    return { ok: true, retryAfter: 0 };
  } catch (e) {
    console.error("rate limit check failed", e);
    return { ok: true, retryAfter: 0 };
  }
}

const SYSTEM_PROMPT = `You are a helpful, concise AI assistant inside the Interview Intelligence app. You can read images the user attaches (look closely at code screenshots, diagrams, error messages). When code is shown, answer with explanations and corrected code in markdown. Keep replies focused.`;

function toGatewayContent(m: z.infer<typeof MessageSchema>) {
  if (!m.attachments || m.attachments.length === 0) return m.content;
  const parts: any[] = [];
  if (m.content) parts.push({ type: "text", text: m.content });
  for (const a of m.attachments) {
    if (a.kind === "image" && a.dataUrl) {
      parts.push({ type: "image_url", image_url: { url: a.dataUrl } });
    } else if (a.textPreview) {
      parts.push({ type: "text", text: `Attached file ${a.name} (${a.mimeType}):\n${a.textPreview}` });
    } else {
      parts.push({ type: "text", text: `User attached file: ${a.name} (${a.mimeType}).` });
    }
  }
  return parts;
}

async function runChat(messages: z.infer<typeof MessageSchema>[], context?: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { error: "LOVABLE_API_KEY is not configured." };
  const systemMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(context
      ? [
          {
            role: "system",
            content: `The user is on this page: ${context}. Answer clearly and format code in markdown code blocks.`,
          },
        ]
      : []),
  ];
  const body = {
    model: TEXT_MODEL,
    messages: [
      ...systemMessages,
      ...messages.map((m) => ({ role: m.role, content: toGatewayContent(m) })),
    ],
  };
  const resp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (resp.status === 429) return { error: "Rate limit reached. Please wait and try again." };
  if (resp.status === 402) return { error: "AI credits exhausted. Add credits in Workspace → Usage." };
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    console.error("chat gateway error", resp.status, t);
    return { error: `AI gateway error (${resp.status}).` };
  }
  const json: any = await resp.json();
  const text: string = json?.choices?.[0]?.message?.content ?? "";
  return { reply: text };
}

async function runImage(prompt: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { error: "LOVABLE_API_KEY is not configured." };
  const resp = await fetch(IMAGE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: IMAGE_MODEL, prompt, n: 1 }),
  });
  if (resp.status === 429) return { error: "Rate limit reached. Please wait and try again." };
  if (resp.status === 402) return { error: "AI credits exhausted. Add credits in Workspace → Usage." };
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    console.error("image gateway error", resp.status, t);
    return { error: `Image gateway error (${resp.status}).` };
  }
  const json: any = await resp.json();
  const item = json?.data?.[0];
  const b64 = item?.b64_json;
  const url = item?.url;
  const imageUrl = b64 ? `data:image/png;base64,${b64}` : url;
  if (!imageUrl) return { error: "Image model returned no image." };
  return { imageUrl };
}

export async function chatImpl(data: z.infer<typeof ChatInput>, userId: string) {
  const limit = await checkRateLimit(userId);
  if (!limit.ok) {
    return { error: `Too many requests. Try again in ${limit.retryAfter}s.` };
  }
  if (data.mode === "image") {
    const last = data.messages[data.messages.length - 1];
    return runImage(typeof last.content === "string" ? last.content : "");
  }
  return runChat(data.messages, data.context);
}
