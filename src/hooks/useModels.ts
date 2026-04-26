import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listModels, getModel, deleteModel, updateModel } from '@/api/models';
import type { ListModelsParams, UpdateModelPayload } from '@/api/models';

export function useModels(params: ListModelsParams = {}) {
  return useQuery({
    queryKey: ['models', params],
    queryFn: () => listModels(params),
    placeholderData: (prev) => prev,
  });
}

export function useModel(slug: string) {
  return useQuery({
    queryKey: ['model', slug],
    queryFn: () => getModel(slug),
    enabled: !!slug,
  });
}

export function useDeleteModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteModel,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['models'] });
    },
  });
}

export function useUpdateModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateModelPayload }) =>
      updateModel(id, payload),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: ['models'] });
      void qc.invalidateQueries({ queryKey: ['model', id] });
    },
  });
}
