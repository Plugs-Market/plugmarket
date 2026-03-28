
-- Fix faq_items: drop permissive deny policies and recreate as restrictive
DROP POLICY IF EXISTS "deny_delete_faq_items" ON faq_items;
DROP POLICY IF EXISTS "deny_update_faq_items" ON faq_items;
DROP POLICY IF EXISTS "deny_write_faq_items" ON faq_items;

CREATE POLICY "deny_delete_faq_items" ON faq_items AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);
CREATE POLICY "deny_update_faq_items" ON faq_items AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_write_faq_items" ON faq_items AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);

-- Fix site_settings: same issue
DROP POLICY IF EXISTS "deny_delete_site_settings" ON site_settings;
DROP POLICY IF EXISTS "deny_update_site_settings" ON site_settings;
DROP POLICY IF EXISTS "deny_write_site_settings" ON site_settings;

CREATE POLICY "deny_delete_site_settings" ON site_settings AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);
CREATE POLICY "deny_update_site_settings" ON site_settings AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_write_site_settings" ON site_settings AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);

-- Fix product_reviews: same issue
DROP POLICY IF EXISTS "deny_delete_product_reviews" ON product_reviews;
DROP POLICY IF EXISTS "deny_update_product_reviews" ON product_reviews;
DROP POLICY IF EXISTS "deny_write_product_reviews" ON product_reviews;

CREATE POLICY "deny_delete_product_reviews" ON product_reviews AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);
CREATE POLICY "deny_update_product_reviews" ON product_reviews AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_write_product_reviews" ON product_reviews AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
