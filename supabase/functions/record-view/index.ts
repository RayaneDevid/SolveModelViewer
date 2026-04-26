import { handleCors } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { errorResponse, jsonResponse, ApiError } from '../_shared/errors.ts';
import { getUser } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { model_id } = await req.json() as { model_id?: string };
    if (!model_id) throw new ApiError('model_id requis', 400);

    const user = await getUser(req);
    const supabase = getServiceClient();

    await supabase.from('model_views').insert({
      model_id,
      viewer_id: user?.id ?? null,
    });

    return jsonResponse({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
});
