
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_feedback_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://smartsqlaimentor.lovable.app/api/public/hooks/feedback-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYmlwZWtpYnVvdXl6Y25mZGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjI0NTgsImV4cCI6MjA5NjkzODQ1OH0.JTSVdxkAMBeIM9fENtud7P7UoisxggKz6Lkg38K-yCQ'
    ),
    body := jsonb_build_object('record', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feedback_email_notify ON public.feedback;
CREATE TRIGGER feedback_email_notify
AFTER INSERT ON public.feedback
FOR EACH ROW EXECUTE FUNCTION public.notify_feedback_email();
