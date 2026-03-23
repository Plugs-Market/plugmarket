
CREATE TABLE public.session_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.session_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to session_tokens" ON public.session_tokens
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE INDEX idx_session_tokens_token_hash ON public.session_tokens(token_hash);
CREATE INDEX idx_session_tokens_user_id ON public.session_tokens(user_id);

CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to rate_limits" ON public.rate_limits
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE INDEX idx_rate_limits_key ON public.rate_limits(key);
