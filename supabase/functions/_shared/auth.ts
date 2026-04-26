import { getServiceClient } from './supabase-client.ts';
import { ApiError } from './errors.ts';

export async function getUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabase = getServiceClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return user;
}

export async function requireAuth(req: Request) {
  const user = await getUser(req);
  if (!user) throw new ApiError('Non authentifié', 401);
  return user;
}

export async function requireAdmin(req: Request) {
  const user = await requireAuth(req);
  const supabase = getServiceClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new ApiError('Accès refusé', 403);
  return user;
}
