import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModels, useDeleteModel } from '@/hooks/useModels';
import { Button } from '@/components/ui/Button';
import { TagBadge } from '@/components/tags/TagBadge';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { formatBytes, formatRelativeDate } from '@/lib/format';

export function ModelsAdminPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useModels({ per_page: 100, sort: 'recent' });
  const deleteModel = useDeleteModel();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return;
    setDeletingId(id);
    try {
      await deleteModel.mutateAsync(id);
      toast.success('Modèle supprimé');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Modèles</h1>
          <p className="text-sm text-white/40 mt-1">
            {data?.total ?? '…'} modèle{(data?.total ?? 0) !== 1 ? 's' : ''} dans la bibliothèque
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/admin/upload')}>
          Uploader
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data?.models.map((model) => (
            <div
              key={model.id}
              className="glass rounded-xl p-4 flex items-center gap-4 group hover:border-white/15 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-white/5 overflow-hidden shrink-0">
                {model.thumbnail_url ? (
                  <img src={model.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-white truncate">{model.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-white/30 font-mono">{formatBytes(model.file_size_bytes)}</span>
                  <span className="text-white/10">·</span>
                  <span className="text-xs text-white/30">{formatRelativeDate(model.created_at)}</span>
                  <span className="text-white/10">·</span>
                  <span className="text-xs text-white/30">{model.view_count} vue{model.view_count !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {model.tags.slice(0, 3).map((tag) => (
                  <TagBadge key={tag.id} tag={tag} />
                ))}
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/models/${model.slug}`)}
                >
                  Voir
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={deletingId === model.id}
                  onClick={() => void handleDelete(model.id, model.name)}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
