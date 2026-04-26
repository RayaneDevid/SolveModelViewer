import { handleCors } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { errorResponse, jsonResponse, ApiError } from '../_shared/errors.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { uploadFile, getPublicUrl } from '../_shared/storage.ts';

const SLUG_RE = /^[a-z0-9-]+$/;
const MAX_SIZE = 50 * 1024 * 1024;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const adminUser = await requireAdmin(req);
    const formData = await req.formData();

    const glbFile = formData.get('glb') as File | null;
    if (!glbFile) throw new ApiError('Fichier .glb requis', 400);
    if (!glbFile.name.endsWith('.glb')) throw new ApiError('Extension .glb attendue', 400);
    if (glbFile.size > MAX_SIZE) throw new ApiError('Fichier trop volumineux (max 50 Mo)', 400);

    const name = (formData.get('name') as string | null)?.trim();
    const slug = (formData.get('slug') as string | null)?.trim();
    if (!name) throw new ApiError('Nom requis', 400);
    if (!slug || !SLUG_RE.test(slug)) throw new ApiError('Slug invalide (a-z, 0-9, tirets)', 400);

    const description = (formData.get('description') as string | null)?.trim() || null;
    const sourceFormat = (formData.get('source_format') as string | null)?.trim() || null;
    const tagIdsRaw = formData.get('tag_ids') as string | null;
    const tagIds: string[] = tagIdsRaw ? JSON.parse(tagIdsRaw) : [];

    const supabase = getServiceClient();

    const { data: existing } = await supabase.from('models').select('id').eq('slug', slug).single();
    if (existing) throw new ApiError('Slug déjà utilisé', 409);

    if (tagIds.length > 0) {
      const { data: tags } = await supabase.from('tags').select('id').in('id', tagIds);
      if ((tags ?? []).length !== tagIds.length) throw new ApiError('Tag(s) introuvable(s)', 400);
    }

    const { data: model, error: insertError } = await supabase
      .from('models')
      .insert({
        slug,
        name,
        description,
        source_format: sourceFormat,
        glb_path: `models/placeholder`,
        uploaded_by: adminUser.id,
        file_size_bytes: glbFile.size,
      })
      .select()
      .single();

    if (insertError || !model) throw new ApiError('Erreur insertion modèle', 500);

    const glbBytes = new Uint8Array(await glbFile.arrayBuffer());
    await uploadFile('models', `${model.id}.glb`, glbBytes, 'model/gltf-binary');

    let thumbnailPath: string | null = null;
    const thumbnailFile = formData.get('thumbnail') as File | null;
    if (thumbnailFile) {
      const thumbBytes = new Uint8Array(await thumbnailFile.arrayBuffer());
      await uploadFile('thumbnails', `${model.id}.webp`, thumbBytes, 'image/webp');
      thumbnailPath = `thumbnails/${model.id}.webp`;
    }

    await supabase
      .from('models')
      .update({ glb_path: `models/${model.id}.glb`, thumbnail_path: thumbnailPath })
      .eq('id', model.id);

    if (tagIds.length > 0) {
      await supabase.from('model_tags').insert(
        tagIds.map((tag_id: string) => ({ model_id: model.id, tag_id })),
      );
    }

    return jsonResponse({
      id: model.id,
      slug: model.slug,
      glb_url: getPublicUrl('models', `${model.id}.glb`),
      thumbnail_url: thumbnailPath ? getPublicUrl('thumbnails', `${model.id}.webp`) : null,
    }, 201);
  } catch (e) {
    return errorResponse(e);
  }
});
