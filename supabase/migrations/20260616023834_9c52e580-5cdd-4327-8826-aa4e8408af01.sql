GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_sessions TO authenticated;
GRANT ALL ON public.question_sessions TO service_role;

CREATE POLICY "question_sessions_own"
ON public.question_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);