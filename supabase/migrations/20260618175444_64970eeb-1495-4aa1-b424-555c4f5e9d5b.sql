
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS badge text,
  ADD COLUMN IF NOT EXISTS compare_at_price_cents integer;

-- Public read on product-images bucket (works even when bucket is private)
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Service role full access (used by admin server functions)
DROP POLICY IF EXISTS "product_images_service_all" ON storage.objects;
CREATE POLICY "product_images_service_all"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');
