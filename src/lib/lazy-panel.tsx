import { lazy, Suspense, type ComponentType } from "react";

/**
 * Wraps a heavy, conditionally-rendered panel in its own code-split chunk +
 * Suspense boundary, so it no longer ships with the route's first paint.
 * Props and types are preserved, so call sites stay unchanged.
 */
export function lazyPanel<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  fallback: React.ReactNode = null,
): T {
  const Lazy = lazy(loader);
  function LazyPanel(props: any) {
    return (
      <Suspense fallback={fallback}>
        <Lazy {...props} />
      </Suspense>
    );
  }
  return LazyPanel as unknown as T;
}

/** Neutral skeleton for panels that occupy visible layout space. */
export const PanelSkeleton = (
  <div className="rounded-xl border border-border bg-surface-1/60 p-6 animate-pulse">
    <div className="h-3 w-1/3 rounded bg-muted mb-3" />
    <div className="h-3 w-2/3 rounded bg-muted mb-2" />
    <div className="h-3 w-1/2 rounded bg-muted" />
  </div>
);
