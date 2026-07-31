import type { DiagramKind } from "@/content/types";

const A = "var(--java-orange)";
const B = "var(--java-blue)";
const T = "var(--teal)";
const P = "var(--purple)";
const K = "var(--pink)";
const MUTED = "var(--muted-foreground)";

export function Diagram({ name, caption }: { name: DiagramKind; caption?: string }) {
  return (
    <div className="rounded-lg border border-border bg-[color:var(--surface2)] p-3">
      <style>{ANIM_CSS}</style>
      <div className="overflow-x-auto">{render(name)}</div>
      {caption && (
        <div className="mono mt-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          {caption}
        </div>
      )}
    </div>
  );
}

const ANIM_CSS = `
@keyframes cxx-flow { 0%{stroke-dashoffset:24} 100%{stroke-dashoffset:0} }
@keyframes cxx-pulse { 0%,100%{opacity:.55} 50%{opacity:1} }
@keyframes cxx-slide-x { 0%{transform:translateX(-6px);opacity:.3} 50%{opacity:1} 100%{transform:translateX(6px);opacity:.3} }
@keyframes cxx-fill { 0%,20%{width:0} 100%{width:var(--w,100%)} }
@keyframes cxx-drop { 0%{transform:translateY(-4px);opacity:0} 60%{transform:translateY(0);opacity:1} 100%{transform:translateY(0);opacity:1} }
.cxx-flow { stroke-dasharray:6 6; animation:cxx-flow 1s linear infinite; }
.cxx-pulse { animation:cxx-pulse 1.8s ease-in-out infinite; }
.cxx-slide-x { animation:cxx-slide-x 2s ease-in-out infinite; }
.cxx-blink { animation:cxx-pulse 1.2s ease-in-out infinite; }
.cxx-drop { animation:cxx-drop .8s ease-out both; }
`;

