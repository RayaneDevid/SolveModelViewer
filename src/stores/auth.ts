import { create } from 'zustand';
import type { Profile } from '@/api/auth';

interface AuthState {
  user: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  setUser: (user: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  isLoading: true,
  setUser: (user) => set({ user, isAdmin: user?.is_admin ?? false, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAdmin: false, isLoading: false }),
}));
