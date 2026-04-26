import { handleCors } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { errorResponse, jsonResponse, ApiError } from '../_shared/errors.ts';
import { getPublicUrl } from '../_shared/storage.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    if (!slug) throw new ApiError('Paramètre slug requis', 400);

    const supabase = getServiceClient();

    const { data: model, error } = await supabase
      .from('models')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !model) throw new ApiError('Modèle introuvable', 404);

    const { data: tagLinks } = await supabase
      .from('model_tags')
      .select('tags(id, slug, label, axis, color)')
      .eq('model_id', model.id);

    const { data: viewStat } = await supabase
      .from('model_view_stats')
      .select('total_views')
      .eq('model_id', model.id)
      .single();

    const tags = (tagLinks ?? []).map((l: { tags: unknown }) => l.tags).filter(Boolean);

    return jsonResponse({
      ...model,
      glb_url: getPublicUrl('models', model.glb_path.replace('models/', '')),
      thumbnail_url: model.thumbnail_path
        ? getPublicUrl('thumbnails', model.thumbnail_path.replace('thumbnails/', ''))
        : null,
      tags,
      view_count: Number(viewStat?.total_views ?? 0),
    });
  } catch (e) {
    return errorResponse(e);
  }
});
