import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { PlainSqlEditor } from "./PlainSqlEditor";

const MonacoSqlEditor = lazy(() => import("./MonacoSqlEditor"));

interface Props {
  value: string;
  onChange: (v: string) => void;
  height?: string;
}

/**
 * Progressive SQL editor.
 *
 * First paint is always the lightweight Prism editor, so the user can start
 * typing immediately and no Monaco code is in the page's initial bundle. In
 * the background we probe the Monaco CDN loader; only when it resolves do we
 * upgrade to the full IDE. If the CDN is blocked, slow, or offline, the Prism
 * editor simply stays — the user never sees "Loading editor…".
 */
export function SqlEditor({ value, onChange, height = "260px" }: Props) {
  const [useMonaco, setUseMonaco] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      // Defer the probe so it never competes with first paint.
      import("@monaco-editor/react")
        .then(({ loader }) => loader.init())
        .then(() => {
          if (!cancelled) setUseMonaco(true);
        })
        .catch(() => {
          /* keep the Prism editor */
        });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (!useMonaco) {
    return <PlainSqlEditor value={value} onChange={onChange} height={height} />;
  }

  return (
    <div
      className="rounded-md border border-border overflow-hidden bg-[#1d2238]"
      style={{ touchAction: "pan-y" }}
    >
      <Suspense fallback={<PlainSqlEditor value={value} onChange={onChange} height={height} />}>
        <MonacoSqlEditor
          value={value}
          onChange={onChange}
          height={height}
          onMount={() => {
            mountedRef.current = true;
          }}
        />
      </Suspense>
    </div>
  );
}
