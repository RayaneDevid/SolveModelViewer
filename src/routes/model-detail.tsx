import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useModel } from '@/hooks/useModels';
import { useViewerStore } from '@/stores/viewer';
import { ModelViewer } from '@/components/viewer/ModelViewer';
import { TagBadge } from '@/components/tags/TagBadge';
import { TagAxisGroup } from '@/components/tags/TagAxisGroup';
import { Spinner } from '@/components/ui/Spinner';
import { formatBytes, formatRelativeDate } from '@/lib/format';
import { recordView } from '@/api/models';

export function ModelDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: model, isLoading, error } = useModel(slug);
  const reset = useViewerStore((s) => s.reset);

  useEffect(() => {
    reset();
  }, [slug, reset]);

  useEffect(() => {
    if (model) {
      void recordView(model.id);
    }
  }, [model]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-white/40">Modèle introuvable</p>
        <button onClick={() => navigate('/')} className="text-sm text-blurple hover:underline">
          Retour au catalogue
        </button>
      </div>
    );
  }

  const tagsByAxis = model.tags.reduce<Record<string, typeof model.tags>>(
    (acc, tag) => {
      if (!acc[tag.axis]) acc[tag.axis] = [];
      acc[tag.axis]!.push(tag);
      return acc;
    },
    {},
  );

  return (
    <div className="h-full flex flex-col lg:flex-row">
      <div className="flex-1 min-h-[50vh] lg:min-h-0">
        <ModelViewer url={model.glb_url} className="h-full" />
      </div>

      <aside className="w-full lg:w-80 shrink-0 glass border-t lg:border-t-0 lg:border-l border-white/5 overflow-y-auto">
        <div className="p-5 flex flex-col gap-5">
          <div>
            <button
              onClick={() => navigate('/')}
              className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1 mb-3"
            >
              ← Catalogue
            </button>
            <h1 className="text-xl font-bold text-white">{model.name}</h1>
            {model.description && (
              <p className="mt-1 text-sm text-white/60 leading-relaxed">{model.description}</p>
            )}
          </div>

          {Object.entries(tagsByAxis).map(([axis, tags]) => (
            <TagAxisGroup key={axis} axis={axis} tags={tags} />
          ))}

          <div className="glass rounded-xl p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/30">Infos</p>
            <div className="grid grid-cols-2 gap-y-2.5 text-sm">
              <span className="text-white/40">Taille</span>
              <span className="font-mono text-white/70">{formatBytes(model.file_size_bytes)}</span>

              {model.vertex_count != null && (
                <>
                  <span className="text-white/40">Vertices</span>
                  <span className="font-mono text-white/70">{model.vertex_count.toLocaleString('fr-FR')}</span>
                </>
              )}

              <span className="text-white/40">Animations</span>
              <span className={model.has_animations ? 'text-green-400' : 'text-white/30'}>
                {model.has_animations ? 'Oui' : 'Non'}
              </span>

              <span className="text-white/40">Squelette</span>
              <span className={model.has_skeleton ? 'text-green-400' : 'text-white/30'}>
                {model.has_skeleton ? 'Oui' : 'Non'}
              </span>

              {model.source_format && (
                <>
                  <span className="text-white/40">Format source</span>
                  <span className="font-mono text-white/70 text-xs">{model.source_format}</span>
                </>
              )}

              <span className="text-white/40">Ajouté</span>
              <span className="text-white/50 text-xs">{formatRelativeDate(model.created_at)}</span>

              <span className="text-white/40">Vues</span>
              <span className="text-white/70">{model.view_count.toLocaleString('fr-FR')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/30">Lien direct</p>
            <div className="glass rounded-xl px-3 py-2 flex items-center gap-2">
              <code className="text-[11px] text-white/50 font-mono flex-1 truncate">{model.glb_url}</code>
              <button
                onClick={() => void navigator.clipboard.writeText(model.glb_url)}
                className="shrink-0 text-white/30 hover:text-white transition-colors"
                title="Copier l'URL"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
