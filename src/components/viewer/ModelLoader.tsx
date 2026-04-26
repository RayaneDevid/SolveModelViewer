import { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import type { Group, Mesh, Material } from 'three';
import { useViewerStore } from '@/stores/viewer';

interface ModelLoaderProps {
  url: string;
}

export function ModelLoader({ url }: ModelLoaderProps) {
  const { scene, animations } = useGLTF(url);
  const group = useRef<Group>(null);
  const { actions, names } = useAnimations(animations, group);
  const currentAnim = useViewerStore((s) => s.currentAnimation);
  const isWireframe = useViewerStore((s) => s.isWireframe);

  useEffect(() => {
    useViewerStore.setState({ availableAnimations: names });
  }, [names]);

  useEffect(() => {
    if (!currentAnim || !actions[currentAnim]) return;
    const action = actions[currentAnim].reset().fadeIn(0.3).play();
    return () => {
      action.fadeOut(0.3);
    };
  }, [actions, currentAnim]);

  useEffect(() => {
    scene.traverse((obj) => {
      if ('isMesh' in obj && obj.isMesh) {
        const mesh = obj as Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => { (mat as Material & { wireframe?: boolean }).wireframe = isWireframe; });
        } else {
          (mesh.material as Material & { wireframe?: boolean }).wireframe = isWireframe;
        }
      }
    });
  }, [scene, isWireframe]);

  useEffect(() => {
    return () => {
      useGLTF.clear(url);
    };
  }, [url]);

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}
