import { useAuthStore } from '../store/authStore';
import { useNovelStore } from '../../novels/store/novelStore';
import { SupabaseAuthRepository } from '../../../repositories/supabase';
import { isAdmin } from '../../../types/auth';

// Direct access to the Supabase auth repository for async methods
const supabaseAuth = new SupabaseAuthRepository();

export const useAuth = () => {
  const { currentUser, showAuthModal, setCurrentUser, setShowAuthModal, logout: storeLogout } = useAuthStore();
  const triggerToast = useNovelStore((state) => state.triggerToast);

  const login = async (email: string, password: string): Promise<boolean> => {
    const result = await supabaseAuth.loginAsync({ email, password });

    if (result.success && result.user) {
      setCurrentUser({
        username: result.user.username,
        email: result.user.email,
        avatar: result.user.avatar,
      });
      const greeting = isAdmin(result.user)
        ? "Welcome back, Admin."
        : `Hello, ${result.user.username}!`;
      triggerToast(greeting);
      setShowAuthModal(null);
      return true;
    } else {
      triggerToast(result.error || "Invalid credentials.");
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    const result = await supabaseAuth.registerAsync({ username, email, password });

    if (result.success) {
      triggerToast("Registration successful! Please log in.");
      setShowAuthModal('login');
      return true;
    } else {
      triggerToast(result.error || "Registration failed.");
      return false;
    }
  };

  const logout = async () => {
    await supabaseAuth.logoutAsync();
    storeLogout();
  };

  return {
    currentUser,
    showAuthModal,
    setShowAuthModal,
    login,
    register,
    logout
  };
};
export default useAuth;
