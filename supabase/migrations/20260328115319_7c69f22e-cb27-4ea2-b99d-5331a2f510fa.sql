-- Drop existing permissive write-denial policies on public content tables
-- and replace with RESTRICTIVE versions

-- categories
DROP POLICY IF EXISTS "No direct write categories" ON public.categories;
DROP POLICY IF EXISTS "No direct update categories" ON public.categories;
DROP POLICY IF EXISTS "No direct delete categories" ON public.categories;
CREATE POLICY "deny_write_categories" ON public.categories AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "deny_update_categories" ON public.categories AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_delete_categories" ON public.categories AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);

-- subcategories
DROP POLICY IF EXISTS "No direct write subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "No direct update subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "No direct delete subcategories" ON public.subcategories;
CREATE POLICY "deny_write_subcategories" ON public.subcategories AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "deny_update_subcategories" ON public.subcategories AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_delete_subcategories" ON public.subcategories AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);

-- farms
DROP POLICY IF EXISTS "No direct write farms" ON public.farms;
DROP POLICY IF EXISTS "No direct update farms" ON public.farms;
DROP POLICY IF EXISTS "No direct delete farms" ON public.farms;
CREATE POLICY "deny_write_farms" ON public.farms AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "deny_update_farms" ON public.farms AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_delete_farms" ON public.farms AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);

-- products
DROP POLICY IF EXISTS "No direct write products" ON public.products;
DROP POLICY IF EXISTS "No direct update products" ON public.products;
DROP POLICY IF EXISTS "No direct delete products" ON public.products;
CREATE POLICY "deny_write_products" ON public.products AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "deny_update_products" ON public.products AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_delete_products" ON public.products AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);

-- product_categories
DROP POLICY IF EXISTS "No direct write product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "No direct update product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "No direct delete product_categories" ON public.product_categories;
CREATE POLICY "deny_write_product_categories" ON public.product_categories AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "deny_update_product_categories" ON public.product_categories AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_delete_product_categories" ON public.product_categories AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);

-- product_subcategories
DROP POLICY IF EXISTS "No direct write product_subcategories" ON public.product_subcategories;
DROP POLICY IF EXISTS "No direct update product_subcategories" ON public.product_subcategories;
DROP POLICY IF EXISTS "No direct delete product_subcategories" ON public.product_subcategories;
CREATE POLICY "deny_write_product_subcategories" ON public.product_subcategories AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "deny_update_product_subcategories" ON public.product_subcategories AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_delete_product_subcategories" ON public.product_subcategories AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);