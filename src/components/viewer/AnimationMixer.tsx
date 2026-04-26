import { useViewerStore } from '@/stores/viewer';

export function AnimationMixer() {
  const { currentAnimation, availableAnimations, setAnimation } = useViewerStore();

  if (availableAnimations.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => setAnimation(null)}
        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
          !currentAnimation
            ? 'bg-white/15 text-white border border-white/20'
            : 'text-white/40 hover:text-white/70 hover:bg-white/5'
        }`}
      >
        Stop
      </button>
      {availableAnimations.map((name) => (
        <button
          key={name}
          onClick={() => setAnimation(name)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
            currentAnimation === name
              ? 'bg-blurple/20 text-blurple border border-blurple/30'
              : 'text-white/40 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
