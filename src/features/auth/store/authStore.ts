import { create } from 'zustand';
import { User } from '../../../types';
import { useCoinStore } from '../../coins/store/coinStore';

interface AuthState {
  currentUser: User | null;
  showAuthModal: 'login' | 'register' | 'forgot' | null;
  setCurrentUser: (user: User | null) => void;
  setShowAuthModal: (modal: 'login' | 'register' | 'forgot' | null) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  showAuthModal: null,
  setCurrentUser: (user) => {
    set({ currentUser: user });
  },
  setShowAuthModal: (modal) => set({ showAuthModal: modal }),
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    set({ currentUser: null });
  },
  initializeAuth: async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) return;

      const data = await res.json();
      if (data.user) {
        set({
          currentUser: {
            id: data.user.id,
            username: data.user.username,
            email: data.user.email,
            avatar: data.user.avatar,
            role: data.user.role,
            provider: data.user.provider || null,
            createdAt: data.user.createdAt,
          },
        });

        // Sync coin balance & unlocked chapters with Neon DB
        if (typeof data.user.coins === 'number') {
          useCoinStore.getState().setCoins(data.user.coins);
        }
        useCoinStore.getState().syncUnlockedChapters();

        // Sync bookmarks & reading history with Neon DB
        import('../../library/store/libraryStore').then(({ useLibraryStore }) => {
          useLibraryStore.getState().syncWithCloud();
        });
      }
    } catch {
      // Failed to reach server or no session — stay logged out
    }
  },
}));

export default useAuthStore;
