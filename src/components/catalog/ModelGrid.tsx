import { ModelCard } from '@/components/catalog/ModelCard';
import { ModelCardSkeleton } from '@/components/catalog/ModelCardSkeleton';
import type { ModelListItem } from '@/api/models';

interface ModelGridProps {
  models?: ModelListItem[];
  isLoading?: boolean;
  error?: Error | null;
}

export function ModelGrid({ models, isLoading, error }: ModelGridProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-white/40 text-sm">Impossible de charger les modèles</p>
        <p className="text-red-400/60 text-xs font-mono">{error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <ModelCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!models?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
          <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="text-white/40 text-sm">Aucun modèle trouvé</p>
        <p className="text-white/20 text-xs">Essaie d'autres filtres</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {models.map((model) => (
        <ModelCard key={model.id} model={model} />
      ))}
    </div>
  );
}
