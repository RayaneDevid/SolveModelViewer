import { create } from 'zustand';

interface ViewerState {
  currentAnimation: string | null;
  availableAnimations: string[];
  skinIndex: number;
  isWireframe: boolean;
  setAnimation: (name: string | null) => void;
  setSkinIndex: (index: number) => void;
  toggleWireframe: () => void;
  reset: () => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  currentAnimation: null,
  availableAnimations: [],
  skinIndex: 0,
  isWireframe: false,
  setAnimation: (currentAnimation) => set({ currentAnimation }),
  setSkinIndex: (skinIndex) => set({ skinIndex }),
  toggleWireframe: () => set((state) => ({ isWireframe: !state.isWireframe })),
  reset: () =>
    set({
      currentAnimation: null,
      availableAnimations: [],
      skinIndex: 0,
      isWireframe: false,
    }),
}));
