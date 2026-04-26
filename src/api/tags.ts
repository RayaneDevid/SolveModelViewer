import { apiFetch } from '@/api/client';

export interface Tag {
  id: string;
  slug: string;
  label: string;
  axis: string;
  color: string | null;
  created_at: string;
}

export interface TagsByAxis {
  [axis: string]: Tag[];
}

export interface CreateTagPayload {
  slug: string;
  label: string;
  axis: string;
  color?: string;
}

export interface UpdateTagPayload {
  id: string;
  label?: string;
  color?: string;
}

export function listTags(): Promise<TagsByAxis> {
  return apiFetch<TagsByAxis>('list-tags');
}

export function createTag(payload: CreateTagPayload): Promise<Tag> {
  return apiFetch<Tag>('create-tag', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTag(payload: UpdateTagPayload): Promise<Tag> {
  return apiFetch<Tag>('update-tag', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteTag(id: string): Promise<void> {
  return apiFetch<void>('delete-tag', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}