function render(name: DiagramKind) {
  switch (name) {
    case "memory-layout":
      return (
        <svg viewBox="0 0 320 180" className="w-full">
          {[
            ["Stack", "grows down ↓", A, 20],
            ["Heap", "grows up ↑", B, 60],
            ["BSS", "uninitialised", T, 100],
            ["Data", "initialised globals", P, 130],
            ["Text", "code / read-only", K, 160],
          ].map(([label, sub, color, y]) => (
            <g key={label as string}>
              <rect x={20} y={y as number} width={200} height={22} rx={4}
                fill={`color-mix(in oklab, ${color as string} 22%, transparent)`}
                stroke={color as string} />
              <text x={30} y={(y as number) + 15} fontSize={11} fill="currentColor" className="mono">
                {label as string}
              </text>
              <text x={230} y={(y as number) + 15} fontSize={10} fill={MUTED} className="mono">
                {sub as string}
              </text>
            </g>
          ))}
        </svg>
      );
    case "pointer-arrow":
      return (
        <svg viewBox="0 0 320 140" className="w-full">
          <rect x={20} y={40} width={90} height={40} rx={6} fill={`color-mix(in oklab, ${A} 22%, transparent)`} stroke={A} />
          <text x={65} y={30} fontSize={10} fill={MUTED} textAnchor="middle" className="mono">int* p</text>
          <text x={65} y={65} fontSize={12} fill="currentColor" textAnchor="middle" className="mono">0x7ffd10</text>
          <rect x={210} y={40} width={90} height={40} rx={6} fill={`color-mix(in oklab, ${B} 22%, transparent)`} stroke={B} />
          <text x={255} y={30} fontSize={10} fill={MUTED} textAnchor="middle" className="mono">int x = 42</text>
          <text x={255} y={65} fontSize={14} fill="currentColor" textAnchor="middle" className="mono cxx-blink">42</text>
          <line x1={110} y1={60} x2={205} y2={60} stroke={A} strokeWidth={2} markerEnd="url(#arr)" className="cxx-flow" />
          <circle r={4} fill={A} className="cxx-slide-x">
            <animateMotion dur="2s" repeatCount="indefinite" path="M110,60 L205,60" />
          </circle>
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={A} />
            </marker>
          </defs>
        </svg>
      );
    case "stack-frame":
      return (
        <svg viewBox="0 0 320 200" className="w-full">
          {["main()", "foo(int)", "bar()"].map((f, i) => (
            <g key={f} className="cxx-drop" style={{ animationDelay: `${i * 0.25}s` }}>
              <rect x={40} y={30 + i * 50} width={240} height={40} rx={6}
                fill={`color-mix(in oklab, ${[A, B, T][i]} 22%, transparent)`}
                stroke={[A, B, T][i]} />
              <text x={54} y={55 + i * 50} fontSize={12} fill="currentColor" className="mono">{f}</text>
              <text x={266} y={55 + i * 50} fontSize={10} fill={MUTED} textAnchor="end" className="mono">
                {["ret, args, locals", "ret, args, locals", "ret, args, locals"][i]}
              </text>
            </g>
          ))}
          <text x={20} y={45} fontSize={10} fill={MUTED} className="mono">top ↑</text>
        </svg>
      );
    case "heap-vs-stack":
      return (
        <svg viewBox="0 0 320 180" className="w-full">
          <rect x={20} y={30} width={130} height={130} rx={8} fill={`color-mix(in oklab, ${A} 15%, transparent)`} stroke={A} />
          <text x={85} y={20} fontSize={11} fill={A} textAnchor="middle" className="mono">STACK</text>
          <text x={85} y={55} fontSize={10} fill="currentColor" textAnchor="middle">automatic</text>
          <text x={85} y={75} fontSize={10} fill="currentColor" textAnchor="middle">fast, LIFO</text>
          <text x={85} y={95} fontSize={10} fill="currentColor" textAnchor="middle">small (~1 MB)</text>
          <text x={85} y={115} fontSize={10} fill={MUTED} textAnchor="middle">frees on return</text>
          <rect x={170} y={30} width={130} height={130} rx={8} fill={`color-mix(in oklab, ${B} 15%, transparent)`} stroke={B} />
          <text x={235} y={20} fontSize={11} fill={B} textAnchor="middle" className="mono">HEAP</text>
          <text x={235} y={55} fontSize={10} fill="currentColor" textAnchor="middle">manual / new</text>
          <text x={235} y={75} fontSize={10} fill="currentColor" textAnchor="middle">large</text>
          <text x={235} y={95} fontSize={10} fill="currentColor" textAnchor="middle">lifetime = you</text>
          <text x={235} y={115} fontSize={10} fill={MUTED} textAnchor="middle">free / delete</text>
        </svg>
      );
    case "vtable":
      return (
        <svg viewBox="0 0 340 200" className="w-full">
          <rect x={20} y={30} width={110} height={60} rx={6} fill={`color-mix(in oklab, ${A} 22%, transparent)`} stroke={A} />
          <text x={75} y={55} fontSize={11} textAnchor="middle" fill="currentColor" className="mono">Dog obj</text>
          <text x={75} y={75} fontSize={10} textAnchor="middle" fill={MUTED} className="mono">vptr →</text>
          <rect x={170} y={20} width={150} height={90} rx={6} fill={`color-mix(in oklab, ${B} 22%, transparent)`} stroke={B} />
          <text x={245} y={40} fontSize={11} textAnchor="middle" fill={B} className="mono">Dog vtable</text>
          <text x={185} y={65} fontSize={10} fill="currentColor" className="mono">speak → Dog::speak</text>
          <text x={185} y={85} fontSize={10} fill="currentColor" className="mono">~Dog → ~Dog()</text>
          <line x1={130} y1={70} x2={170} y2={55} stroke={A} strokeWidth={2} markerEnd="url(#arr2)" />
          <defs>
            <marker id="arr2" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={A} />
            </marker>
          </defs>
          <text x={170} y={140} fontSize={10} fill={MUTED} className="mono">virtual call → indirect through vptr</text>
        </svg>
      );
    case "class-tree":
      return (
        <svg viewBox="0 0 320 180" className="w-full">
          <rect x={120} y={20} width={80} height={30} rx={6} fill={`color-mix(in oklab, ${A} 22%, transparent)`} stroke={A} />
          <text x={160} y={40} fontSize={11} textAnchor="middle" fill="currentColor" className="mono">Animal</text>
          {["Dog", "Cat", "Bird"].map((n, i) => (
            <g key={n}>
              <line x1={160} y1={50} x2={60 + i * 100} y2={110} stroke={MUTED} />
              <rect x={20 + i * 100} y={110} width={80} height={30} rx={6}
                fill={`color-mix(in oklab, ${[B, T, P][i]} 22%, transparent)`} stroke={[B, T, P][i]} />
              <text x={60 + i * 100} y={130} fontSize={11} textAnchor="middle" fill="currentColor" className="mono">{n}</text>
            </g>
          ))}
        </svg>
      );
    case "vector-grow":
      return (
        <svg viewBox="0 0 320 180" className="w-full">
          {[
            { cap: 2, size: 2, y: 20 },
            { cap: 4, size: 3, y: 70 },
            { cap: 8, size: 5, y: 120 },
          ].map(({ cap, size, y }, k) => (
            <g key={k} className="cxx-drop" style={{ animationDelay: `${k * 0.4}s` }}>
              <text x={20} y={y + 22} fontSize={10} fill={MUTED} className="mono">cap {cap}</text>
              {Array.from({ length: cap }).map((_, i) => (
                <rect key={i} x={70 + i * 28} y={y} width={24} height={30} rx={3}
                  fill={i < size ? `color-mix(in oklab, ${A} 40%, transparent)` : "transparent"}
                  stroke={i < size ? A : MUTED} strokeDasharray={i < size ? undefined : "3 3"} />
              ))}
            </g>
          ))}
          <text x={20} y={170} fontSize={10} fill={MUTED} className="mono">push_back reallocates + copies when size &gt; cap</text>
        </svg>
      );
    case "linked-list":
      return (
        <svg viewBox="0 0 340 100" className="w-full">
          {[10, 20, 30, 40].map((v, i) => (
            <g key={i}>
              <rect x={20 + i * 80} y={30} width={60} height={40} rx={6}
                fill={`color-mix(in oklab, ${B} 22%, transparent)`} stroke={B} />
              <text x={40 + i * 80} y={55} fontSize={12} textAnchor="middle" fill="currentColor" className="mono">{v}</text>
              <text x={70 + i * 80} y={55} fontSize={10} textAnchor="middle" fill={MUTED} className="mono">•</text>
              {i < 3 && <line x1={80 + i * 80} y1={50} x2={100 + i * 80} y2={50} stroke={A} strokeWidth={2} markerEnd="url(#arr3)" className="cxx-flow" />}
            </g>
          ))}
          <text x={280} y={55} fontSize={11} fill={MUTED} className="mono">→ NULL</text>
          <defs>
            <marker id="arr3" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={A} />
            </marker>
          </defs>
        </svg>
      );
    case "compilation-pipeline":
      return (
        <svg viewBox="0 0 340 120" className="w-full">
          {["source.c", "prepro.i", "asm.s", "obj.o", "a.out"].map((f, i) => (
            <g key={f} className="cxx-drop" style={{ animationDelay: `${i * 0.2}s` }}>
              <rect x={10 + i * 66} y={40} width={60} height={40} rx={6}
                fill={`color-mix(in oklab, ${[A, B, T, P, K][i]} 22%, transparent)`}
                stroke={[A, B, T, P, K][i]} />
              <text x={40 + i * 66} y={65} fontSize={10} textAnchor="middle" fill="currentColor" className="mono">{f}</text>
              {i < 4 && <line x1={70 + i * 66} y1={60} x2={76 + i * 66} y2={60} stroke={MUTED} strokeWidth={2} markerEnd="url(#arr4)" className="cxx-flow" />}
            </g>
          ))}
          <defs>
            <marker id="arr4" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={MUTED} />
            </marker>
          </defs>
          <text x={40} y={100} fontSize={9} fill={MUTED} className="mono">preproc</text>
          <text x={106} y={100} fontSize={9} fill={MUTED} className="mono">compile</text>
          <text x={172} y={100} fontSize={9} fill={MUTED} className="mono">assemble</text>
          <text x={244} y={100} fontSize={9} fill={MUTED} className="mono">link</text>
        </svg>
      );
    case "threads":
      return (
        <svg viewBox="0 0 320 160" className="w-full">
          <rect x={130} y={10} width={60} height={30} rx={6} fill={`color-mix(in oklab, ${A} 22%, transparent)`} stroke={A} />
          <text x={160} y={30} fontSize={11} textAnchor="middle" fill="currentColor" className="mono">main</text>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <line x1={160} y1={40} x2={60 + i * 100} y2={80} stroke={[B, T, P][i]} className="cxx-flow" strokeWidth={1.5} />
              <rect x={20 + i * 100} y={80} width={80} height={60} rx={6}
                fill={`color-mix(in oklab, ${[B, T, P][i]} 22%, transparent)`} stroke={[B, T, P][i]} />
              <text x={60 + i * 100} y={105} fontSize={11} textAnchor="middle" fill="currentColor" className="mono">thread {i + 1}</text>
              <text x={60 + i * 100} y={125} fontSize={10} textAnchor="middle" fill={MUTED} className="mono">worker()</text>
              <circle cx={60 + i * 100} cy={135} r={3} fill={[B, T, P][i]} className="cxx-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
            </g>
          ))}
        </svg>
      );
    case "smart-pointer":
      return (
        <svg viewBox="0 0 340 160" className="w-full">
          <rect x={20} y={40} width={110} height={50} rx={6} fill={`color-mix(in oklab, ${A} 22%, transparent)`} stroke={A} />
          <text x={75} y={30} fontSize={10} fill={MUTED} textAnchor="middle" className="mono">shared_ptr&lt;T&gt;</text>
          <text x={75} y={62} fontSize={11} textAnchor="middle" fill="currentColor" className="mono">ptr, ctrl</text>
          <rect x={170} y={20} width={150} height={40} rx={6} fill={`color-mix(in oklab, ${T} 22%, transparent)`} stroke={T} />
          <text x={245} y={44} fontSize={11} textAnchor="middle" fill="currentColor" className="mono cxx-blink">control block · ref=2</text>
          <rect x={170} y={80} width={150} height={40} rx={6} fill={`color-mix(in oklab, ${B} 22%, transparent)`} stroke={B} />
          <text x={245} y={105} fontSize={11} textAnchor="middle" fill="currentColor" className="mono">T on heap</text>
          <line x1={130} y1={55} x2={170} y2={40} stroke={A} strokeWidth={2} markerEnd="url(#arr5)" className="cxx-flow" />
          <line x1={130} y1={70} x2={170} y2={100} stroke={A} strokeWidth={2} markerEnd="url(#arr5)" className="cxx-flow" />
          <defs>
            <marker id="arr5" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={A} />
            </marker>
          </defs>
        </svg>
      );
    case "move-vs-copy":
      return (
        <svg viewBox="0 0 320 160" className="w-full">
          <text x={80} y={20} fontSize={11} textAnchor="middle" fill={A} className="mono">COPY</text>
          <rect x={20} y={30} width={120} height={40} rx={6} fill={`color-mix(in oklab, ${A} 22%, transparent)`} stroke={A} />
          <text x={80} y={55} fontSize={11} textAnchor="middle" fill="currentColor" className="mono">src [1,2,3]</text>
          <rect x={20} y={90} width={120} height={40} rx={6} fill={`color-mix(in oklab, ${A} 22%, transparent)`} stroke={A} />
          <text x={80} y={115} fontSize={11} textAnchor="middle" fill="currentColor" className="mono">dst [1,2,3]</text>
          <text x={240} y={20} fontSize={11} textAnchor="middle" fill={T} className="mono">MOVE</text>
          <rect x={180} y={30} width={120} height={40} rx={6} fill={`color-mix(in oklab, ${MUTED} 15%, transparent)`} stroke={MUTED} strokeDasharray="3 3" />
          <text x={240} y={55} fontSize={11} textAnchor="middle" fill={MUTED} className="mono">src (empty)</text>
          <rect x={180} y={90} width={120} height={40} rx={6} fill={`color-mix(in oklab, ${T} 22%, transparent)`} stroke={T} />
          <text x={240} y={115} fontSize={11} textAnchor="middle" fill="currentColor" className="mono">dst [1,2,3]</text>
          <text x={160} y={148} fontSize={10} textAnchor="middle" fill={MUTED} className="mono">move steals the buffer — no allocation</text>
        </svg>
      );
  }
}