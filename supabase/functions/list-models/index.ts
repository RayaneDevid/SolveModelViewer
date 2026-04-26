import { handleCors, corsHeaders } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { errorResponse, jsonResponse } from '../_shared/errors.ts';
import { getPublicUrl } from '../_shared/storage.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const tagsParam = url.searchParams.get('tags');
    const search = url.searchParams.get('search');
    const sort = url.searchParams.get('sort') ?? 'recent';
    const page = parseInt(url.searchParams.get('page') ?? '1', 10);
    const perPage = Math.min(parseInt(url.searchParams.get('per_page') ?? '24', 10), 100);
    const offset = (page - 1) * perPage;

    const tagSlugs = tagsParam ? tagsParam.split(',').filter(Boolean) : [];
    const supabase = getServiceClient();

    let modelIds: string[] | null = null;

    if (tagSlugs.length > 0) {
      const { data: tagRows } = await supabase
        .from('tags')
        .select('id')
        .in('slug', tagSlugs);

      const tagIds = (tagRows ?? []).map((t: { id: string }) => t.id);
      if (tagIds.length !== tagSlugs.length) {
        return jsonResponse({ models: [], total: 0, page, per_page: perPage });
      }

      const { data: mtRows } = await supabase
        .from('model_tags')
        .select('model_id')
        .in('tag_id', tagIds);

      const counts: Record<string, number> = {};
      for (const row of (mtRows ?? [])) {
        counts[row.model_id] = (counts[row.model_id] ?? 0) + 1;
      }

      modelIds = Object.entries(counts)
        .filter(([, count]) => count === tagIds.length)
        .map(([id]) => id);

      if (modelIds.length === 0) {
        return jsonResponse({ models: [], total: 0, page, per_page: perPage });
      }
    }

    let query = supabase
      .from('models')
      .select('id, slug, name, description, thumbnail_path, file_size_bytes, has_animations, created_at', { count: 'exact' });

    if (modelIds) query = query.in('id', modelIds);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

    if (sort === 'name') {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + perPage - 1);

    const { data: rows, count, error } = await query;
    if (error) throw error;

    const ids = (rows ?? []).map((r: { id: string }) => r.id);
    const { data: tagLinks } = await supabase
      .from('model_tags')
      .select('model_id, tags(id, slug, label, axis, color)')
      .in('model_id', ids);

    const { data: viewStats } = await supabase
      .from('model_view_stats')
      .select('model_id, total_views')
      .in('model_id', ids);

    const tagMap: Record<string, unknown[]> = {};
    for (const link of (tagLinks ?? [])) {
      if (!tagMap[link.model_id]) tagMap[link.model_id] = [];
      if (link.tags) tagMap[link.model_id]!.push(link.tags);
    }

    const viewMap: Record<string, number> = {};
    for (const s of (viewStats ?? [])) {
      viewMap[s.model_id] = Number(s.total_views);
    }

    const models = (rows ?? []).map((r: {
      id: string; slug: string; name: string; description: string | null;
      thumbnail_path: string | null; file_size_bytes: number; has_animations: boolean; created_at: string;
    }) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      thumbnail_url: r.thumbnail_path ? getPublicUrl('thumbnails', r.thumbnail_path.replace('thumbnails/', '')) : null,
      file_size_bytes: r.file_size_bytes,
      has_animations: r.has_animations,
      tags: tagMap[r.id] ?? [],
      view_count: viewMap[r.id] ?? 0,
      created_at: r.created_at,
    }));

    if (sort === 'popular') {
      models.sort((a: { view_count: number }, b: { view_count: number }) => b.view_count - a.view_count);
    }

    return jsonResponse({ models, total: count ?? 0, page, per_page: perPage });
  } catch (e) {
    return errorResponse(e);
  }
});
