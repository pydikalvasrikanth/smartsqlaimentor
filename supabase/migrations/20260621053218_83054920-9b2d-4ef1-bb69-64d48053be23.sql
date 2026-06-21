DROP TRIGGER IF EXISTS feedback_email_notify ON public.feedback;
DROP FUNCTION IF EXISTS public.notify_feedback_email();
DROP EXTENSION IF EXISTS pg_net;