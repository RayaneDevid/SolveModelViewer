import { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import type { Group, Mesh, Material, MeshStandardMaterial } from 'three';
import { useViewerStore } from '@/stores/viewer';

interface ModelLoaderProps {
  url: string;
}

function getMaterialColor(mat: Material): string {
  const std = mat as MeshStandardMaterial;
  return std.color ? `#${std.color.getHexString()}` : '#888888';
}

export function ModelLoader({ url }: ModelLoaderProps) {
  const { scene, animations } = useGLTF(url);
  const group = useRef<Group>(null);
  const { actions, names } = useAnimations(animations, group);
  const currentAnim = useViewerStore((s) => s.currentAnimation);
  const isWireframe = useViewerStore((s) => s.isWireframe);
  const skinIndex = useViewerStore((s) => s.skinIndex);
  const availableSkins = useViewerStore((s) => s.availableSkins);

  useEffect(() => {
    useViewerStore.setState({ availableAnimations: names });
  }, [names]);

  useEffect(() => {
    const seen = new Map<string, { color: string; name: string }>();
    scene.traverse((obj) => {
      if ((obj as Mesh).isMesh) {
        const mesh = obj as Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          if (!seen.has(mat.uuid)) seen.set(mat.uuid, { color: getMaterialColor(mat), name: mat.name });
        });
      }
    });
    const skins = Array.from(seen.entries()).map(([uuid, { color, name }], i) => ({
      uuid,
      color,
      name: name || `Texture ${i + 1}`,
    }));
    useViewerStore.setState({ availableSkins: skins, skinIndex: null });
  }, [scene]);

  useEffect(() => {
    if (!currentAnim || !actions[currentAnim]) return;
    const action = actions[currentAnim].reset().fadeIn(0.3).play();
    return () => { action.fadeOut(0.3); };
  }, [actions, currentAnim]);

  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as Mesh).isMesh) {
        const mesh = obj as Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => { (mat as Material & { wireframe?: boolean }).wireframe = isWireframe; });
      }
    });
  }, [scene, isWireframe]);

  useEffect(() => {
    if (skinIndex === null || availableSkins.length <= 1) {
      scene.traverse((obj) => {
        if ((obj as Mesh).isMesh) (obj as Mesh).visible = true;
      });
      return;
    }
    const selectedUuid = availableSkins[skinIndex]?.uuid;
    scene.traverse((obj) => {
      if ((obj as Mesh).isMesh) {
        const mesh = obj as Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mesh.visible = mats.some((m) => m.uuid === selectedUuid);
      }
    });
  }, [scene, skinIndex, availableSkins]);

  useEffect(() => {
    return () => { useGLTF.clear(url); };
  }, [url]);

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}
