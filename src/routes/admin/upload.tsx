import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Suspense } from 'react';
import { useTags } from '@/hooks/useTags';
import { useCreateTag } from '@/hooks/useTags';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TagBadge } from '@/components/tags/TagBadge';
import { toast } from '@/components/ui/Toast';
import { slugify } from '@/lib/slugify';
import { formatBytes } from '@/lib/format';
import { createModel } from '@/api/models';

interface GlbMeta {
  file: File;
  vertexCount: number;
  hasAnimations: boolean;
  hasSkeleton: boolean;
  objectUrl: string;
}

function PreviewModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function ThumbnailCanvas({
  url,
  onCapture,
}: {
  url: string;
  onCapture: (blob: Blob) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleCapture = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => blob && onCapture(blob), 'image/webp', 0.85);
  }, [onCapture]);

  return (
    <div className="flex flex-col gap-2">
      <div className="w-full aspect-square rounded-xl overflow-hidden bg-white/5">
        <Canvas
          ref={canvasRef as React.Ref<HTMLCanvasElement>}
          camera={{ position: [0, 1.5, 3], fov: 50 }}
          gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          onCreated={({ gl }) => { gl.toneMappingExposure = 0.2; }}
        >
          <Suspense fallback={null}>
            <Stage intensity={0.3} environment="studio" adjustCamera={1.2}>
              <PreviewModel url={url} />
            </Stage>
          </Suspense>
          <OrbitControls enableDamping dampingFactor={0.05} />
        </Canvas>
      </div>
      <Button variant="secondary" size="sm" onClick={handleCapture}>
        Capturer la miniature
      </Button>
    </div>
  );
}

const AXES = ['type', 'clan', 'format', 'rarity', 'misc'];

