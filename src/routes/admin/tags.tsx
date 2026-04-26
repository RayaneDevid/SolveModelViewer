import { useState } from 'react';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/useTags';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TagBadge } from '@/components/tags/TagBadge';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { slugify } from '@/lib/slugify';
import type { Tag } from '@/api/tags';

const AXES = ['type', 'clan', 'format', 'rarity', 'misc'];

export function TagsAdminPage() {
  const { data: tagsByAxis, isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTag, setEditTag] = useState<Tag | null>(null);

  const [form, setForm] = useState({ label: '', axis: 'type', color: '' });

  const handleCreate = async () => {
    if (!form.label.trim()) return;
    try {
      await createTag.mutateAsync({
        slug: slugify(form.label),
        label: form.label.trim(),
        axis: form.axis,
        color: form.color || undefined,
      });
      toast.success('Tag créé');
      setCreateOpen(false);
      setForm({ label: '', axis: 'type', color: '' });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleUpdate = async () => {
    if (!editTag) return;
    try {
      await updateTag.mutateAsync({
        id: editTag.id,
        label: editTag.label,
        color: editTag.color ?? undefined,
      });
      toast.success('Tag mis à jour');
      setEditTag(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce tag ? Les modèles associés perdront ce tag.')) return;
    try {
      await deleteTag.mutateAsync(id);
      toast.success('Tag supprimé');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="p-6 max-w-4xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tags</h1>
          <p className="text-sm text-white/40 mt-1">Gestion des tags de classification</p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          Nouveau tag
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : tagsByAxis ? (
        Object.entries(tagsByAxis).map(([axis, tags]) => (
          <div key={axis} className="glass rounded-2xl p-5 flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30">{axis}</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-1.5 group">
                  <TagBadge tag={tag} size="md" />
                  <button
                    onClick={() => setEditTag(tag)}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-white/50 transition-all text-xs"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => void handleDelete(tag.id)}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-red-400 transition-all text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : null}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Créer un tag">
        <div className="flex flex-col gap-4">
          <Input
            label="Nom"
            placeholder="Konoha, Weapon…"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/70">Axe</label>
            <select
              value={form.axis}
              onChange={(e) => setForm({ ...form, axis: e.target.value })}
              className="glass rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blurple/50 bg-transparent"
            >
              {AXES.map((a) => (
                <option key={a} value={a} className="bg-[#0a0a0f]">{a}</option>
              ))}
            </select>
          </div>
          <Input
            label="Couleur (hex, optionnel)"
            placeholder="#e74c3c"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button variant="primary" loading={createTag.isPending} onClick={() => void handleCreate()}>
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      {editTag && (
        <Modal open onClose={() => setEditTag(null)} title="Modifier le tag">
          <div className="flex flex-col gap-4">
            <Input
              label="Nom"
              value={editTag.label}
              onChange={(e) => setEditTag({ ...editTag, label: e.target.value })}
            />
            <Input
              label="Couleur (hex)"
              placeholder="#e74c3c"
              value={editTag.color ?? ''}
              onChange={(e) => setEditTag({ ...editTag, color: e.target.value || null })}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditTag(null)}>Annuler</Button>
              <Button variant="primary" loading={updateTag.isPending} onClick={() => void handleUpdate()}>
                Sauvegarder
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
