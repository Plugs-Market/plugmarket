
CREATE TABLE public.site_settings (
  id integer NOT NULL DEFAULT 1 PRIMARY KEY,
  site_title text NOT NULL DEFAULT 'PLUGS MARKET',
  site_slogan text NOT NULL DEFAULT 'DEMO TESTING APP',
  banner_url text DEFAULT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "deny_write_site_settings" ON public.site_settings FOR INSERT TO anon, authenticated WITH CHECK (false) ;
CREATE POLICY "deny_update_site_settings" ON public.site_settings FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_delete_site_settings" ON public.site_settings FOR DELETE TO anon, authenticated USING (false);

INSERT INTO public.site_settings (id) VALUES (1);
