import { useFiltersStore } from '@/stores/filters';

export function SearchBar() {
  const { search, setSearch } = useFiltersStore();

  return (
    <div className="relative flex-1 max-w-sm">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder="Rechercher un modèle…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full glass rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blurple/50 focus:ring-1 focus:ring-blurple/30 transition-all"
      />
      {search && (
        <button
          onClick={() => setSearch('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}
