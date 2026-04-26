import { handleCors } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { errorResponse, jsonResponse } from '../_shared/errors.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const supabase = getServiceClient();
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .order('axis')
      .order('label');

    if (error) throw error;

    const byAxis: Record<string, unknown[]> = {};
    for (const tag of (tags ?? [])) {
      if (!byAxis[tag.axis]) byAxis[tag.axis] = [];
      byAxis[tag.axis]!.push(tag);
    }

    return jsonResponse(byAxis);
  } catch (e) {
    return errorResponse(e);
  }
});
