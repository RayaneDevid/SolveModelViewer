import { useFiltersStore } from '@/stores/filters';
import { useModels } from '@/hooks/useModels';
import { useDebounce } from '@/hooks/useDebounce';
import { ModelGrid } from '@/components/catalog/ModelGrid';
import { SearchBar } from '@/components/catalog/SearchBar';
import { SortMenu } from '@/components/catalog/SortMenu';

export function HomePage() {
  const { selectedTags, search, sort } = useFiltersStore();
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, error } = useModels({
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    search: debouncedSearch || undefined,
    sort,
    per_page: 24,
  });

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <SearchBar />
          {data && (
            <p className="text-sm text-white/30 shrink-0">
              {data.total} modèle{data.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <SortMenu />
      </div>

      <ModelGrid
        models={data?.models}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
