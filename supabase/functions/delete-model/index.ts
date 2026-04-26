import { handleCors } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { errorResponse, jsonResponse, ApiError } from '../_shared/errors.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { deleteFile } from '../_shared/storage.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await requireAdmin(req);
    const { id } = await req.json() as { id?: string };
    if (!id) throw new ApiError('id requis', 400);

    const supabase = getServiceClient();
    const { data: model } = await supabase.from('models').select('glb_path, thumbnail_path').eq('id', id).single();
    if (!model) throw new ApiError('Modèle introuvable', 404);

    await supabase.from('models').delete().eq('id', id);

    await deleteFile('models', `${id}.glb`);
    if (model.thumbnail_path) await deleteFile('thumbnails', `${id}.webp`);

    return jsonResponse({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
});
