import { create } from 'zustand';
import { User } from '../../../types';
import { SupabaseAuthRepository } from '../../../repositories/supabase';

const supabaseAuth = new SupabaseAuthRepository();

interface AuthState {
  currentUser: User | null;
  showAuthModal: 'login' | 'register' | 'forgot' | null;
  setCurrentUser: (user: User | null) => void;
  setShowAuthModal: (modal: 'login' | 'register' | 'forgot' | null) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  showAuthModal: null,
  setCurrentUser: (user) => {
    set({ currentUser: user });
  },
  setShowAuthModal: (modal) => set({ showAuthModal: modal }),
  logout: () => {
    supabaseAuth.logoutAsync();
    set({ currentUser: null });
  },
  initializeAuth: () => {
    // Restore session from Supabase (async — sets state when resolved)
    supabaseAuth.getSessionAsync().then((authUser) => {
      if (authUser) {
        set({
          currentUser: {
            username: authUser.username,
            email: authUser.email,
            avatar: authUser.avatar,
          }
        });
      }
    }).catch(() => {
      // No session — stay logged out
    });
  }
}));

export default useAuthStore;
