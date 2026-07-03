import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// State travels as a JSON string over the RPC boundary to keep the shape
// serializable; callers JSON.parse/stringify on the edges.

export const loadSessionState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string }) => {
    if (!input || typeof input.key !== "string" || !input.key)
      throw new Error("key required");
    return { key: input.key.slice(0, 128) };
  })
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("session_state")
      .select("state, updated_at")
      .eq("user_id", context.userId)
      .eq("section_key", data.key)
      .maybeSingle();
    if (error) throw error;
    if (!row) return null;
    return {
      state: JSON.stringify(row.state ?? null),
      updatedAt: row.updated_at as string,
    };
  });

export const saveSessionState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string; state: string }) => {
    if (!input || typeof input.key !== "string" || !input.key)
      throw new Error("key required");
    if (typeof input.state !== "string") throw new Error("state must be JSON string");
    return { key: input.key.slice(0, 128), state: input.state };
  })
  .handler(async ({ data, context }) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data.state);
    } catch {
      throw new Error("state must be valid JSON");
    }
    const { error } = await context.supabase.from("session_state").upsert(
      {
        user_id: context.userId,
        section_key: data.key,
        state: parsed as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,section_key" },
    );
    if (error) throw error;
    return { ok: true };
  });

export const clearSessionState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string }) => {
    if (!input || typeof input.key !== "string" || !input.key)
      throw new Error("key required");
    return { key: input.key.slice(0, 128) };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("session_state")
      .delete()
      .eq("user_id", context.userId)
      .eq("section_key", data.key);
    if (error) throw error;
    return { ok: true };
  });