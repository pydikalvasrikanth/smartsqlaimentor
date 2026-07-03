## Goal

Every section (SQL Practice, Python, GCP, Interview, Tutorial, Chat, Engine) restores exactly where the user left off — question index, typed code, filters, tab, messages — after they close the tab, refresh, or come back on another device.

## UX

On mount of a section, if a saved state exists and is newer than 60s of activity ago, a slim banner appears:

```text
┌───────────────────────────────────────────────────────────┐
│  Continue where you left off? (2h ago · Q7 of 20)         │
│                                    [ Resume ]  [ Start fresh ] │
└───────────────────────────────────────────────────────────┘
```

- Resume: hydrates state, dismisses banner.
- Start fresh: wipes saved state for that section, dismisses banner.
- No saved state → no banner, normal fresh start.

Nothing auto-resumes silently (matches "Ask before resuming").

## Storage model

Local-first, cloud sync in background when signed in.

- **localStorage** key: `sqlmentor:resume:<sectionKey>` → `{ state, updatedAt, version }`. Writes are debounced ~500ms.
- **Cloud table** `session_state` scoped by `user_id`:
  ```text
  user_id uuid, section_key text, state jsonb, updated_at timestamptz
  PK (user_id, section_key)
  ```
  RLS: user can only read/write their own rows. Grants for `authenticated`.
- On sign-in, the newer of {local, cloud} wins per section and both sides are reconciled.
- Signed-out users still get local-only resume.

## Sections + what gets saved

| Section key | Route | Persisted slice |
|---|---|---|
| `sql-today` | `/practice` (today tab) | current question id, typed SQL, elapsed |
| `sql-topicwise` | `/practice` (topicwise) | topic filter, difficulty, current qid, typed SQL |
| `sql-targeted` | `/practice` (targeted) | selected topics, current qid, typed SQL |
| `topic:<slug>` | `/topic/$slug` | current qid, typed SQL |
| `python:<tab>` | `/python` | active tab, qid per tab, code buffer per tab |
| `gcp` | `/gcp` | current qid, answer draft |
| `interview` | `/interview` | pre-interview setup, phase, full transcript, next-question index, voice |
| `tutorial` | `/tutorial` | last lesson slug, scroll anchor |
| `chat` | `/chat` | message array (already local, formalize under same hook) |
| `engine` | `/engine` | last query/prompt |

## Technical design

**New shared module** `src/lib/resume.ts`
- `useResumableState<T>(key, initial, { debounceMs = 500 })` — returns `{ state, setState, savedSnapshot, clear, hasResumable }`. Reads local on mount, subscribes cloud fetch (server fn) when a user is present, exposes `savedSnapshot` (unhydrated) so the caller can decide to show the prompt or hydrate directly.
- `<ResumePrompt onResume onDismiss savedAt meta />` — small dismissible banner using existing shadcn `Alert`/`Button` styling; sits at top of section body.

**New server functions** `src/lib/resume.functions.ts`
- `loadSessionState({ key })` — `requireSupabaseAuth`, returns `{ state, updatedAt } | null`.
- `saveSessionState({ key, state })` — `requireSupabaseAuth`, upserts.
- `clearSessionState({ key })` — deletes row.

Client debounces `saveSessionState` (2s) so we don't hammer the network while typing.

**Migration** creates `public.session_state` with the correct GRANTs, RLS, and updated_at trigger via existing `touch_updated_at()`.

**Route wiring** — each route adopts a small `useResumableState` at the top, replaces the local `useState` for the persisted slice, and renders `<ResumePrompt />` when `hasResumable` is true and the user hasn't chosen yet. Existing state/behavior stays; the hook is drop-in.

**Interview specifics** — because the transcript matters, we save after every completed turn (not on every token). Resuming replays the transcript into the UI and continues from the next question index. Live TTS/audio state is not persisted (avatar just starts idle).

**Safety**
- JSON size cap 200KB per row; larger states (Chat) trimmed to last N messages.
- `version` field lets us bump the schema and ignore stale local blobs.
- Server functions authorize via `requireSupabaseAuth`; no admin client.

## Scope of edits

- New files: `src/lib/resume.ts`, `src/lib/resume.functions.ts`, `src/components/ResumePrompt.tsx`, one migration.
- Edits (small, targeted, add hook + banner only): `practice.tsx`, `python.tsx`, `gcp.tsx`, `interview.tsx`, `topic.$slug.tsx`, `tutorial.tsx`, `chat.tsx`, `engine.tsx`.

## Out of scope

- Multi-tab live sync (last-writer-wins is fine).
- Undo history / snapshots beyond the latest.
- Persisting ephemeral UI (open modals, hover states, audio playback position).
