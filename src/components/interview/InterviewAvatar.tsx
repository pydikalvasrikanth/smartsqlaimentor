import { useEffect, useState } from "react";

/**
 * Stylised SVG "interviewer" face that lip-syncs to a 0..1 mouth-open value
 * driven externally by an AudioContext analyser. Eyes blink on a soft loop,
 * head bobs subtly while speaking, eyes track when listening.
 */
export function InterviewAvatar({
  mouthOpen,
  speaking,
  listening,
  thinking,
  name = "Aria",
}: {
  mouthOpen: number; // 0..1
  speaking: boolean;
  listening: boolean;
  thinking: boolean;
  name?: string;
}) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    let alive = true;
    const loop = () => {
      if (!alive) return;
      setBlink(true);
      setTimeout(() => setBlink(false), 130);
      setTimeout(loop, 2200 + Math.random() * 2600);
    };
    const id = setTimeout(loop, 1500);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, []);

  const open = Math.min(1, Math.max(0, mouthOpen));
  const mouthH = 4 + open * 22; // 4..26
  const mouthW = 38 + open * 10;
  const eyeH = blink ? 1 : 8;
  const status = thinking ? "thinking" : speaking ? "speaking" : listening ? "listening" : "idle";
  const ring =
    status === "speaking"
      ? "ring-emerald-400/70"
      : status === "listening"
        ? "ring-sky-400/70"
        : status === "thinking"
          ? "ring-amber-400/60"
          : "ring-white/15";

  return (
    <div
      className={`relative w-full h-full grid place-items-center bg-gradient-to-br from-[#0b1024] via-[#101a33] to-[#0a0f20] overflow-hidden`}
    >
      {/* soft glow */}
      <div className="absolute inset-0 opacity-70 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, hsl(220 80% 55% / 0.18), transparent 70%)",
        }}
      />
      <div className={`relative rounded-full ring-4 ${ring} transition-colors duration-300`}
        style={{
          width: "min(60%, 320px)",
          aspectRatio: "1 / 1",
          animation: speaking ? "headBob 1.6s ease-in-out infinite" : undefined,
        }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <defs>
            <radialGradient id="skin" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#f6d4b8" />
              <stop offset="70%" stopColor="#e0a98a" />
              <stop offset="100%" stopColor="#9a6a52" />
            </radialGradient>
            <linearGradient id="hair" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1f1a2e" />
              <stop offset="100%" stopColor="#0a0814" />
            </linearGradient>
          </defs>
          {/* head */}
          <ellipse cx="100" cy="108" rx="74" ry="84" fill="url(#skin)" />
          {/* hair */}
          <path d="M28,90 C30,40 80,20 120,28 C160,36 178,70 172,98 C158,72 132,60 100,62 C76,62 50,72 32,98 Z" fill="url(#hair)" />
          {/* ears */}
          <ellipse cx="28" cy="115" rx="8" ry="14" fill="#cfa087" />
          <ellipse cx="172" cy="115" rx="8" ry="14" fill="#cfa087" />
          {/* eyebrows */}
          <path d={`M62,82 Q72,${78 - (speaking ? 1 : 0)} 86,82`} stroke="#1f1a2e" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d={`M114,82 Q128,${78 - (speaking ? 1 : 0)} 138,82`} stroke="#1f1a2e" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* eyes */}
          <g>
            <ellipse cx="74" cy="105" rx="10" ry={eyeH} fill="#ffffff" />
            <ellipse cx="126" cy="105" rx="10" ry={eyeH} fill="#ffffff" />
            {!blink && (
              <>
                <circle cx={74 + (listening ? 2 : 0)} cy={105 + (thinking ? -1 : 0)} r="4.2" fill="#2a2540" />
                <circle cx={126 + (listening ? 2 : 0)} cy={105 + (thinking ? -1 : 0)} r="4.2" fill="#2a2540" />
                <circle cx={73} cy={103} r="1.2" fill="#fff" />
                <circle cx={125} cy={103} r="1.2" fill="#fff" />
              </>
            )}
          </g>
          {/* nose */}
          <path d="M100,110 Q97,130 100,140 Q104,142 108,138" stroke="#a4715a" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* mouth */}
          <g transform={`translate(100 ${160 - mouthH / 2})`}>
            <rect
              x={-mouthW / 2}
              y={0}
              width={mouthW}
              height={mouthH}
              rx={mouthH / 2}
              fill="#3a1722"
              stroke="#7a3344"
              strokeWidth="1.5"
              style={{ transition: "height 80ms linear, width 80ms linear, y 80ms linear" }}
            />
            {open > 0.35 && (
              <rect x={-mouthW / 2 + 4} y={2} width={mouthW - 8} height={3} rx={1.5} fill="#ffffff" opacity="0.85" />
            )}
          </g>
        </svg>
      </div>

      {/* status pill */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-[11px] font-mono text-white/90 border border-white/10">
        <span
          className={`h-2 w-2 rounded-full ${
            status === "speaking"
              ? "bg-emerald-400 animate-pulse"
              : status === "listening"
                ? "bg-sky-400 animate-pulse"
                : status === "thinking"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-white/40"
          }`}
        />
        {name} — {status}
      </div>

      <style>{`
        @keyframes headBob {
          0%, 100% { transform: translateY(0) rotate(-0.4deg); }
          50% { transform: translateY(-2px) rotate(0.4deg); }
        }
      `}</style>
    </div>
  );
}