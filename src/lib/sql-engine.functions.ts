import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Server-only implementation (prompts, tool schemas, payload validation,
// gateway call) lives in sql-engine.server.ts so it can never reach the client
// bundle and so the Worker's server-fn split can't drop sibling declarations.
import { InputSchema, callEngineCommand } from "./sql-engine.server";

export const runSqlEngine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => callEngineCommand(data.command, data.payload));
