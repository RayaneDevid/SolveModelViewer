import { apiFetch, apiFetchMultipart } from '@/api/client';

export interface ModelTag {
  id: string;
  slug: string;
  label: string;
  axis: string;
  color: string | null;
}

export interface ModelListItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  file_size_bytes: number;
  has_animations: boolean;
  tags: ModelTag[];
  view_count: number;
  created_at: string;
}

export interface ModelDetail extends ModelListItem {
  glb_url: string;
  vertex_count: number | null;
  has_skeleton: boolean;
  source_format: string | null;
  updated_at: string;
}

export interface ListModelsResponse {
  models: ModelListItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface ListModelsParams {
  tags?: string[];
  search?: string;
  sort?: 'recent' | 'popular' | 'name';
  page?: number;
  per_page?: number;
}

export interface CreateModelResponse {
  id: string;
  slug: string;
  glb_url: string;
  thumbnail_url: string | null;
}

export interface UpdateModelPayload {
  name?: string;
  description?: string;
  tag_ids?: string[];
}

export function listModels(params: ListModelsParams = {}): Promise<ListModelsResponse> {
  const qs = new URLSearchParams();
  if (params.tags?.length) qs.set('tags', params.tags.join(','));
  if (params.search) qs.set('search', params.search);
  if (params.sort) qs.set('sort', params.sort);
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  const query = qs.toString();
  return apiFetch<ListModelsResponse>(`list-models${query ? `?${query}` : ''}`);
}

export function getModel(slug: string): Promise<ModelDetail> {
  return apiFetch<ModelDetail>(`get-model?slug=${encodeURIComponent(slug)}`);
}

export function createModel(form: FormData): Promise<CreateModelResponse> {
  return apiFetchMultipart<CreateModelResponse>('create-model', form);
}

export function updateModel(id: string, payload: UpdateModelPayload): Promise<void> {
  return apiFetch<void>('update-model', {
    method: 'PATCH',
    body: JSON.stringify({ id, ...payload }),
  });
}

export function deleteModel(id: string): Promise<void> {
  return apiFetch<void>('delete-model', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

export function recordView(modelId: string): Promise<void> {
  return apiFetch<void>('record-view', {
    method: 'POST',
    body: JSON.stringify({ model_id: modelId }),
  });
}
