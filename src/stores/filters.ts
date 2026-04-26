import { create } from 'zustand';

type SortOption = 'recent' | 'popular' | 'name';

interface FiltersState {
  selectedTags: string[];
  search: string;
  sort: SortOption;
  toggleTag: (slug: string) => void;
  setSearch: (search: string) => void;
  setSort: (sort: SortOption) => void;
  clearFilters: () => void;
}

export const useFiltersStore = create<FiltersState>((set) => ({
  selectedTags: [],
  search: '',
  sort: 'recent',
  toggleTag: (slug) =>
    set((state) => ({
      selectedTags: state.selectedTags.includes(slug)
        ? state.selectedTags.filter((t) => t !== slug)
        : [...state.selectedTags, slug],
    })),
  setSearch: (search) => set({ search }),
  setSort: (sort) => set({ sort }),
  clearFilters: () => set({ selectedTags: [], search: '', sort: 'recent' }),
}));
