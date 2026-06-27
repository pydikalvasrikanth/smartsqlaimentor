import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const CHAT_MODEL = "google/gemini-3-flash-preview";
const STT_MODEL = "openai/gpt-4o-mini-transcribe";

const TurnInput = z.object({
  role: z.string().max(120).default("Data Engineer"),
  level: z.enum(["junior", "mid", "senior"]).default("mid"),
  history: z
    .array(
      z.object({
        role: z.enum(["interviewer", "candidate"]),
        text: z.string().max(8000),
      }),
    )
    .max(60)
    .default([]),
  // "start" → opening, "next" → next question / follow-up, "end" → final summary + score
  action: z.enum(["start", "next", "end"]).default("next"),
});

const SYSTEM = `You are an experienced technical interviewer conducting a LIVE spoken interview.
Rules:
- Speak naturally, one question at a time. Keep each turn under 60 spoken words.
- Start with a warm "tell me about yourself" style opener when asked to start.
- After the candidate answers, give a brief 1-line reaction, then ask the next question OR a sharper follow-up that probes the same topic deeper.
- Cover the full data-engineering interview surface across the session: background, SQL, Python, distributed systems, data modeling, ETL/ELT, streaming (Kafka/PubSub), data warehouses (BigQuery/Snowflake/Redshift), Spark, Airflow, system design, behavioural.
- Mix easy → hard. Adapt difficulty to the candidate's last answer.
- When asked to end, give a short structured summary: Strengths, Weaknesses, Score (out of 10), and 3 things to improve.
- Never output stage directions, markdown, or bullet points during the interview — only what you would actually SAY out loud. The "end" summary is the only exception and may use simple line breaks.`;

export const interviewTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TurnInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { error: "LOVABLE_API_KEY is not configured." };

    const messages: any[] = [
      { role: "system", content: SYSTEM },
      {
        role: "system",
        content: `Role being interviewed for: ${data.role}. Target level: ${data.level}.`,
      },
    ];
    for (const t of data.history) {
      messages.push({
        role: t.role === "interviewer" ? "assistant" : "user",
        content: t.text,
      });
    }
    if (data.action === "start") {
      messages.push({
        role: "user",
        content: "[SYSTEM] Begin the interview. Greet the candidate briefly and ask them to tell you about themselves.",
      });
    } else if (data.action === "end") {
      messages.push({
        role: "user",
        content: "[SYSTEM] The interview is over. Produce the final structured summary now (Strengths, Weaknesses, Score /10, 3 improvements).",
      });
    }

    const resp = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: CHAT_MODEL, messages }),
    });
    if (resp.status === 429) return { error: "Rate limit. Please wait a moment." };
    if (resp.status === 402) return { error: "AI credits exhausted." };
    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      console.error("interview chat error", resp.status, t);
      return { error: `Interviewer error (${resp.status}).` };
    }
    const json: any = await resp.json();
    const reply: string = json?.choices?.[0]?.message?.content ?? "";
    return { reply };
  });

const TranscribeInput = z.object({
  // base64 (no data: prefix) WAV audio
  audioBase64: z.string().min(100).max(15_000_000),
  mimeType: z.string().max(120).default("audio/wav"),
});

export const interviewTranscribe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TranscribeInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { error: "LOVABLE_API_KEY is not configured." };

    let bytes: Uint8Array;
    try {
      const bin = atob(data.audioBase64);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } catch {
      return { error: "Invalid audio payload." };
    }
    if (bytes.byteLength < 2048) return { error: "Audio too short. Please speak again." };

    const ext = data.mimeType.includes("mp3")
      ? "mp3"
      : data.mimeType.includes("webm")
        ? "webm"
        : data.mimeType.includes("mp4")
          ? "mp4"
          : "wav";
    const file = new File([bytes], `recording.${ext}`, { type: data.mimeType });

    const form = new FormData();
    form.append("model", STT_MODEL);
    form.append("file", file);

    const resp = await fetch(`${GATEWAY}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (resp.status === 429) return { error: "Rate limit. Try again shortly." };
    if (resp.status === 402) return { error: "AI credits exhausted." };
    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      console.error("transcribe error", resp.status, t);
      return { error: `Transcription failed (${resp.status}).` };
    }
    const json: any = await resp.json().catch(() => ({}));
    const text: string = json?.text ?? "";
    return { text };
  });