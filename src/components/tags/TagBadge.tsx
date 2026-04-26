import type { ModelTag } from '@/api/models';

const axisColors: Record<string, string> = {
  type: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  clan: 'bg-red-500/15 text-red-300 border-red-500/25',
  format: 'bg-green-500/15 text-green-300 border-green-500/25',
  rarity: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
  misc: 'bg-white/10 text-white/50 border-white/15',
};

interface TagBadgeProps {
  tag: ModelTag | { slug: string; label: string; axis: string; color: string | null };
  onClick?: () => void;
  active?: boolean;
  size?: 'sm' | 'md';
}

export function TagBadge({ tag, onClick, active = false, size = 'sm' }: TagBadgeProps) {
  const colorClass = axisColors[tag.axis] ?? axisColors['misc']!;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`
        inline-flex items-center rounded-full border font-medium
        transition-all duration-150
        ${sizeClass}
        ${active ? 'ring-1 ring-offset-1 ring-offset-transparent ring-current opacity-100' : 'opacity-80 hover:opacity-100'}
        ${onClick ? 'cursor-pointer' : ''}
        ${colorClass}
      `}
      style={tag.color ? { borderColor: `${tag.color}40`, color: tag.color, backgroundColor: `${tag.color}18` } : {}}
    >
      {tag.label}
    </span>
  );
}
