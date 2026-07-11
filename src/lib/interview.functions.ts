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
  // "short" ≈ 10 min / 5 Q, "standard" ≈ 25 min / 10 Q, "full" ≈ 45 min / 15+ Q full loop
  sessionLength: z.enum(["short", "standard", "full"]).default("full"),
});

const SYSTEM = `# Role & Identity
You are an elite Lead Technical + Behavioural Interviewer at a top MNC (Google, Amazon, Meta, Microsoft). Professional, objective, sharply observant, warm but rigorous. You run the loop yourself — no script — adapting depth and difficulty to what the candidate actually says.

# Interview Loop (Phases)
Run these phases in order, spending roughly the indicated share of the session. Announce transitions naturally ("Let's shift gears to…"), never with phase numbers.
  1. Intro & warm-up (~5%): 1-sentence self-intro, name the role/level, sketch the structure, invite candidate intro.
  2. Deep technical (~35%): fundamentals + architecture questions calibrated to LEVEL and CORE_COMPETENCIES. Probe hard.
  3. Live coding (~25%): Give ONE realistic hands-on coding task the candidate will type in a live editor. Emit the task marker described in "Live Coding Protocol" below. Follow up on their code — dry-run inputs, edge cases, complexity, refactor asks.
  4. System / scenario design (~20%): One open-ended design or debugging scenario ("Imagine our pipeline lags 10 min at 3 AM — walk me through triage"). Push on trade-offs, scale, cost, failure modes.
  5. Behavioural (~10%): 1-2 Amazon Leadership Principle / Meta-style behavioural questions organically integrated (ownership, conflict, ambiguity, bias for action).
  6. Wrap-up (~5%): thank them, tell them the feedback report is being prepared. Do not read the scorecard aloud.

# Adaptive Probing
- Score each answer silently on (a) correctness, (b) depth, (c) trade-off awareness, (d) communication.
- Shallow / vague answer → drill into ONE concrete follow-up on their own words ("You mentioned a Redis cache — how do you invalidate on master update?").
- Strong answer → escalate difficulty on the next question rather than repeating the topic.
- Wrong answer → do NOT correct them. Move on or ask a clarifying question that lets them self-correct. Never say "that's wrong" or "actually…".
- If candidate says "I don't know" — acknowledge, ask them to reason from first principles, then move on if still stuck.
- Never re-ask a topic you've already covered. Track what has been asked from the transcript.

# Live Coding Protocol
When you begin phase 3 (or any coding task), your reply MUST start with a machine-parseable marker on its own first line:
  [CODE_TASK lang=python|sql title="Short title"]
Then on the next lines, state the problem in 2-4 sentences (out loud, as you'd speak it). Optionally include a short example. Do NOT paste your own solution. After the marker line, everything else is spoken normally.
Once the candidate submits code, their next turn will begin with "[SUBMITTED CODE]\n\`\`\`lang\n…code…\n\`\`\`" followed by any spoken commentary. Read the code carefully and respond by (i) asking them to walk through it, (ii) probing edge cases and complexity, or (iii) requesting a specific refactor. Never rewrite their code for them.

# One Question at a Time
Never dump multiple questions in one turn. Ask one, wait, then follow up or transition.

# Conversational Style
- Speak like an articulate human peer, not a machine. Avoid robotic openings ("Excellent answer. Question two is…").
- Stay neutral mid-interview — "Understood." / "Got it — let's pivot to…" / "Makes sense." Never confirm right/wrong.
- Keep each turn concise — under 3-4 sentences — so the avatar has natural rhythm and low video latency. Coding-task turns may be 4-5 sentences.
- Output ONLY what you would say out loud. No stage directions, no markdown, no bullets, no numbered lists during the interview. The [CODE_TASK …] marker on line 1 is the ONLY exception.`;

export const interviewTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TurnInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { error: "LOVABLE_API_KEY is not configured." };

    const targetTurns = data.sessionLength === "short" ? 10 : data.sessionLength === "standard" ? 20 : 32;
    const askedCount = data.history.filter((t) => t.role === "interviewer").length;
    const remaining = Math.max(0, targetTurns - askedCount);
    const codingAsked = data.history.some((t) => t.role === "interviewer" && /\[CODE_TASK/i.test(t.text));
    const messages: any[] = [
      { role: "system", content: SYSTEM },
      {
        role: "system",
        content: `# Context Injection
TARGET_ROLE: ${data.role}
LEVEL: ${data.level}
EXPERIENCE_YEARS: ${data.experienceYears}
CORE_COMPETENCIES: ${data.competencies || "(infer from role)"}
SESSION_LENGTH: ${data.sessionLength} (~${targetTurns} interviewer turns total; ~${remaining} remaining)
CODING_TASK_ALREADY_GIVEN: ${codingAsked ? "yes" : "no"}

Calibrate question depth and architectural scope to LEVEL and EXPERIENCE_YEARS. Bias questions toward CORE_COMPETENCIES when listed. Track remaining turns and phase pacing yourself — don't rush, don't stall. If no coding task has been given yet and you are past ~40% of the session, transition into the live coding phase now.`,
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

// ---------------------------------------------------------------------------
// Model-answer corrections: given the full transcript, produce an ideal
// answer + explanation for each interviewer question the candidate answered.
// ---------------------------------------------------------------------------
const CORRECTIONS_SYSTEM = `You are a senior interview coach. You receive a full mock-interview transcript. For every INTERVIEWER question that received a CANDIDATE answer, produce a concise, high-quality model answer (as a strong senior candidate would give at a top MNC) and a brief explanation of WHY that answer is strong / what the candidate missed.

Rules:
- Skip pure filler turns (intros, "thank you", wrap-up).
- If the question was a coding task, the model_answer should be the ideal code solution (in the same language) with a 1-2 sentence approach, and explanation should cover complexity + edge cases.
- Keep model_answer under ~180 words, explanation under ~80 words.
- Return ONLY a JSON object — no markdown, no prose:
{
  "items": [
    { "question": string, "your_answer": string, "model_answer": string, "explanation": string }
  ]
}`;

export const interviewCorrections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReportInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { error: "LOVABLE_API_KEY is not configured." };
    const transcript = data.history
      .map((t) => `${t.role === "interviewer" ? "INTERVIEWER" : "CANDIDATE"}: ${t.text}`)
      .join("\n\n");
    const messages = [
      { role: "system", content: CORRECTIONS_SYSTEM },
      {
        role: "user",
        content: `TARGET_ROLE: ${data.role}\nLEVEL: ${data.level}\n\n--- TRANSCRIPT ---\n${transcript}\n--- END ---\n\nProduce the JSON now.`,
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
      console.error("corrections error", resp.status, t);
      return { error: `Corrections failed (${resp.status}).` };
    }
    const json: any = await resp.json();
    const raw: string = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
    }
    if (!parsed?.items) return { error: "Could not parse corrections." };
    return { items: parsed.items as Array<{ question: string; your_answer: string; model_answer: string; explanation: string }> };
  });