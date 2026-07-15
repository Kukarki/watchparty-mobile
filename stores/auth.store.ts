import { create } from 'zustand';
import { User } from '@/types';
import { getStoredUser, clearSession } from '@/services/auth';
import { socketService } from '@/services/socket';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  loadStoredUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),

  loadStoredUser: async () => {
    try {
      const user = await getStoredUser();
      set({ user, isAuthenticated: !!user, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    socketService.disconnect();
    await clearSession();
    set({ user: null, isAuthenticated: false });
  },
}));
