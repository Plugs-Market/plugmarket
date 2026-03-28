-- Add RESTRICTIVE deny-all policies on all sensitive tables
-- RESTRICTIVE policies use AND logic, so they can never be bypassed by permissive policies

CREATE POLICY "deny_all_app_users" ON public.app_users AS RESTRICTIVE
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_all_session_tokens" ON public.session_tokens AS RESTRICTIVE
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_all_rate_limits" ON public.rate_limits AS RESTRICTIVE
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_all_telegram_config" ON public.telegram_config AS RESTRICTIVE
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_all_telegram_captcha" ON public.telegram_captcha AS RESTRICTIVE
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_all_telegram_interactions" ON public.telegram_interactions AS RESTRICTIVE
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "deny_all_telegram_welcome" ON public.telegram_welcome AS RESTRICTIVE
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);