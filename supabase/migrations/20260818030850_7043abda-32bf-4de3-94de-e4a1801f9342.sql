CREATE TABLE IF NOT EXISTS public.ai_cache (
  cache_key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS ai_cache_expires_at_idx ON public.ai_cache (expires_at);

GRANT ALL ON public.ai_cache TO service_role;

ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- No policies: only the service role (server-side code) may read/write this cache.

CREATE OR REPLACE FUNCTION public.ai_cache_get(_key text)
RETURNS jsonb
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.ai_cache WHERE expires_at < now() - interval '1 hour';
  SELECT value FROM public.ai_cache WHERE cache_key = _key AND expires_at > now();
$$;

CREATE OR REPLACE FUNCTION public.ai_cache_put(_key text, _value jsonb, _ttl_seconds integer)
RETURNS void
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.ai_cache (cache_key, value, expires_at)
  VALUES (_key, _value, now() + make_interval(secs => greatest(_ttl_seconds, 30)))
  ON CONFLICT (cache_key) DO UPDATE
    SET value = excluded.value,
        created_at = now(),
        expires_at = excluded.expires_at;
$$;

REVOKE ALL ON FUNCTION public.ai_cache_get(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ai_cache_put(text, jsonb, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_cache_get(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ai_cache_put(text, jsonb, integer) TO service_role;