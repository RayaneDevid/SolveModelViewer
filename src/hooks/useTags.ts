import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listTags, createTag, updateTag, deleteTag } from '@/api/tags';
import type { CreateTagPayload, UpdateTagPayload } from '@/api/tags';

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: listTags,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTagPayload) => createTag(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTagPayload) => updateTag(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tags'] });
      void qc.invalidateQueries({ queryKey: ['models'] });
    },
  });
}
