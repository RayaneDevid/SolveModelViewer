import { handleCors } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { errorResponse, jsonResponse, ApiError } from '../_shared/errors.ts';
import { requireAdmin } from '../_shared/auth.ts';

const SLUG_RE = /^[a-z0-9-]+$/;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await requireAdmin(req);
    const { slug, label, axis, color } = await req.json() as {
      slug?: string; label?: string; axis?: string; color?: string;
    };

    if (!slug || !SLUG_RE.test(slug)) throw new ApiError('Slug invalide', 400);
    if (!label?.trim()) throw new ApiError('Label requis', 400);
    if (!axis?.trim()) throw new ApiError('Axe requis', 400);

    const supabase = getServiceClient();
    const { data: tag, error } = await supabase
      .from('tags')
      .insert({ slug, label: label.trim(), axis: axis.trim(), color: color ?? null })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ApiError('Slug déjà utilisé', 409);
      throw error;
    }

    return jsonResponse(tag, 201);
  } catch (e) {
    return errorResponse(e);
  }
});
