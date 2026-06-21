import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const inputSchema = z.object({ feedbackId: z.string().uuid() });

const esc = (v: unknown) =>
  String(v ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const sendFeedbackEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return { ok: false, reason: "not_configured" };

    // Fetch the feedback row as the authenticated user (RLS enforces ownership).
    const { data: f, error } = await context.supabase
      .from("feedback")
      .select("*")
      .eq("id", data.feedbackId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error || !f) return { ok: false, reason: "not_found" };

    const rows: Array<[string, unknown]> = [
      ["Subject area", f.subject_area],
      ["Page", f.page_context],
      ["Overall rating", f.overall_rating],
      ["NPS", f.nps_score],
      ["AI quality", f.ai_quality_rating],
      ["Code correctness", f.code_correctness],
      ["Bug report", f.bug_report],
      ["Improvement", f.improvement_suggestion],
      ["Contact email", f.contact_email],
      ["User ID", f.user_id],
      ["Submitted at", f.created_at],
    ];

    const html = `
      <h2 style="font-family:system-ui,sans-serif">New feedback submitted</h2>
      <table style="font-family:system-ui,sans-serif;border-collapse:collapse">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:6px 12px;border:1px solid #eee;font-weight:600">${esc(k)}</td><td style="padding:6px 12px;border:1px solid #eee">${esc(v)}</td></tr>`,
          )
          .join("")}
      </table>
    `;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SmartSQL Feedback <onboarding@resend.dev>",
        to: ["pydikalvasrikanth@gmail.com"],
        subject: `New feedback: ${f.subject_area ?? "general"}`,
        html,
        reply_to: f.contact_email || undefined,
      }),
    });

    if (!resp.ok) return { ok: false, reason: `resend_${resp.status}` };
    return { ok: true };
  });