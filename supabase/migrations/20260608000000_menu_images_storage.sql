-- Public bucket for dish / menu images uploaded from admin & chef catalog UI

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "menu_images_public_read" ON storage.objects;
CREATE POLICY "menu_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "menu_images_admin_chef_insert" ON storage.objects;
CREATE POLICY "menu_images_admin_chef_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'menu-images' AND public.is_admin_or_chef());

DROP POLICY IF EXISTS "menu_images_admin_chef_update" ON storage.objects;
CREATE POLICY "menu_images_admin_chef_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'menu-images' AND public.is_admin_or_chef())
  WITH CHECK (bucket_id = 'menu-images' AND public.is_admin_or_chef());

DROP POLICY IF EXISTS "menu_images_admin_chef_delete" ON storage.objects;
CREATE POLICY "menu_images_admin_chef_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'menu-images' AND public.is_admin_or_chef());
