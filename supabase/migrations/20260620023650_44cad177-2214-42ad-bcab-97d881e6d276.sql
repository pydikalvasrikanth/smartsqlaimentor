-- question_sessions is intentionally server-only (accessed via service role only).
-- Add an explicit deny-all policy so the linter's "RLS enabled, no policy" check passes,
-- while keeping the table inaccessible to anon/authenticated through the Data API.
CREATE POLICY "question_sessions_deny_all"
ON public.question_sessions
AS PERMISSIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);