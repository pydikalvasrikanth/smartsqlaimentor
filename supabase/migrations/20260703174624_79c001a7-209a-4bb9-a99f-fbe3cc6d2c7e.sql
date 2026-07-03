CREATE TABLE public.session_state (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, section_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_state TO authenticated;
GRANT ALL ON public.session_state TO service_role;
ALTER TABLE public.session_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own session state read" ON public.session_state FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own session state write" ON public.session_state FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own session state update" ON public.session_state FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own session state delete" ON public.session_state FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER session_state_touch_updated BEFORE UPDATE ON public.session_state FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();