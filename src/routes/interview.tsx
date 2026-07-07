import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { useResumableState } from "@/lib/resume";
import { ResumePrompt } from "@/components/ResumePrompt";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Mic, MicOff, Video, VideoOff, Square, Play, Loader2, ArrowLeft, Volume2, Sparkles, Award, AlertTriangle, Target, Lightbulb, Code2, Send, History, Trash2 } from "lucide-react";
import { interviewTurn, interviewTranscribe, interviewSpeak, interviewReport } from "@/lib/interview.functions";
import { InterviewAvatar } from "@/components/interview/InterviewAvatar";

export const Route = createFileRoute("/interview")({
  head: () => ({
    meta: [
      { title: "Live AI Interview — Data Engineer mock interview" },
      { name: "description", content: "Take a live AI-driven data engineering interview with voice + camera. The AI asks, you answer out loud — get scored at the end." },
      { property: "og:title", content: "Live AI Interview — Data Engineer mock interview" },
      { property: "og:description", content: "Take a live AI-driven data engineering interview with voice + camera. The AI asks, you answer out loud — get scored at the end." },
      { property: "og:url", content: "https://smartsqlaimentor.lovable.app/interview" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InterviewPage,
});

type Turn = { role: "interviewer" | "candidate"; text: string };

type Report = {
  overall_score?: number;
  recommendation?: string;
  headline?: string;
  competencies?: { name: string; score: number; evidence: string }[];
  strengths?: string[];
  gaps?: string[];
  red_flags?: string[];
  improvements?: string[];
  next_topics_to_study?: string[];
};

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

function base64ToBlob(b64: string, mime: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function InterviewPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const ask = useServerFn(interviewTurn);
  const transcribe = useServerFn(interviewTranscribe);
  const synthesize = useServerFn(interviewSpeak);
  const buildReport = useServerFn(interviewReport);

  const [role, setRole] = useState("Data Engineer");
  const [level, setLevel] = useState<"junior" | "mid" | "senior">("mid");
  const [years, setYears] = useState(3);
  const [competencies, setCompetencies] = useState("Python, SQL, Spark, Airflow, BigQuery, Kafka");
  const [voice, setVoice] = useState<"alloy" | "verse" | "shimmer" | "sage" | "nova" | "echo" | "onyx" | "fable">("alloy");
  const [sessionLength, setSessionLength] = useState<"short" | "standard" | "full">("full");
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [level01, setLevel01] = useState(0); // mic VU
  const [mouthOpen, setMouthOpen] = useState(0); // 0..1 avatar lip-sync
  const [error, setError] = useState<string | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [transcribing, setTranscribing] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Live coding scratchpad
  const [codeTask, setCodeTask] = useState<{ lang: "python" | "sql" | "text"; title: string } | null>(null);
  const [codeText, setCodeText] = useState("");
  const [codeSubmitting, setCodeSubmitting] = useState(false);

  // Full interview resume: setup + transcript. In-flight audio/TTS never persists.
  type InterviewResume = {
    role: string;
    level: "junior" | "mid" | "senior";
    years: number;
    competencies: string;
    voice: "alloy" | "verse" | "shimmer" | "sage" | "nova" | "echo" | "onyx" | "fable";
    sessionLength: "short" | "standard" | "full";
    started: boolean;
    ended: boolean;
    turns: Turn[];
  };
  const resume = useResumableState<InterviewResume>(
    "interview",
    {
      role: "Data Engineer",
      level: "mid",
      years: 3,
      competencies: "Python, SQL, Spark, Airflow, BigQuery, Kafka",
      voice: "alloy",
      sessionLength: "full",
      started: false,
      ended: false,
      turns: [],
    },
    { isEmpty: (s: any) => !s || (!s.started && (!s.turns || s.turns.length === 0)) },
  );
  useEffect(() => {
    if (!resume.ready) return;
    resume.setState({ role, level, years, competencies, voice, sessionLength, started, ended, turns });
  }, [role, level, years, competencies, voice, sessionLength, started, ended, turns, resume.ready]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // TTS playback + lip-sync analyser
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const ttsAnalyserRef = useRef<AnalyserNode | null>(null);
  const ttsRafRef = useRef<number | null>(null);
  const speakingRef = useRef<boolean>(false);
  const bargeMsRef = useRef<number>(0);
  const cooldownUntilRef = useRef<number>(0);
  const processingRef = useRef<boolean>(false);
  const thinkingRef = useRef<boolean>(false);
  const endedRef = useRef<boolean>(false);
  const isMobileRef = useRef<boolean>(false);
  isMobileRef.current = isMobile;
  useEffect(() => { endedRef.current = ended; }, [ended]);

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
        // Barge-in: while AI is speaking, watch for sustained user speech
        // Disable barge-in on mobile — phone speaker bleeds into mic and
        // triggers false interrupts, causing the AI to skip questions.
        if (speakingRef.current && !isMobileRef.current) {
          const dt = (4096 / ctx.sampleRate) * 1000;
          if (rms > 0.08) bargeMsRef.current += dt;
          else bargeMsRef.current = Math.max(0, bargeMsRef.current - dt * 0.5);
          if (bargeMsRef.current > 500) {
            bargeMsRef.current = 0;
            stopTts(true);
          }
        }
        if (recordingRef.current) {
          // Ignore any samples captured during the post-TTS cooldown window
          if (Date.now() < cooldownUntilRef.current) return;
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
        if (ttsRafRef.current) cancelAnimationFrame(ttsRafRef.current);
        ttsAudioRef.current?.pause();
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

  // ---- TTS playback with lip-sync analyser --------------------------------
  const stopTts = (bargedIn: boolean) => {
    if (ttsRafRef.current) cancelAnimationFrame(ttsRafRef.current);
    ttsRafRef.current = null;
    const a = ttsAudioRef.current;
    if (a) {
      try { a.pause(); a.currentTime = 0; } catch {}
    }
    speakingRef.current = false;
    setSpeaking(false);
    setMouthOpen(0);
    // Give the mic ~600ms after TTS stops to avoid capturing speaker bleed.
    cooldownUntilRef.current = Date.now() + 600;
    // On mobile: never auto-start listening — user must tap "Speak now".
    if (bargedIn && !endedRef.current && !isMobileRef.current) startListening();
  };

  const playInterviewer = async (text: string) => {
    setSpeaking(true);
    speakingRef.current = true;
    bargeMsRef.current = 0;
    try {
      const res: any = await synthesize({ data: { text, voice } });
      if (res?.error || !res?.audioBase64) {
        // Fallback: just show the text and start listening
        setSpeaking(false);
        speakingRef.current = false;
        if (!ended && micOn) startListening();
        return;
      }
      const blob = base64ToBlob(res.audioBase64, res.mimeType || "audio/mpeg");
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      ttsAudioRef.current = audio;

      const ctx = audioCtxRef.current;
      if (ctx) {
        try {
          const src = ctx.createMediaElementSource(audio);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          src.connect(analyser);
          src.connect(ctx.destination);
          ttsSourceRef.current = src;
          ttsAnalyserRef.current = analyser;
          const data = new Uint8Array(analyser.fftSize);
          const tick = () => {
            analyser.getByteTimeDomainData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
              const v = (data[i] - 128) / 128;
              sum += v * v;
            }
            const rms = Math.sqrt(sum / data.length);
            const target = Math.min(1, rms * 4.5);
            setMouthOpen((p) => p * 0.5 + target * 0.5);
            ttsRafRef.current = requestAnimationFrame(tick);
          };
          tick();
        } catch {
          // already connected — fallback to oscillating mouth
        }
      }

      audio.onended = () => {
        URL.revokeObjectURL(url);
        stopTts(false);
        // Auto-listen on desktop only. On mobile, wait for the user to tap.
        if (!endedRef.current && micOn && !isMobileRef.current) {
          setTimeout(() => { if (!endedRef.current) startListening(); }, 650);
        }
      };
      audio.onerror = () => stopTts(false);
      // iOS/Android often leave the AudioContext suspended until a user
      // gesture even after getUserMedia — resume it before playback.
      try { await audioCtxRef.current?.resume(); } catch {}
      await audio.play();
    } catch (e: any) {
      console.error(e);
      setSpeaking(false);
      speakingRef.current = false;
      if (!endedRef.current && micOn && !isMobileRef.current) startListening();
    }
  };

  const startListening = () => {
    if (recordingRef.current || speakingRef.current || processingRef.current || endedRef.current) return;
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
    if (processingRef.current) return;
    processingRef.current = true;
    const total = samplesRef.current.reduce((n, c) => n + c.length, 0);
    if (total < 4000) {
      processingRef.current = false;
      // too short — restart listening
      if (!endedRef.current && !isMobileRef.current) startListening();
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
      processingRef.current = false;
      if (!endedRef.current && !isMobileRef.current) startListening();
      return;
    }
    setTranscribing(true);
    try {
      const b64 = await blobToBase64(wav);
      const res: any = await transcribe({ data: { audioBase64: b64, mimeType: "audio/wav" } });
      setTranscribing(false);
      const said: string = (res?.text ?? "").trim();
      if (!said) {
        processingRef.current = false;
        if (!endedRef.current && !isMobileRef.current) startListening();
        return;
      }
      const next: Turn[] = [...turnsRef.current, { role: "candidate", text: said }];
      setTurns(next);
      await aiTurn(next, "next");
      processingRef.current = false;
    } catch (e: any) {
      setTranscribing(false);
      setError(e?.message ?? "Transcription failed.");
      processingRef.current = false;
      if (!endedRef.current && !isMobileRef.current) startListening();
    }
  }, [transcribe]);

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
    if (thinkingRef.current) return;
    thinkingRef.current = true;
    setThinking(true);
    try {
      const res: any = await ask({
        data: {
          role,
          level,
          experienceYears: years,
          competencies,
          history: history.map((t) => ({ role: t.role, text: t.text })),
          action,
          sessionLength,
        },
      });
      setThinking(false);
      thinkingRef.current = false;
      const reply: string = (res?.reply ?? res?.error ?? "").trim();
      if (!reply) {
        setError("The interviewer didn't respond. Try again.");
        return;
      }
      // Detect live-coding task marker on line 1: [CODE_TASK lang=python|sql title="…"]
      const codeMatch = reply.match(/^\s*\[CODE_TASK\s+lang=(python|sql|text)(?:\s+title="([^"]*)")?\]\s*/i);
      let spokenReply = reply;
      if (codeMatch) {
        spokenReply = reply.slice(codeMatch[0].length).trim();
        setCodeTask({ lang: codeMatch[1].toLowerCase() as any, title: codeMatch[2] || "Coding task" });
        setCodeText("");
      }
      const next: Turn[] = [...history, { role: "interviewer", text: reply }];
      setTurns(next);
      if (action === "end") {
        setEnded(true);
        await playInterviewer(spokenReply);
        // kick off scorecard pass
        setReportLoading(true);
        try {
          const rep: any = await buildReport({
            data: {
              role,
              level,
              experienceYears: years,
              competencies,
              history: next.map((t) => ({ role: t.role, text: t.text })),
            },
          });
          if (rep?.report) setReport(rep.report as Report);
          else if (rep?.error) setError(rep.error);
          // Save to local history
          try {
            if (rep?.report) {
              const item = {
                id: Date.now(),
                at: new Date().toISOString(),
                role, level, years, competencies, sessionLength,
                report: rep.report,
                turns: next.length,
              };
              const raw = localStorage.getItem("interview:history");
              const list = raw ? JSON.parse(raw) : [];
              list.unshift(item);
              localStorage.setItem("interview:history", JSON.stringify(list.slice(0, 20)));
            }
          } catch {}
        } finally {
          setReportLoading(false);
        }
      } else {
        playInterviewer(spokenReply);
      }
    } catch (e: any) {
      setThinking(false);
      thinkingRef.current = false;
      setError(e?.message ?? "AI error.");
    }
  };

  const begin = async () => {
    setStarted(true);
    setEnded(false);
    setTurns([]);
    setReport(null);
    await aiTurn([], "start");
  };

  const finish = async () => {
    recordingRef.current = false;
    setListening(false);
    stopTts(false);
    await aiTurn(turnsRef.current, "end");
  };

  // Submit the live-coding editor as the candidate's next answer.
  const submitCode = async () => {
    if (codeSubmitting || !codeTask) return;
    const code = codeText.trim();
    if (!code) return;
    setCodeSubmitting(true);
    try {
      const payload = `[SUBMITTED CODE]\n\`\`\`${codeTask.lang}\n${code}\n\`\`\``;
      const next: Turn[] = [...turnsRef.current, { role: "candidate", text: payload }];
      setTurns(next);
      setCodeTask(null);
      setCodeText("");
      await aiTurn(next, "next");
    } finally {
      setCodeSubmitting(false);
    }
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

      {!started && (
        <div className="max-w-[900px] mx-auto px-4 pt-4">
          {resume.hasResumable && resume.savedSnapshot && (
            <ResumePrompt
              updatedAt={resume.savedSnapshot.updatedAt}
              meta={
                resume.savedSnapshot.state.turns?.length
                  ? `${resume.savedSnapshot.state.turns.length} turns · ${resume.savedSnapshot.state.role}`
                  : `Saved setup · ${resume.savedSnapshot.state.role}`
              }
              onResume={() => {
                const s = resume.savedSnapshot!.state;
                setRole(s.role);
                setLevel(s.level);
                setYears(s.years);
                setCompetencies(s.competencies);
                setVoice(s.voice);
                if (s.sessionLength) setSessionLength(s.sessionLength);
                setTurns(s.turns ?? []);
                setEnded(s.ended);
                setStarted(s.started && !s.ended);
                resume.hydrate(resume.savedSnapshot);
              }}
              onDismiss={resume.dismiss}
            />
          )}
          <PastInterviewsPanel />
        </div>
      )}
      {!started && (
        <PreInterviewForm
          role={role}
          setRole={setRole}
          level={level}
          setLevel={setLevel}
          years={years}
          setYears={setYears}
          competencies={competencies}
          setCompetencies={setCompetencies}
          voice={voice}
          setVoice={setVoice}
          sessionLength={sessionLength}
          setSessionLength={setSessionLength}
          onBegin={begin}
        />
      )}

      {started && (
      <main className="max-w-[1200px] mx-auto px-4 py-6 grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Video + question panel */}
        <section className="space-y-4">
          {/* Avatar (main) + small user PIP */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border bg-black">
            <InterviewAvatar
              mouthOpen={mouthOpen}
              speaking={speaking}
              listening={listening}
              thinking={thinking}
              name="Aria"
            />
            {/* user camera PIP */}
            <div className="absolute bottom-3 right-3 w-32 h-24 sm:w-40 sm:h-28 rounded-lg overflow-hidden border border-white/20 bg-black shadow-lg">
              <video ref={videoRef} muted playsInline className={`h-full w-full object-cover ${camOn ? "" : "opacity-0"}`} />
              {!camOn && (
                <div className="absolute inset-0 grid place-items-center text-[10px] text-white/60">Camera off</div>
              )}
            </div>

            {/* Mic VU */}
            <div className="absolute bottom-3 left-3 right-[10.5rem] flex items-center gap-2">
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
              <Volume2 className="h-3 w-3" /> Aria · {role} · {level}
            </div>
            {thinking ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking of the next question…
              </div>
            ) : (
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {(turns.filter((t) => t.role === "interviewer").slice(-1)[0]?.text ?? "")
                  .replace(/^\s*\[CODE_TASK[^\]]*\]\s*/i, "")}
              </p>
            )}
          </div>

          {/* Live coding scratchpad */}
          {codeTask && !ended && (
            <div className="rounded-2xl border border-primary/40 bg-surface-1 overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border bg-surface-2/60">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Code2 className="h-3.5 w-3.5 text-primary" />
                  Live coding · <span className="font-mono uppercase text-primary">{codeTask.lang}</span>
                  <span className="text-muted-foreground font-normal truncate">— {codeTask.title}</span>
                </div>
                <button
                  onClick={() => setCodeTask(null)}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >Skip</button>
              </div>
              <textarea
                value={codeText}
                onChange={(e) => setCodeText(e.target.value)}
                spellCheck={false}
                rows={12}
                placeholder={codeTask.lang === "sql" ? "-- Write your query here" : "# Write your solution here"}
                className="w-full bg-background text-foreground font-mono text-[13px] leading-relaxed px-4 py-3 outline-none resize-y min-h-[220px]"
              />
              <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-border">
                <span className="text-[11px] text-muted-foreground">
                  Aria can see your code. Submit when ready — she'll dry-run inputs and probe edge cases.
                </span>
                <button
                  onClick={submitCode}
                  disabled={codeSubmitting || !codeText.trim()}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                >
                  {codeSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Submit code
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!ended ? (
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
                    onClick={() => {
                      if (speaking) stopTts(true);
                      else if (!thinking) startListening();
                    }}
                    disabled={thinking}
                    className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm disabled:opacity-50"
                  >
                    <Mic className="h-4 w-4" /> {speaking ? "Interrupt & speak" : "Speak now"}
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
                onClick={() => { setStarted(false); setEnded(false); setTurns([]); setReport(null); }}
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

          {ended && (
            <ScoreCard report={report} loading={reportLoading} />
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
                  {t.role === "interviewer" ? "Aria" : "You"}
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
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pre-interview form
// ---------------------------------------------------------------------------
function PreInterviewForm({
  role, setRole, level, setLevel, years, setYears, competencies, setCompetencies, voice, setVoice, sessionLength, setSessionLength, onBegin,
}: {
  role: string; setRole: (v: string) => void;
  level: "junior" | "mid" | "senior"; setLevel: (v: "junior" | "mid" | "senior") => void;
  years: number; setYears: (v: number) => void;
  competencies: string; setCompetencies: (v: string) => void;
  voice: string; setVoice: (v: any) => void;
  sessionLength: "short" | "standard" | "full"; setSessionLength: (v: "short" | "standard" | "full") => void;
  onBegin: () => void;
}) {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="rounded-2xl border border-border bg-surface-1 p-6 sm:p-8 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-2">
            <Sparkles className="h-3 w-3" /> MNC-style live mock interview
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Set up your interview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Aria will calibrate questions to your target role, level and core competencies — Google/Amazon/Meta/Microsoft style.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Target role</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Data Engineer"
              className="mt-1 w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Seniority level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
              className="mt-1 w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
            >
              <option value="junior">Junior (L3 / 0–2 yrs)</option>
              <option value="mid">Mid (L4 / 3–5 yrs)</option>
              <option value="senior">Senior (L5+ / 6+ yrs)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Years of experience</label>
            <input
              type="number"
              min={0} max={40}
              value={years}
              onChange={(e) => setYears(Math.max(0, Math.min(40, Number(e.target.value) || 0)))}
              className="mt-1 w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Interviewer voice</label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value as any)}
              className="mt-1 w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
            >
              <option value="alloy">Alloy (neutral)</option>
              <option value="sage">Sage (warm)</option>
              <option value="verse">Verse (crisp)</option>
              <option value="shimmer">Shimmer (bright)</option>
              <option value="nova">Nova (energetic)</option>
              <option value="echo">Echo (measured)</option>
              <option value="onyx">Onyx (deep)</option>
              <option value="fable">Fable (storytelling)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Session length</label>
            <select
              value={sessionLength}
              onChange={(e) => setSessionLength(e.target.value as any)}
              className="mt-1 w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
            >
              <option value="short">Short (~10 min · 5 Q)</option>
              <option value="standard">Standard (~25 min · 10 Q)</option>
              <option value="full">Full loop (~45 min · tech + coding + design + behavioural)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Core competencies (comma-separated)</label>
            <textarea
              value={competencies}
              onChange={(e) => setCompetencies(e.target.value)}
              rows={2}
              placeholder="Python, SQL, Spark, Airflow, BigQuery, Kafka, system design"
              className="mt-1 w-full bg-background border border-input rounded-md px-3 py-2 text-sm resize-none"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Aria will bias technical questions toward these. Leave defaults to cover the full data-engineering surface.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface-2/40 p-3 text-[11px] text-muted-foreground space-y-1">
          <p>• Desktop: barge-in auto-listens. Mobile: tap “Speak now” after Aria finishes so speaker audio doesn't bleed into the mic.</p>
          <p>• ~25-30 min: intro → deep technical → behavioural → wrap-up + scorecard.</p>
          <p>• Tap “Done answering” when you finish each response.</p>
        </div>

        <button
          onClick={onBegin}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-br from-primary to-primary-glow px-4 py-3 text-sm font-medium text-primary-foreground"
        >
          <Play className="h-4 w-4" /> Start interview with Aria
        </button>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Post-interview scorecard
// ---------------------------------------------------------------------------
function ScoreCard({ report, loading }: { report: Report | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface-1 p-6 flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Compiling your evaluation scorecard…
      </div>
    );
  }
  if (!report) return null;
  const rec = (report.recommendation || "").toLowerCase();
  const recColor = rec.includes("strong_hire")
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    : rec.includes("no_hire")
      ? "bg-red-500/15 text-red-400 border-red-500/30"
      : rec.includes("hire")
        ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
        : "bg-muted text-muted-foreground border-border";
  const score = typeof report.overall_score === "number" ? report.overall_score.toFixed(1) : "—";

  return (
    <div className="rounded-2xl border border-border bg-surface-1 p-5 sm:p-6 space-y-5">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 w-24 h-24">
          <span className="text-3xl font-bold tracking-tight">{score}</span>
          <span className="text-[10px] uppercase font-mono text-muted-foreground">overall / 10</span>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className={`inline-block text-[11px] font-mono uppercase px-2 py-0.5 rounded border ${recColor} mb-2`}>
            {report.recommendation || "evaluation"}
          </div>
          <p className="text-sm leading-relaxed">{report.headline}</p>
        </div>
      </div>

      {report.competencies && report.competencies.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold mb-2"><Target className="h-3.5 w-3.5" /> Per-competency</div>
          <div className="mb-4">
            <RadarChart data={report.competencies.map((c) => ({ label: c.name, value: c.score }))} />
          </div>
          <div className="space-y-2">
            {report.competencies.map((c, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="font-medium">{c.name}</span>
                  <span className="font-mono text-muted-foreground">{c.score.toFixed(1)}/10</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary-glow"
                    style={{ width: `${Math.min(100, c.score * 10)}%` }}
                  />
                </div>
                {c.evidence && <p className="text-[11px] text-muted-foreground mt-1">{c.evidence}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Section icon={<Award className="h-3.5 w-3.5" />} title="Strengths" items={report.strengths} tone="emerald" />
        <Section icon={<AlertTriangle className="h-3.5 w-3.5" />} title="Gaps" items={report.gaps} tone="amber" />
        {report.red_flags && report.red_flags.length > 0 && (
          <Section icon={<AlertTriangle className="h-3.5 w-3.5" />} title="Red flags" items={report.red_flags} tone="red" />
        )}
        <Section icon={<Lightbulb className="h-3.5 w-3.5" />} title="Improvements" items={report.improvements} tone="sky" />
        {report.next_topics_to_study && report.next_topics_to_study.length > 0 && (
          <Section icon={<Sparkles className="h-3.5 w-3.5" />} title="Study next" items={report.next_topics_to_study} tone="violet" />
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, items, tone }: { icon: React.ReactNode; title: string; items?: string[]; tone: "emerald" | "amber" | "red" | "sky" | "violet" }) {
  if (!items || items.length === 0) return null;
  const dot = {
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    red: "bg-red-400",
    sky: "bg-sky-400",
    violet: "bg-violet-400",
  }[tone];
  return (
    <div className="rounded-lg border border-border bg-surface-2/40 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold mb-2">{icon} {title}</div>
      <ul className="space-y-1.5">
        {items.map((s, i) => (
          <li key={i} className="text-[12.5px] leading-snug flex gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${dot} mt-1.5 shrink-0`} />
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Radar chart (SVG) — per-competency visualisation
// ---------------------------------------------------------------------------
function RadarChart({ data, max = 10 }: { data: { label: string; value: number }[]; max?: number }) {
  const pts = data.slice(0, 8);
  if (pts.length < 3) return null;
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 40;
  const angle = (i: number) => (Math.PI * 2 * i) / pts.length - Math.PI / 2;
  const point = (i: number, v: number) => {
    const rr = (Math.max(0, Math.min(max, v)) / max) * r;
    return [cx + Math.cos(angle(i)) * rr, cy + Math.sin(angle(i)) * rr] as const;
  };
  const rings = [0.25, 0.5, 0.75, 1];
  const poly = pts.map((p, i) => point(i, p.value).join(",")).join(" ");
  return (
    <div className="w-full flex justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px] h-auto">
        {rings.map((f, i) => (
          <polygon
            key={i}
            points={pts.map((_, k) => [cx + Math.cos(angle(k)) * r * f, cy + Math.sin(angle(k)) * r * f].join(",")).join(" ")}
            fill="none"
            stroke="currentColor"
            className="text-border"
            strokeWidth={1}
          />
        ))}
        {pts.map((_, i) => {
          const [x, y] = [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" className="text-border" strokeWidth={1} />;
        })}
        <polygon points={poly} fill="hsl(var(--primary) / 0.25)" stroke="hsl(var(--primary))" strokeWidth={1.5} />
        {pts.map((p, i) => {
          const [px, py] = point(i, p.value);
          const [lx, ly] = [cx + Math.cos(angle(i)) * (r + 18), cy + Math.sin(angle(i)) * (r + 18)];
          const anchor = Math.abs(Math.cos(angle(i))) < 0.3 ? "middle" : Math.cos(angle(i)) > 0 ? "start" : "end";
          const label = p.label.length > 16 ? p.label.slice(0, 15) + "…" : p.label;
          return (
            <g key={i}>
              <circle cx={px} cy={py} r={2.5} fill="hsl(var(--primary))" />
              <text
                x={lx}
                y={ly}
                fontSize={9}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="fill-muted-foreground"
              >{label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Past interviews — restored from localStorage
// ---------------------------------------------------------------------------
type PastInterview = {
  id: number;
  at: string;
  role: string;
  level: string;
  turns: number;
  sessionLength: string;
  report: Report;
};

function PastInterviewsPanel() {
  const [items, setItems] = useState<PastInterview[]>([]);
  const [open, setOpen] = useState<PastInterview | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("interview:history");
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  const remove = (id: number) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    localStorage.setItem("interview:history", JSON.stringify(next));
  };
  const clearAll = () => {
    if (!confirm("Delete all past interview reports?")) return;
    setItems([]);
    localStorage.removeItem("interview:history");
  };

  if (items.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface-1 p-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Past interviews ({items.length})</h3>
        <button onClick={clearAll} className="ml-auto text-[11px] text-muted-foreground hover:text-destructive inline-flex items-center gap-1">
          <Trash2 className="h-3 w-3" /> Clear
        </button>
      </div>
      <div className="space-y-1.5 max-h-72 overflow-y-auto">
        {items.map((it) => {
          const score = typeof it.report.overall_score === "number" ? it.report.overall_score.toFixed(1) : "—";
          const rec = (it.report.recommendation || "").toLowerCase();
          const tone = rec.includes("strong_hire")
            ? "text-emerald-400"
            : rec.includes("no_hire") ? "text-red-400" : rec.includes("hire") ? "text-sky-400" : "text-muted-foreground";
          return (
            <div key={it.id} className="flex items-center gap-3 rounded-md border border-border bg-surface-2/40 px-3 py-2 hover:bg-surface-2/70 transition-colors">
              <button className="flex-1 text-left" onClick={() => setOpen(it)}>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold">{score}</span>
                  <span className="font-medium">{it.role}</span>
                  <span className="text-muted-foreground">· {it.level} · {it.sessionLength}</span>
                  <span className={`ml-auto text-[10px] font-mono uppercase ${tone}`}>{it.report.recommendation || ""}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(it.at).toLocaleString()} · {it.turns} turns
                </div>
              </button>
              <button onClick={() => remove(it.id)} aria-label="Delete" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-background p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold">{open.role} · {open.level}</h4>
              <span className="text-[10px] text-muted-foreground">{new Date(open.at).toLocaleString()}</span>
              <button onClick={() => setOpen(null)} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Close</button>
            </div>
            <ScoreCard report={open.report} loading={false} />
          </div>
        </div>
      )}
    </div>
  );
}