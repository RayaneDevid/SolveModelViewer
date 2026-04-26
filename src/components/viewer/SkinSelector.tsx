import { useViewerStore } from '@/stores/viewer';

export function SkinSelector() {
  const { availableSkins, skinIndex, setSkinIndex } = useViewerStore();

  if (availableSkins.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-white/40 font-medium">Texture</span>
      <button
        onClick={() => setSkinIndex(null)}
        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
          skinIndex === null
            ? 'bg-white/15 text-white border border-white/20'
            : 'text-white/40 hover:text-white/70 hover:bg-white/5'
        }`}
      >
        Tous
      </button>
      {availableSkins.map((skin, i) => (
        <button
          key={skin.name}
          onClick={() => setSkinIndex(i)}
          title={skin.name}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
            skinIndex === i
              ? 'bg-blurple/20 text-blurple border border-blurple/30'
              : 'text-white/40 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white/20"
            style={{ backgroundColor: skin.color }}
          />
          {skin.name || `Skin ${i + 1}`}
        </button>
      ))}
    </div>
  );
}
