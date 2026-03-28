-- Drop all permissive-false policies and replace with nothing (RLS enabled + no policies = deny-all)
DROP POLICY IF EXISTS "No direct access to app_users" ON public.app_users;
DROP POLICY IF EXISTS "No direct access to session_tokens" ON public.session_tokens;
DROP POLICY IF EXISTS "No direct access to rate_limits" ON public.rate_limits;
DROP POLICY IF EXISTS "No direct access to telegram_config" ON public.telegram_config;
DROP POLICY IF EXISTS "No direct access to telegram_captcha" ON public.telegram_captcha;
DROP POLICY IF EXISTS "No direct access to telegram_interactions" ON public.telegram_interactions;
DROP POLICY IF EXISTS "No direct access to telegram_welcome" ON public.telegram_welcome;
DROP POLICY IF EXISTS "No direct access to rate_limits" ON public.rate_limits;