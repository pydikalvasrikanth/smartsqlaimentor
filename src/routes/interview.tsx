import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Mic, MicOff, Video, VideoOff, Square, Play, Loader2, ArrowLeft, Volume2 } from "lucide-react";
import { interviewTurn, interviewTranscribe } from "@/lib/interview.functions";

export const Route = createFileRoute("/interview")({
  head: () => ({
    meta: [
      { title: "Live AI Interview — Data Engineer mock interview" },
      { name: "description", content: "Take a live AI-driven data engineering interview with voice + camera. The AI asks, you answer out loud — get scored at the end." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InterviewPage,
});

type Turn = { role: "interviewer" | "candidate"; text: string };

// --- WAV encoder (16-bit PCM mono, 16 kHz) -----------------------------------
function encodeWav(samples: Float32Array, sampleRate: number) {
  // downsample to 16 kHz mono
  const target = 16000;
  const ratio = sampleRate / target;
  const outLen = Math.floor(samples.length / ratio);
  const out = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const src = samples[Math.floor(i * ratio)];
    const s = Math.max(-1, Math.min(1, src));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const buf = new ArrayBuffer(44 + out.length * 2);
  const view = new DataView(buf);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + out.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, target, true);
  view.setUint32(28, target * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, out.length * 2, true);
  let off = 44;
  for (let i = 0; i < out.length; i++, off += 2) view.setInt16(off, out[i], true);
  return new Blob([buf], { type: "audio/wav" });
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function speak(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((v) => /en-(US|GB)/i.test(v.lang) && /female|samantha|google/i.test(v.name)) ||
    voices.find((v) => /en/i.test(v.lang));
  if (preferred) u.voice = preferred;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

function InterviewPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const ask = useServerFn(interviewTurn);
  const transcribe = useServerFn(interviewTranscribe);

  const [role, setRole] = useState("Data Engineer");
  const [level, setLevel] = useState<"junior" | "mid" | "senior">("mid");
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [level01, setLevel01] = useState(0); // mic VU
  const [error, setError] = useState<string | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [transcribing, setTranscribing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const procRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const samplesRef = useRef<Float32Array[]>([]);
  const recordingRef = useRef<boolean>(false);
  const silenceMsRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  const turnsRef = useRef<Turn[]>([]);
  turnsRef.current = turns;

  // Acquire camera + mic
  const setupMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      mediaRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      // Web Audio pipeline (PCM capture + analyser for VU/VAD)
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      sourceRef.current = src;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyserRef.current = analyser;
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      procRef.current = proc;
      proc.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        // VU
        let sum = 0;
        for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
        const rms = Math.sqrt(sum / input.length);
        setLevel01((p) => p * 0.6 + rms * 0.4);
        if (recordingRef.current) {
          samplesRef.current.push(new Float32Array(input));
          // simple silence detector
          const isSilent = rms < 0.012;
          const dt = (4096 / ctx.sampleRate) * 1000;
          silenceMsRef.current = isSilent ? silenceMsRef.current + dt : 0;
        }
      };
      src.connect(analyser);
      src.connect(proc);
      proc.connect(ctx.destination);
    } catch (err: any) {
      console.error(err);
      setError("Could not access camera or microphone. Please grant permission and reload.");
    }
  }, []);

  useEffect(() => {
    setupMedia();
    return () => {
      try {
        mediaRef.current?.getTracks().forEach((t) => t.stop());
        procRef.current?.disconnect();
        sourceRef.current?.disconnect();
        audioCtxRef.current?.close();
        window.speechSynthesis?.cancel();
      } catch {}
    };
  }, [setupMedia]);

  // Toggle camera
  useEffect(() => {
    mediaRef.current?.getVideoTracks().forEach((t) => (t.enabled = camOn));
  }, [camOn]);
  useEffect(() => {
    mediaRef.current?.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [micOn]);

  // ---- Turn helpers --------------------------------------------------------
  const playInterviewer = (text: string) => {
    setSpeaking(true);
    speak(text, () => {
      setSpeaking(false);
      // automatically start listening after AI finishes speaking
      if (!ended && micOn) startListening();
    });
  };

  const startListening = () => {
    samplesRef.current = [];
    silenceMsRef.current = 0;
    startedAtRef.current = Date.now();
    recordingRef.current = true;
    setListening(true);
  };

  const stopListening = useCallback(async () => {
    if (!recordingRef.current) return;
    recordingRef.current = false;
    setListening(false);
    const total = samplesRef.current.reduce((n, c) => n + c.length, 0);
    if (total < 4000) {
      // too short — restart listening
      if (!ended) startListening();
      return;
    }
    const merged = new Float32Array(total);
    let o = 0;
    for (const c of samplesRef.current) {
      merged.set(c, o);
      o += c.length;
    }
    samplesRef.current = [];
    const ctx = audioCtxRef.current!;
    const wav = encodeWav(merged, ctx.sampleRate);
    if (wav.size < 3000) {
      if (!ended) startListening();
      return;
    }
    setTranscribing(true);
    try {
      const b64 = await blobToBase64(wav);
      const res: any = await transcribe({ data: { audioBase64: b64, mimeType: "audio/wav" } });
      setTranscribing(false);
      const said: string = (res?.text ?? "").trim();
      if (!said) {
        if (!ended) startListening();
        return;
      }
      const next: Turn[] = [...turnsRef.current, { role: "candidate", text: said }];
      setTurns(next);
      await aiTurn(next, "next");
    } catch (e: any) {
      setTranscribing(false);
      setError(e?.message ?? "Transcription failed.");
      if (!ended) startListening();
    }
  }, [ended, transcribe]);

  // Auto-stop after ~1.6s of silence while listening
  useEffect(() => {
    if (!listening) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      if (silenceMsRef.current > 1600 && elapsed > 1500) {
        stopListening();
      }
      // safety cap: 90 s per answer
      if (elapsed > 90_000) stopListening();
    }, 200);
    return () => clearInterval(id);
  }, [listening, stopListening]);

  const aiTurn = async (history: Turn[], action: "start" | "next" | "end") => {
    setThinking(true);
    try {
      const res: any = await ask({
        data: {
          role,
          level,
          history: history.map((t) => ({ role: t.role, text: t.text })),
          action,
        },
      });
      setThinking(false);
      const reply: string = (res?.reply ?? res?.error ?? "").trim();
      if (!reply) {
        setError("The interviewer didn't respond. Try again.");
        return;
      }
      const next: Turn[] = [...history, { role: "interviewer", text: reply }];
      setTurns(next);
      if (action === "end") {
        setEnded(true);
        speak(reply.slice(0, 400));
      } else {
        playInterviewer(reply);
      }
    } catch (e: any) {
      setThinking(false);
      setError(e?.message ?? "AI error.");
    }
  };

  const begin = async () => {
    setStarted(true);
    setEnded(false);
    setTurns([]);
    await aiTurn([], "start");
  };

  const finish = async () => {
    recordingRef.current = false;
    setListening(false);
    await aiTurn(turnsRef.current, "end");
  };

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface-2/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>
          <h1 className="text-sm font-semibold tracking-tight">Live AI Interview</h1>
          <span className="ml-auto text-[11px] font-mono text-muted-foreground hidden sm:inline">
            {started ? (ended ? "ended" : speaking ? "interviewer speaking" : listening ? "listening…" : thinking ? "thinking…" : "idle") : "ready"}
          </span>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-6 grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Video + question panel */}
        <section className="space-y-4">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border bg-black grid place-items-center">
            <video ref={videoRef} muted playsInline className={`h-full w-full object-cover ${camOn ? "" : "opacity-0"}`} />
            {!camOn && <p className="absolute text-xs text-muted-foreground">Camera off</p>}

            {/* Mic VU */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-200 transition-[width] duration-75"
                  style={{ width: `${Math.min(100, Math.round(level01 * 600))}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-white/80">
                {listening ? "REC" : speaking ? "AI" : transcribing ? "…" : "—"}
              </span>
            </div>

            {/* Controls */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={() => setCamOn((v) => !v)}
                className="h-8 w-8 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label="Toggle camera"
              >
                {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setMicOn((v) => !v)}
                className="h-8 w-8 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label="Toggle mic"
              >
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Current question */}
          <div className="rounded-2xl border border-border bg-surface-1 p-5 min-h-[120px]">
            <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-2">
              <Volume2 className="h-3 w-3" /> Interviewer
            </div>
            {thinking ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking of the next question…
              </div>
            ) : (
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {turns.filter((t) => t.role === "interviewer").slice(-1)[0]?.text ?? (started ? "" : "Press Start to begin the interview.")}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!started ? (
              <>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="bg-background border border-input rounded-md px-3 py-2 text-sm"
                >
                  <option>Data Engineer</option>
                  <option>GCP Data Engineer</option>
                  <option>Analytics Engineer</option>
                  <option>Python Developer</option>
                  <option>SQL Developer</option>
                </select>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="bg-background border border-input rounded-md px-3 py-2 text-sm"
                >
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                </select>
                <button
                  onClick={begin}
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-to-br from-primary to-primary-glow px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  <Play className="h-4 w-4" /> Start interview
                </button>
              </>
            ) : !ended ? (
              <>
                {listening ? (
                  <button
                    onClick={() => stopListening()}
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    <Square className="h-4 w-4" /> Done answering
                  </button>
                ) : (
                  <button
                    onClick={() => !speaking && !thinking && startListening()}
                    disabled={speaking || thinking}
                    className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm disabled:opacity-50"
                  >
                    <Mic className="h-4 w-4" /> Speak now
                  </button>
                )}
                <button
                  onClick={finish}
                  className="ml-auto inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
                >
                  End & get feedback
                </button>
              </>
            ) : (
              <button
                onClick={() => { setStarted(false); setEnded(false); setTurns([]); }}
                className="inline-flex items-center gap-2 rounded-md bg-gradient-to-br from-primary to-primary-glow px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <Play className="h-4 w-4" /> Start a new interview
              </button>
            )}
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-sm p-3">
              {error}
            </div>
          )}
        </section>

        {/* Transcript */}
        <aside className="rounded-2xl border border-border bg-surface-1 p-4 h-[calc(100vh-160px)] overflow-y-auto sticky top-20">
          <h2 className="text-sm font-semibold mb-3">Live transcript</h2>
          <div className="space-y-3">
            {turns.length === 0 && (
              <p className="text-xs text-muted-foreground">The full conversation will appear here as you speak.</p>
            )}
            {turns.map((t, i) => (
              <div key={i} className={t.role === "interviewer" ? "" : "pl-4 border-l-2 border-primary/60"}>
                <p className="text-[10px] font-mono uppercase text-muted-foreground mb-0.5">
                  {t.role === "interviewer" ? "Interviewer" : "You"}
                </p>
                <p className="text-sm whitespace-pre-wrap">{t.text}</p>
              </div>
            ))}
            {transcribing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Transcribing your answer…
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}