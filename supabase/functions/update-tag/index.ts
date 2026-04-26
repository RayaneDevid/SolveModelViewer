import { handleCors } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { errorResponse, jsonResponse, ApiError } from '../_shared/errors.ts';
import { requireAdmin } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await requireAdmin(req);
    const { id, label, color } = await req.json() as { id?: string; label?: string; color?: string };
    if (!id) throw new ApiError('id requis', 400);

    const supabase = getServiceClient();
    const updates: Record<string, unknown> = {};
    if (label !== undefined) updates['label'] = label;
    if (color !== undefined) updates['color'] = color || null;

    const { data: tag, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return jsonResponse(tag);
  } catch (e) {
    return errorResponse(e);
  }
});