export function UploadPage() {
  const navigate = useNavigate();
  const { data: tagsByAxis } = useTags();
  const createTagMutation = useCreateTag();
  const qc = useQueryClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [glbMeta, setGlbMeta] = useState<GlbMeta | null>(null);
  const [thumbnail, setThumbnail] = useState<Blob | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sourceFormat, setSourceFormat] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagAxis, setNewTagAxis] = useState('type');
  const [uploading, setUploading] = useState(false);

  const [dragOver, setDragOver] = useState(false);

  const processGlbFile = (file: File) => {
    if (!file.name.endsWith('.glb')) {
      toast.error('Le fichier doit être un .glb');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Le fichier dépasse 50 Mo');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setGlbMeta({
      file,
      vertexCount: 0,
      hasAnimations: false,
      hasSkeleton: false,
      objectUrl,
    });
    setName(file.name.replace('.glb', ''));
    setSlug(slugify(file.name.replace('.glb', '')));
    setStep(2);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processGlbFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processGlbFile(file);
  };

  const handleCapture = (blob: Blob) => {
    setThumbnail(blob);
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    setThumbnailUrl(URL.createObjectURL(blob));
    toast.success('Miniature capturée');
  };

  const handleCreateTag = async () => {
    if (!newTagLabel.trim()) return;
    try {
      const tag = await createTagMutation.mutateAsync({
        slug: slugify(newTagLabel),
        label: newTagLabel.trim(),
        axis: newTagAxis,
      });
      setSelectedTagIds((prev) => [...prev, tag.id]);
      setNewTagLabel('');
      toast.success('Tag créé');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    if (!glbMeta || !name.trim() || !slug.trim()) return;
    setUploading(true);

    const form = new FormData();
    form.append('glb', glbMeta.file);
    if (thumbnail) form.append('thumbnail', thumbnail, 'thumbnail.webp');
    form.append('name', name.trim());
    form.append('slug', slug.trim());
    if (description) form.append('description', description);
    if (sourceFormat) form.append('source_format', sourceFormat);
    form.append('tag_ids', JSON.stringify(selectedTagIds));

    try {
      const result = await createModel(form);
      void qc.invalidateQueries({ queryKey: ['models'] });
      toast.success('Modèle uploadé avec succès');
      navigate(`/models/${result.slug}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload un modèle</h1>
        <div className="flex items-center gap-3 mt-3">
          {([1, 2, 3] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  step >= s ? 'bg-blurple text-white' : 'bg-white/10 text-white/30'
                }`}
              >
                {s}
              </div>
              <span className={`text-sm ${step === s ? 'text-white' : 'text-white/30'}`}>
                {s === 1 ? 'Fichier' : s === 2 ? 'Miniature' : 'Métadonnées'}
              </span>
              {s < 3 && <span className="text-white/15 mx-1">→</span>}
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div
          className={`glass rounded-2xl p-10 flex flex-col items-center gap-4 border-2 border-dashed transition-colors ${
            dragOver ? 'border-blurple/60 bg-blurple/5' : 'border-white/10'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-white font-medium">Dépose un fichier .glb</p>
            <p className="text-sm text-white/40 mt-1">ou clique pour choisir — max 50 Mo</p>
          </div>
          <label className="cursor-pointer">
            <input type="file" accept=".glb" className="hidden" onChange={handleFileInput} />
            <span className="inline-flex items-center px-4 py-2 glass-hover rounded-xl text-sm text-white/70 hover:text-white transition-all">
              Choisir un fichier
            </span>
          </label>
        </div>
      )}

      {step === 2 && glbMeta && (
        <div className="flex flex-col gap-4">
          <div className="glass rounded-2xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-sm text-white flex-1 truncate">{glbMeta.file.name}</span>
            <span className="text-xs text-white/40 font-mono">{formatBytes(glbMeta.file.size)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ThumbnailCanvas url={glbMeta.objectUrl} onCapture={handleCapture} />
            {thumbnailUrl && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-white/50">Aperçu miniature</p>
                <img
                  src={thumbnailUrl}
                  alt="Miniature"
                  className="rounded-xl aspect-square object-cover w-full"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(1)}>Retour</Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              Continuer {!thumbnail && '(sans miniature)'}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nom *"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(slugify(e.target.value));
              }}
            />
            <Input
              label="Slug *"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/70">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle…"
              rows={3}
              className="glass rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blurple/50 focus:ring-1 focus:ring-blurple/30 transition-all resize-none"
            />
          </div>

          <Input
            label="Format source"
            placeholder="source-engine, fbx, blender…"
            value={sourceFormat}
            onChange={(e) => setSourceFormat(e.target.value)}
          />

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-white/70">Tags</p>
            {tagsByAxis && Object.entries(tagsByAxis).map(([axis, tags]) => (
              <div key={axis} className="flex flex-col gap-2">
                <p className="text-xs uppercase tracking-wider text-white/25">{axis}</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <TagBadge
                      key={tag.id}
                      tag={tag}
                      size="md"
                      active={selectedTagIds.includes(tag.id)}
                      onClick={() => toggleTag(tag.id)}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="glass rounded-xl p-3 flex items-end gap-2">
              <Input
                label="Nouveau tag"
                placeholder="Nom du tag"
                value={newTagLabel}
                onChange={(e) => setNewTagLabel(e.target.value)}
              />
              <select
                value={newTagAxis}
                onChange={(e) => setNewTagAxis(e.target.value)}
                className="glass rounded-xl px-3 py-2.5 text-sm text-white/70 focus:outline-none bg-transparent shrink-0"
              >
                {AXES.map((a) => (
                  <option key={a} value={a} className="bg-[#0a0a0f]">{a}</option>
                ))}
              </select>
              <Button
                variant="secondary"
                size="md"
                loading={createTagMutation.isPending}
                onClick={() => void handleCreateTag()}
                className="shrink-0"
              >
                +
              </Button>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(2)}>Retour</Button>
            <Button
              variant="primary"
              loading={uploading}
              disabled={!name.trim() || !slug.trim()}
              onClick={() => void handleSubmit()}
            >
              Uploader le modèle
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
