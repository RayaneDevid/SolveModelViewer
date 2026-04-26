import { handleCors } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { errorResponse, jsonResponse, ApiError } from '../_shared/errors.ts';
import { requireAdmin } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await requireAdmin(req);
    const { id } = await req.json() as { id?: string };
    if (!id) throw new ApiError('id requis', 400);

    const supabase = getServiceClient();
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) throw error;

    return jsonResponse({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
});
