import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ViewerStage } from '@/components/viewer/ViewerStage';
import { ModelLoader } from '@/components/viewer/ModelLoader';
import { ViewerControls } from '@/components/viewer/ViewerControls';
import { useViewerStore } from '@/stores/viewer';
import { Spinner } from '@/components/ui/Spinner';

interface ModelViewerProps {
  url: string;
  className?: string;
}

function LoaderIndicator() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export function ModelViewer({ url, className = '' }: ModelViewerProps) {
  const currentAnim = useViewerStore((s) => s.currentAnimation);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = () => {
    if (containerRef.current) {
      void containerRef.current.requestFullscreen();
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 1.5, 3], fov: 50 }}
        dpr={[1, 2]}
        frameloop={currentAnim ? 'always' : 'demand'}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        onCreated={({ gl }) => { gl.toneMappingExposure = 0.1; }}
      >
        <Suspense fallback={null}>
          <ViewerStage>
            <ModelLoader url={url} />
          </ViewerStage>
        </Suspense>
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
      </Canvas>

      <Suspense fallback={<LoaderIndicator />}>
        <div className="absolute inset-0 pointer-events-none" />
      </Suspense>

      <ViewerControls onFullscreen={handleFullscreen} />
    </div>
  );
}
