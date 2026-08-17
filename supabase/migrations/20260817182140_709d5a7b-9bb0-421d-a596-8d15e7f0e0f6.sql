REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(uuid, text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(uuid, text, integer, integer) FROM authenticated;