import { useAuthStore } from '../store/authStore';
import { useNovelStore } from '../../novels/store/novelStore';
import { useCoinStore } from '../../coins/store/coinStore';
import { isAdmin } from '../../../types/auth';

export const useAuth = () => {
  const { currentUser, showAuthModal, setCurrentUser, setShowAuthModal, logout: storeLogout } = useAuthStore();
  const triggerToast = useNovelStore((state) => state.triggerToast);

  /**
   * Dev Login simulation for local testing without OAuth provider setup
   */
  const devLogin = async (role: 'user' | 'admin' = 'user'): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        triggerToast(data.error || 'Failed to sign in via dev mode');
        return false;
      }

      setCurrentUser({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        avatar: data.user.avatar,
        role: data.user.role,
      });

      if (typeof data.user.coins === 'number') {
        useCoinStore.getState().setCoins(data.user.coins);
      }

      const greeting = isAdmin(data.user)
        ? 'Sign in successful: Admin Mode Active'
        : `Welcome back, ${data.user.username}!`;
      
      triggerToast(greeting);
      setShowAuthModal(null);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error occurred';
      triggerToast(msg);
      return false;
    }
  };

  const logout = async () => {
    await storeLogout();
    triggerToast('Successfully signed out.');
  };

  return {
    currentUser,
    showAuthModal,
    setShowAuthModal,
    devLogin,
    logout,
  };
};

export default useAuth;
