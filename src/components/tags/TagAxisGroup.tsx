import { TagBadge } from '@/components/tags/TagBadge';

const axisLabels: Record<string, string> = {
  type: 'Type',
  clan: 'Clan',
  format: 'Format',
  rarity: 'Rareté',
  misc: 'Divers',
};

interface TagLike {
  id: string;
  slug: string;
  label: string;
  axis: string;
  color: string | null;
}

interface TagAxisGroupProps {
  axis: string;
  tags: TagLike[];
  selectedTags?: string[];
  onToggle?: (slug: string) => void;
}

export function TagAxisGroup({ axis, tags, selectedTags = [], onToggle }: TagAxisGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/30">
        {axisLabels[axis] ?? axis}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag}
            active={selectedTags.includes(tag.slug)}
            onClick={onToggle ? () => onToggle(tag.slug) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
