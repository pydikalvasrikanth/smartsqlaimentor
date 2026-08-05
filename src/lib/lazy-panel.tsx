import { lazy, Suspense, type ComponentType } from "react";

/**
 * Wraps a heavy, conditionally-rendered panel in its own code-split chunk +
 * Suspense boundary, so it no longer ships with the route's first paint.
 * Props and types are preserved, so call sites stay unchanged.
 */
export function lazyPanel<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  fallback: React.ReactNode = null,
): ComponentType<P> {
  const Lazy = lazy(loader);
  return function LazyPanel(props: P) {
    return (
      <Suspense fallback={fallback}>
        <Lazy {...(props as any)} />
      </Suspense>
    );
  };
}

/** Neutral skeleton for panels that occupy visible layout space. */
export const PanelSkeleton = (
  <div className="rounded-xl border border-border bg-surface-1/60 p-6 animate-pulse">
    <div className="h-3 w-1/3 rounded bg-muted mb-3" />
    <div className="h-3 w-2/3 rounded bg-muted mb-2" />
    <div className="h-3 w-1/2 rounded bg-muted" />
  </div>
);
