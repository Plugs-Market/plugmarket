
-- Create storage bucket for site banners
INSERT INTO storage.buckets (id, name, public) VALUES ('site-banners', 'site-banners', true);

-- Allow public read on site-banners
CREATE POLICY "Public read site-banners" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'site-banners');

-- Deny direct writes from client (uploads go through edge function with service_role)
CREATE POLICY "deny_insert_site_banners" ON storage.objects AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (bucket_id != 'site-banners');
CREATE POLICY "deny_update_site_banners" ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (bucket_id != 'site-banners') WITH CHECK (bucket_id != 'site-banners');
CREATE POLICY "deny_delete_site_banners" ON storage.objects AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (bucket_id != 'site-banners');
