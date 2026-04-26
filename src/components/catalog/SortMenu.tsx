import { useFiltersStore } from '@/stores/filters';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'popular', label: 'Plus vus' },
  { value: 'name', label: 'Nom A-Z' },
] as const;

export function SortMenu() {
  const { sort, setSort } = useFiltersStore();

  return (
    <select
      value={sort}
      onChange={(e) => setSort(e.target.value as 'recent' | 'popular' | 'name')}
      className="glass rounded-xl px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-blurple/50 focus:ring-1 focus:ring-blurple/30 transition-all cursor-pointer bg-transparent"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-[#0a0a0f]">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
