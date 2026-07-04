import { useEffect, useRef, useState, type ReactNode } from "react";

const STORAGE_KEY = "sql:leftPanelWidth";
const MIN = 260;
const MAX = 720;
const DEFAULT = 360;

/**
 * Shared hook that returns the current left-panel width (in px), a setter,
 * and a boolean for whether we're at desktop breakpoint. Width is persisted
 * to localStorage so it survives reloads across every SQL layout.
 */
export function useLeftPanelWidth() {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT;
    const n = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(n) && n >= MIN && n <= MAX ? n : DEFAULT;
  });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setIsDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(width));
    } catch {
      /* ignore */
    }
  }, [width]);

  return { width, setWidth, isDesktop, MIN, MAX };
}

/**
 * A vertical drag handle that resizes the shared left-panel width. Renders
 * as a thin strip on desktop, hidden on mobile. Placed between the aside
 * and the main section in a flex-row layout.
 */
export function LeftPanelResizeHandle() {
  const { setWidth } = useLeftPanelWidth();
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(DEFAULT);

  useEffect(() => {
    function move(e: MouseEvent | TouchEvent) {
      if (!dragging.current) return;
      const x =
        "touches" in e && e.touches[0]
          ? e.touches[0].clientX
          : (e as MouseEvent).clientX;
      const next = Math.max(MIN, Math.min(MAX, startW.current + (x - startX.current)));
      setWidth(next);
    }
    function up() {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move as EventListener, { passive: true });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move as EventListener);
      window.removeEventListener("touchend", up);
    };
  }, [setWidth]);

  function begin(clientX: number) {
    // Read the current width from storage so multiple handles stay in sync.
    const n = Number(window.localStorage.getItem(STORAGE_KEY));
    startW.current = Number.isFinite(n) && n >= MIN && n <= MAX ? n : DEFAULT;
    dragging.current = true;
    startX.current = clientX;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize schema panel"
      onMouseDown={(e) => begin(e.clientX)}
      onTouchStart={(e) => begin(e.touches[0].clientX)}
      title="Drag to resize"
      className="hidden lg:flex w-2 -mx-1 cursor-col-resize items-center justify-center group self-stretch"
    >
      <div className="h-16 w-0.5 rounded bg-border group-hover:bg-primary transition-colors" />
    </div>
  );
}

/**
 * Two-column layout with a draggable divider that resizes the left column.
 * On mobile (< lg) the columns stack and the drag handle is hidden.
 * The chosen width is persisted to localStorage so it survives reloads.
 */
export function ResizableSplit({
  left,
  right,
  asideClass = "",
  sectionClass = "",
}: {
  left: ReactNode;
  right: ReactNode;
  /** Extra classes for the left aside (e.g. sticky positioning). */
  asideClass?: string;
  /** Extra classes for the right section. */
  sectionClass?: string;
}) {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT;
    const n = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(n) && n >= MIN && n <= MAX ? n : DEFAULT;
  });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setIsDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(width);

  useEffect(() => {
    function move(e: MouseEvent | TouchEvent) {
      if (!dragging.current) return;
      const x =
        "touches" in e && e.touches[0]
          ? e.touches[0].clientX
          : (e as MouseEvent).clientX;
      const next = Math.max(MIN, Math.min(MAX, startW.current + (x - startX.current)));
      setWidth(next);
    }
    function up() {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      try {
        window.localStorage.setItem(STORAGE_KEY, String(width));
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move as EventListener, { passive: true });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move as EventListener);
      window.removeEventListener("touchend", up);
    };
  }, [width]);

  function begin(clientX: number) {
    dragging.current = true;
    startX.current = clientX;
    startW.current = width;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-w-0">
      <aside
        className={`w-full lg:shrink-0 min-w-0 ${asideClass}`}
        style={isDesktop ? { width } : undefined}
      >
        {left}
      </aside>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize schema panel"
        onMouseDown={(e) => begin(e.clientX)}
        onTouchStart={(e) => begin(e.touches[0].clientX)}
        title="Drag to resize"
        className="hidden lg:flex w-2 -mx-1 cursor-col-resize items-center justify-center group"
      >
        <div className="h-16 w-0.5 rounded bg-border group-hover:bg-primary transition-colors" />
      </div>
      <section className={`flex-1 min-w-0 space-y-4 ${sectionClass}`}>{right}</section>
    </div>
  );
}