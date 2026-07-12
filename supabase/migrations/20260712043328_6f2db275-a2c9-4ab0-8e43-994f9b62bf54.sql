CREATE INDEX IF NOT EXISTS attempts_user_subject_correct_recent_idx
  ON public.attempts (user_id, subject, is_correct, created_at DESC);
CREATE INDEX IF NOT EXISTS attempts_user_topic_time_idx
  ON public.attempts (user_id, topic_slug, created_at);
ANALYZE public.attempts;