import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const CHAT_MODEL = "google/gemini-3-flash-preview";
const STT_MODEL = "openai/gpt-4o-mini-transcribe";
const TTS_MODEL = "openai/gpt-4o-mini-tts";

const TurnInput = z.object({
  role: z.string().max(120).default("Data Engineer"),
  level: z.enum(["junior", "mid", "senior"]).default("mid"),
  experienceYears: z.number().int().min(0).max(40).default(3),
  competencies: z.string().max(800).default(""),
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

const SYSTEM = `# Role & Identity
You are an elite, highly experienced Lead Technical and Behavioral Interviewer mimicking the exact talent assessment standards of top-tier MNCs (Google, Amazon, Meta, Microsoft). Your personality is professional, objective, deeply observant, and articulately sharp. You maintain an encouraging yet rigorous atmosphere.

# Operational Rules
1. The Introduction: Start the session by briefly introducing yourself, acknowledging the target role/level, and stating the structure of the interview (intro → deep technical → behavioural → wrap-up). Ask the candidate for a brief introduction.
2. One Question at a Time: Never dump multiple questions in a single turn. Ask one, then wait.
3. MNC Style Sequencing: Start with high-level architectural / systemic concepts relevant to the level. Transition to deep situational technical problems ("Imagine our real-time pipeline lags by 10 minutes…"). Integrate 1-2 Amazon-style Leadership Principle or Meta-style behavioural questions organically.
4. Active Listening & Deep Probing: Never just read a script. Listen to the response. If shallow or missing edge cases, follow up directly on what they said — "You mentioned a Redis cache there; how do you handle invalidation if the master DB updates unexpectedly?" / "Walk me through the precise trade-offs of that decision."
5. No Immediate Feedback: Stay neutral and validating — "Understood." / "Got it, let's pivot to…" / "That makes sense. Moving forward…". Never tell the candidate they are right or wrong mid-interview.
6. Graceful Transitions: Bridge topics smoothly using residual context from the previous answer.

# Conversational Style
- Speak like an articulate human peer, not a machine. Avoid robotic phrasing like "Excellent answer. Question two is…".
- Keep each turn concise — under 3-4 sentences — so the avatar maintains natural rhythm and low video latency.
- Output ONLY what you would say out loud. No stage directions, no markdown, no bullets, no numbered lists during the interview.`;

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
        content: `# Context Injection\nTARGET_ROLE: ${data.role}\nLEVEL: ${data.level}\nEXPERIENCE_YEARS: ${data.experienceYears}\nCORE_COMPETENCIES: ${data.competencies || "(infer from role)"}\n\nCalibrate question depth and architectural scope to LEVEL and EXPERIENCE_YEARS. Bias questions toward CORE_COMPETENCIES when listed.`,
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
        content: "[SYSTEM] Begin the interview now. Introduce yourself in 1 sentence, acknowledge the role/level, state the brief structure, then invite the candidate to introduce themselves. Keep it under 60 spoken words total.",
      });
    } else if (data.action === "end") {
      messages.push({
        role: "user",
        content: "[SYSTEM] Wrap up gracefully in 2 short sentences — thank the candidate and tell them their feedback report is being prepared. Do not output a scorecard or summary here.",
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
    const file = new File([bytes.buffer as ArrayBuffer], `recording.${ext}`, { type: data.mimeType });

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

// ---------------------------------------------------------------------------
// Text-to-speech: synthesise the interviewer voice via Lovable AI Gateway.
// Returns base64 MP3 the client plays + analyses for lip-sync.
// ---------------------------------------------------------------------------
const SpeakInput = z.object({
  text: z.string().min(1).max(4000),
  voice: z.string().max(40).default("alloy"),
});

export const interviewSpeak = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SpeakInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { error: "LOVABLE_API_KEY is not configured." };
    const resp = await fetch(`${GATEWAY}/audio/speech`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: TTS_MODEL,
        input: data.text,
        voice: data.voice,
        response_format: "mp3",
        instructions:
          "Speak as a calm, articulate, professional senior tech interviewer. Warm but measured pace.",
      }),
    });
    if (resp.status === 429) return { error: "Rate limit. Try again shortly." };
    if (resp.status === 402) return { error: "AI credits exhausted." };
    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      console.error("tts error", resp.status, t);
      return { error: `TTS failed (${resp.status}).` };
    }
    const buf = new Uint8Array(await resp.arrayBuffer());
    let bin = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < buf.length; i += CHUNK) {
      bin += String.fromCharCode(...buf.subarray(i, i + CHUNK));
    }
    return { audioBase64: btoa(bin), mimeType: "audio/mpeg" };
  });

// ---------------------------------------------------------------------------
// Post-interview scorecard: second LLM pass over the full transcript.
// ---------------------------------------------------------------------------
const ReportInput = z.object({
  role: z.string().max(120).default("Data Engineer"),
  level: z.enum(["junior", "mid", "senior"]).default("mid"),
  experienceYears: z.number().int().min(0).max(40).default(3),
  competencies: z.string().max(800).default(""),
  history: z
    .array(
      z.object({
        role: z.enum(["interviewer", "candidate"]),
        text: z.string().max(8000),
      }),
    )
    .max(120),
});

const REPORT_SYSTEM = `You are a senior hiring panel reviewer. You receive a full transcript of a live mock interview and must produce a strict, structured evaluation report in JSON.

Score honestly and calibrated to top-MNC hiring bars (Google/Amazon/Meta/Microsoft) for the given LEVEL.

Return ONLY a single JSON object — no prose, no markdown fences — matching this schema exactly:
{
  "overall_score": number (0-10, one decimal allowed),
  "recommendation": "strong_hire" | "hire" | "lean_hire" | "no_hire" | "strong_no_hire",
  "headline": string (one sentence verdict),
  "competencies": [ { "name": string, "score": number (0-10), "evidence": string } ],
  "strengths": [ string, ... ] (3-5 items),
  "gaps": [ string, ... ] (3-5 items),
  "red_flags": [ string, ... ] (0-3 items),
  "improvements": [ string, ... ] (3-5 concrete action items),
  "next_topics_to_study": [ string, ... ] (3-6 items)
}`;

export const interviewReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReportInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { error: "LOVABLE_API_KEY is not configured." };
    const transcript = data.history
      .map((t) => `${t.role === "interviewer" ? "INTERVIEWER" : "CANDIDATE"}: ${t.text}`)
      .join("\n\n");
    const messages = [
      { role: "system", content: REPORT_SYSTEM },
      {
        role: "user",
        content: `TARGET_ROLE: ${data.role}\nLEVEL: ${data.level}\nEXPERIENCE_YEARS: ${data.experienceYears}\nCORE_COMPETENCIES: ${data.competencies || "(unspecified)"}\n\n--- TRANSCRIPT ---\n${transcript}\n--- END ---\n\nProduce the JSON evaluation now.`,
      },
    ];
    const resp = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages,
        response_format: { type: "json_object" },
      }),
    });
    if (resp.status === 429) return { error: "Rate limit. Try again shortly." };
    if (resp.status === 402) return { error: "AI credits exhausted." };
    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      console.error("report error", resp.status, t);
      return { error: `Report failed (${resp.status}).` };
    }
    const json: any = await resp.json();
    const raw: string = json?.choices?.[0]?.message?.content ?? "{}";
    let report: any = null;
    try {
      report = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try { report = JSON.parse(m[0]); } catch {}
      }
    }
    if (!report) return { error: "Could not parse evaluation." };
    return { report };
  });