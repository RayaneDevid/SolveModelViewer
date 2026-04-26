import { create } from 'zustand';

export interface SkinOption {
  name: string;
  color: string;
  uuid: string;
}

interface ViewerState {
  currentAnimation: string | null;
  availableAnimations: string[];
  availableSkins: SkinOption[];
  skinIndex: number | null;
  isWireframe: boolean;
  setAnimation: (name: string | null) => void;
  setSkinIndex: (index: number | null) => void;
  toggleWireframe: () => void;
  reset: () => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  currentAnimation: null,
  availableAnimations: [],
  availableSkins: [],
  skinIndex: null,
  isWireframe: false,
  setAnimation: (currentAnimation) => set({ currentAnimation }),
  setSkinIndex: (skinIndex) => set({ skinIndex }),
  toggleWireframe: () => set((state) => ({ isWireframe: !state.isWireframe })),
  reset: () =>
    set({
      currentAnimation: null,
      availableAnimations: [],
      availableSkins: [],
      skinIndex: null,
      isWireframe: false,
    }),
}));
