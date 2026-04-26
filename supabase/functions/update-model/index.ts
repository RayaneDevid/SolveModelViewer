import { handleCors } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { errorResponse, jsonResponse, ApiError } from '../_shared/errors.ts';
import { requireAdmin } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await requireAdmin(req);
    const { id, name, description, tag_ids } = await req.json() as {
      id?: string; name?: string; description?: string; tag_ids?: string[];
    };

    if (!id) throw new ApiError('id requis', 400);

    const supabase = getServiceClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates['name'] = name;
    if (description !== undefined) updates['description'] = description;

    const { error } = await supabase.from('models').update(updates).eq('id', id);
    if (error) throw error;

    if (tag_ids !== undefined) {
      await supabase.from('model_tags').delete().eq('model_id', id);
      if (tag_ids.length > 0) {
        await supabase.from('model_tags').insert(
          tag_ids.map((tag_id: string) => ({ model_id: id, tag_id })),
        );
      }
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
});
