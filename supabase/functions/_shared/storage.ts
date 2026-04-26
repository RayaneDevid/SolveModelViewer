import { getServiceClient } from './supabase-client.ts';
import { ApiError } from './errors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

export async function uploadFile(
  bucket: string,
  path: string,
  file: Uint8Array,
  contentType: string,
): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: true });

  if (error) throw new ApiError(`Upload échoué: ${error.message}`, 500);
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = getServiceClient();
  await supabase.storage.from(bucket).remove([path]);
}

export function getPublicUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
