import { handleCors } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { errorResponse, jsonResponse } from '../_shared/errors.ts';
import { requireAuth } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authUser = await requireAuth(req);
    const supabase = getServiceClient();

    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (existing) return jsonResponse(existing);

    const meta = authUser.user_metadata as {
      full_name?: string;
      name?: string;
      custom_claims?: { global_name?: string };
      provider_id?: string;
      avatar_url?: string;
      picture?: string;
    };

    const username =
      meta.full_name ??
      meta.name ??
      meta.custom_claims?.global_name ??
      authUser.email?.split('@')[0] ??
      'Unknown';

    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        discord_id: meta.provider_id ?? null,
        username,
        avatar_url: meta.avatar_url ?? meta.picture ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return jsonResponse(profile);
  } catch (e) {
    return errorResponse(e);
  }
});
