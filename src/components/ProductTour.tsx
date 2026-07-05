import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

export interface TourStep {
  /** data-tour attribute value to anchor the popover to */
  target?: string;
  title: string;
  body: string;
  /** Preferred placement; auto-flips if off screen. */
  placement?: "top" | "bottom" | "left" | "right";
}

interface Props {
  storageKey: string;
  steps: TourStep[];
  /** Force-open (e.g. from a "Take the tour" button). */
  open?: boolean;
  onClose?: () => void;
}

function hasSeen(key: string) {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return true;
  }
}
function markSeen(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

export function ProductTour({ storageKey, steps, open, onClose }: Props) {
  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Auto-open on first visit
  useEffect(() => {
    if (open) {
      setActive(true);
      setIdx(0);
      return;
    }
    if (!hasSeen(storageKey)) {
      const t = setTimeout(() => {
        setActive(true);
        setIdx(0);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [open, storageKey]);

  const step = active ? steps[idx] : null;

  useLayoutEffect(() => {
    if (!step) return;
    function measure() {
      if (!step?.target) {
        setRect(null);
        return;
      }
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      // Wait for scroll to settle before reading rect.
      requestAnimationFrame(() => setRect(el.getBoundingClientRect()));
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);

  if (!active || !step) return null;

  function close() {
    setActive(false);
    markSeen(storageKey);
    onClose?.();
  }
  function prev() {
    setIdx((i) => Math.max(0, i - 1));
  }
  function next() {
    if (idx === steps.length - 1) close();
    else setIdx((i) => i + 1);
  }

  // Positioning of the popover card
  const pad = 12;
  let cardStyle: React.CSSProperties = {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 10001,
    maxWidth: 380,
    width: "min(92vw, 380px)",
  };
  const spotStyle: React.CSSProperties | null = rect
    ? {
        position: "fixed",
        top: rect.top - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
        borderRadius: 12,
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
        border: "2px solid hsl(var(--primary))",
        pointerEvents: "none",
        zIndex: 10000,
        transition: "all 220ms ease",
      }
    : null;
  if (rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardW = Math.min(380, vw - 24);
    const cardH = 200; // approx
    const placement = step.placement ?? "bottom";
    let top: number;
    let left: number;
    if (placement === "bottom") {
      top = rect.bottom + pad;
      left = rect.left + rect.width / 2 - cardW / 2;
    } else if (placement === "top") {
      top = rect.top - cardH - pad;
      left = rect.left + rect.width / 2 - cardW / 2;
    } else if (placement === "left") {
      top = rect.top + rect.height / 2 - cardH / 2;
      left = rect.left - cardW - pad;
    } else {
      top = rect.top + rect.height / 2 - cardH / 2;
      left = rect.right + pad;
    }
    // Clamp to viewport
    if (top + cardH > vh - 12) top = Math.max(12, vh - cardH - 12);
    if (top < 12) top = 12;
    if (left + cardW > vw - 12) left = Math.max(12, vw - cardW - 12);
    if (left < 12) left = 12;
    cardStyle = {
      position: "fixed",
      top,
      left,
      width: cardW,
      zIndex: 10001,
    };
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Full backdrop when no target */}
      {!rect && (
        <div
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 9999,
          }}
        />
      )}
      {spotStyle && <div style={spotStyle} />}
      <div
        style={cardStyle}
        className="rounded-xl border border-primary/40 bg-surface-1 shadow-2xl p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">{step.title}</h3>
            <p className="text-[10px] font-mono text-muted-foreground">
              Step {idx + 1} of {steps.length}
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Skip tour"
            className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {step.body}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={close}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Skip
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={prev}
              disabled={idx === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-border text-xs hover:bg-accent disabled:opacity-40"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
            <button
              onClick={next}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
            >
              {idx === steps.length - 1 ? "Got it" : "Next"}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}