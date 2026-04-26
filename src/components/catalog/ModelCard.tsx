import { useNavigate } from 'react-router-dom';
import { useGLTF } from '@react-three/drei';
import { TagBadge } from '@/components/tags/TagBadge';
import { formatBytes, formatRelativeDate } from '@/lib/format';
import type { ModelListItem } from '@/api/models';

interface ModelCardProps {
  model: ModelListItem;
}

const VISIBLE_TAGS = 2;

export function ModelCard({ model }: ModelCardProps) {
  const navigate = useNavigate();
  const extraTags = model.tags.length - VISIBLE_TAGS;

  return (
    <button
      className="group flex flex-col glass rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:border-white/20 text-left w-full"
      onMouseEnter={() => useGLTF.preload(model.tags.length > 0 ? '' : '')}
      onClick={() => navigate(`/models/${model.slug}`)}
    >
      <div className="relative aspect-square bg-white/[0.03] overflow-hidden">
        {model.thumbnail_url ? (
          <img
            src={model.thumbnail_url}
            alt={model.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <svg className="w-10 h-10 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-xs text-white/20">Aucune miniature</span>
          </div>
        )}

        {model.has_animations && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[10px] text-white/60 border border-white/10 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Animé
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2">
        <div>
          <p className="font-semibold text-sm text-white truncate">{model.name}</p>
          {model.description && (
            <p className="text-xs text-white/50 line-clamp-1 mt-0.5">{model.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {model.tags.slice(0, VISIBLE_TAGS).map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
          {extraTags > 0 && (
            <span className="text-[10px] text-white/30 font-medium">+{extraTags}</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-[11px] text-white/30 font-mono">{formatBytes(model.file_size_bytes)}</span>
          <span className="text-[11px] text-white/30">{formatRelativeDate(model.created_at)}</span>
        </div>
      </div>
    </button>
  );
}
