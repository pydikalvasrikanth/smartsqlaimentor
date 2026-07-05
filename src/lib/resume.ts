import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  loadSessionState,
  saveSessionState,
  clearSessionState,
} from "@/lib/resume.functions";

const LOCAL_PREFIX = "sqlmentor:resume:";
const CURRENT_VERSION = 1;

type StoredEnvelope<T> = { v: number; t: number; s: T };

function readLocal<T>(key: string): { state: T; updatedAt: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_PREFIX + key);
    if (!raw) return null;
    const env = JSON.parse(raw) as StoredEnvelope<T>;
    if (!env || env.v !== CURRENT_VERSION) return null;
    return { state: env.s, updatedAt: env.t };
  } catch {
    return null;
  }
}

function writeLocal<T>(key: string, state: T) {
  if (typeof window === "undefined") return;
  try {
    const env: StoredEnvelope<T> = { v: CURRENT_VERSION, t: Date.now(), s: state };
    window.localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(env));
  } catch {
    // storage full / disabled — silent
  }
}

function removeLocal(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOCAL_PREFIX + key);
  } catch {
    // ignore
  }
}

export interface UseResumableStateOptions {
  /** debounce ms for saves; default 800 */
  debounceMs?: number;
  /** if false, saved snapshot older than staleAfterMs is ignored (no resume prompt). Default 14 days */
  staleAfterMs?: number;
  /** compare fn to decide if state is worth persisting (skip empty defaults) */
  isEmpty?: (state: unknown) => boolean;
}

export interface ResumableSnapshot<T> {
  state: T;
  updatedAt: number;
  source: "local" | "cloud";
}

/**
 * Persistence-aware state. Loads local + cloud snapshots on mount, exposes the
 * newest as `savedSnapshot` so the caller can prompt the user to resume. Writes
 * are debounced to local + cloud. Call `hydrate(snapshot)` to adopt saved
 * state, or `clear()` to wipe both stores and continue with the initial state.
 */
export function useResumableState<T>(
  key: string,
  initial: T,
  options: UseResumableStateOptions = {},
) {
  const debounceMs = options.debounceMs ?? 800;
  const staleAfterMs = options.staleAfterMs ?? 14 * 24 * 60 * 60 * 1000;
  const isEmpty = options.isEmpty;

  const { user } = useAuth();
  const [state, setStateInternal] = useState<T>(initial);
  const [savedSnapshot, setSavedSnapshot] = useState<ResumableSnapshot<T> | null>(null);
  const [decisionMade, setDecisionMade] = useState(false);
  const [ready, setReady] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const decidedRef = useRef(false);
  decidedRef.current = decisionMade;

  // Initial load: local + cloud (whichever is newer wins for the prompt)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = readLocal<T>(key);
      let best: ResumableSnapshot<T> | null = null;
      if (local && Date.now() - local.updatedAt < staleAfterMs) {
        best = { state: local.state, updatedAt: local.updatedAt, source: "local" };
      }
      if (user) {
        try {
          const remote = await loadSessionState({ data: { key } });
          if (remote) {
            const remoteState = JSON.parse(remote.state) as T | null;
            const remoteAt = new Date(remote.updatedAt).getTime();
            if (
              remoteState !== null &&
              Date.now() - remoteAt < staleAfterMs &&
              (!best || remoteAt > best.updatedAt)
            ) {
              best = { state: remoteState, updatedAt: remoteAt, source: "cloud" };
            }
          }
        } catch {
          // network / auth issue — fall back to local
        }
      }
      if (cancelled) return;
      setSavedSnapshot(best);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, user?.id]);

  const flush = useCallback(
    (next: T) => {
      if (isEmpty && isEmpty(next)) {
        removeLocal(key);
        return;
      }
      writeLocal(key, next);
      if (user) {
        // Fire and forget; ignore failures (local copy still exists).
        saveSessionState({ data: { key, state: JSON.stringify(next) } }).catch(() => {});
      }
    },
    [key, user, isEmpty],
  );

  // Autosave checkpoint on every state change AFTER the user has made a
  // resume/dismiss decision (or when no saved snapshot existed at all).
  //   • local write: SYNCHRONOUS every change → refresh never loses keystrokes
  //   • cloud write: debounced ~800ms → avoids hammering the network while typing
  useEffect(() => {
    if (!ready) return;
    if (savedSnapshot && !decisionMade) return; // waiting for user's choice
    const next = stateRef.current;
    if (isEmpty && isEmpty(next)) {
      removeLocal(key);
    } else {
      writeLocal(key, next); // immediate local checkpoint
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      // Cloud sync (local already written above).
      if (isEmpty && isEmpty(stateRef.current)) return;
      if (user) {
        saveSessionState({
          data: { key, state: JSON.stringify(stateRef.current) },
        }).catch(() => {});
      }
    }, debounceMs);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, ready, decisionMade, savedSnapshot, debounceMs, key, user, isEmpty]);

  // Flush on unload / tab hide so mobile Safari + hard refresh never lose edits.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      if (!ready) return;
      if (savedSnapshot && !decisionMade) return;
      const s = stateRef.current;
      if (isEmpty && isEmpty(s)) removeLocal(key);
      else writeLocal(key, s);
    };
    const visHandler = () => {
      if (document.visibilityState === "hidden") handler();
    };
    window.addEventListener("beforeunload", handler);
    window.addEventListener("pagehide", handler);
    document.addEventListener("visibilitychange", visHandler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      window.removeEventListener("pagehide", handler);
      document.removeEventListener("visibilitychange", visHandler);
    };
  }, [key, ready, decisionMade, savedSnapshot, isEmpty]);

  // Suppress unused-var warning for the older debounced flush helper — kept
  // for API compatibility if callers want to force a flush later.
  void flush;

  const setState = useCallback((updater: T | ((prev: T) => T)) => {
    setStateInternal((prev) => {
      const next =
        typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
      return next;
    });
  }, []);

  const hydrate = useCallback((snap: ResumableSnapshot<T> | null) => {
    if (snap) setStateInternal(snap.state);
    setDecisionMade(true);
    setSavedSnapshot(null);
  }, []);

  const dismiss = useCallback(() => {
    // "Start fresh": drop saved snapshot from both stores.
    removeLocal(key);
    if (user) clearSessionState({ data: { key } }).catch(() => {});
    setSavedSnapshot(null);
    setDecisionMade(true);
  }, [key, user]);

  const clear = useCallback(() => {
    removeLocal(key);
    if (user) clearSessionState({ data: { key } }).catch(() => {});
  }, [key, user]);

  return useMemo(
    () => ({
      state,
      setState,
      ready,
      savedSnapshot,
      hydrate,
      dismiss,
      clear,
      hasResumable: !!savedSnapshot && !decisionMade,
    }),
    [state, setState, ready, savedSnapshot, hydrate, dismiss, clear, decisionMade],
  );
}

export function formatAgo(ms: number): string {
  const diff = Math.max(0, Date.now() - ms);
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}