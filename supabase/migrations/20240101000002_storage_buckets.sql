insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('models',       'models',       true,  52428800, array['model/gltf-binary', 'application/octet-stream']),
  ('thumbnails',   'thumbnails',   true,  5242880,  array['image/webp', 'image/jpeg', 'image/png']),
  ('source-files', 'source-files', false, 524288000, null);
