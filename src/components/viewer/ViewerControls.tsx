import { useViewerStore } from '@/stores/viewer';
import { AnimationMixer } from '@/components/viewer/AnimationMixer';

interface ViewerControlsProps {
  onFullscreen?: () => void;
}

export function ViewerControls({ onFullscreen }: ViewerControlsProps) {
  const { isWireframe, toggleWireframe, availableAnimations } = useViewerStore();

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-3 pointer-events-none">
      {availableAnimations.length > 0 && (
        <div className="pointer-events-auto glass rounded-xl px-3 py-2 self-start">
          <AnimationMixer />
        </div>
      )}

      <div className="flex items-center gap-2 pointer-events-auto self-end">
        <button
          onClick={toggleWireframe}
          className={`px-3 py-1.5 glass rounded-lg text-xs font-medium transition-all ${
            isWireframe ? 'text-blurple border-blurple/30' : 'text-white/50 hover:text-white'
          }`}
          title="Wireframe"
        >
          Wireframe
        </button>

        {onFullscreen && (
          <button
            onClick={onFullscreen}
            className="p-1.5 glass rounded-lg text-white/50 hover:text-white transition-all"
            title="Plein écran"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
