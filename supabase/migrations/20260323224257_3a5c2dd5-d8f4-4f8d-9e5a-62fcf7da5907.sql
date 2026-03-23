
-- Products table with encrypted fields (name, description stored encrypted)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS: block direct access, only via edge function
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "No direct write products" ON public.products FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update products" ON public.products FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No direct delete products" ON public.products FOR DELETE TO anon, authenticated USING (false);

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Allow anyone to read product images
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');

-- Allow service role (edge functions) to manage images - no direct client uploads
CREATE POLICY "No direct upload product images" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct delete product images" ON storage.objects FOR DELETE TO anon, authenticated USING (false);
