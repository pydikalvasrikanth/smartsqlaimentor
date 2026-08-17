CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id uuid NOT NULL,
  bucket text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, bucket)
);

GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx ON public.rate_limits (window_start);

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  _user_id uuid,
  _bucket text,
  _max integer,
  _window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
  _window_start timestamptz;
  _win interval := make_interval(secs => _window_seconds);
BEGIN
  INSERT INTO public.rate_limits AS rl (user_id, bucket, window_start, count, updated_at)
  VALUES (_user_id, _bucket, now(), 1, now())
  ON CONFLICT (user_id, bucket) DO UPDATE
    SET count = CASE WHEN rl.window_start < now() - _win THEN 1 ELSE rl.count + 1 END,
        window_start = CASE WHEN rl.window_start < now() - _win THEN now() ELSE rl.window_start END,
        updated_at = now()
  RETURNING rl.count, rl.window_start INTO _count, _window_start;

  RETURN jsonb_build_object(
    'allowed', _count <= _max,
    'count', _count,
    'retry_after', GREATEST(1, CEIL(EXTRACT(EPOCH FROM ((_window_start + _win) - now())))::int)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(uuid, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(uuid, text, integer, integer) TO service_role;