import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useFiltersStore } from '@/stores/filters';
import { useTags } from '@/hooks/useTags';
import { TagAxisGroup } from '@/components/tags/TagAxisGroup';
import { UserMenu } from '@/components/layout/UserMenu';
import { Spinner } from '@/components/ui/Spinner';

export function Sidebar() {
  const { isAdmin } = useAuthStore();
  const { selectedTags, toggleTag, clearFilters } = useFiltersStore();
  const { data: tagsByAxis, isLoading: tagsLoading } = useTags();

  const hasFilters = selectedTags.length > 0;

  return (
    <aside className="w-60 shrink-0 h-full flex flex-col glass border-r border-white/5">
      <div className="p-5 border-b border-white/5">
        <NavLink to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blurple/20 border border-blurple/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-blurple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Solve 3D</p>
            <p className="text-[10px] text-white/40">Library</p>
          </div>
        </NavLink>
      </div>

      <nav className="px-3 py-4 flex flex-col gap-1 border-b border-white/5">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
              isActive
                ? 'bg-blurple/15 text-white border border-blurple/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Catalogue
        </NavLink>

        {isAdmin && (
          <>
            <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/25">
              Admin
            </p>
            <NavLink
              to="/admin/upload"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-violet/15 text-white border border-violet/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload
            </NavLink>
            <NavLink
              to="/admin/models"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-violet/15 text-white border border-violet/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Modèles
            </NavLink>
            <NavLink
              to="/admin/tags"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-violet/15 text-white border border-violet/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
              </svg>
              Tags
            </NavLink>
          </>
        )}
      </nav>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-blurple hover:text-blue-300 transition-colors self-start"
          >
            Effacer les filtres ({selectedTags.length})
          </button>
        )}

        {tagsLoading ? (
          <div className="flex justify-center pt-4">
            <Spinner size="sm" />
          </div>
        ) : tagsByAxis ? (
          Object.entries(tagsByAxis).map(([axis, tags]) => (
            <TagAxisGroup
              key={axis}
              axis={axis}
              tags={tags}
              selectedTags={selectedTags}
              onToggle={toggleTag}
            />
          ))
        ) : null}
      </div>

      <div className="p-3 border-t border-white/5">
        <UserMenu />
      </div>
    </aside>
  );
}
