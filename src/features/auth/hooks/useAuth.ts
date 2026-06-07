import { useAuthStore } from '../store/authStore';
import { useNovelStore } from '../../novels/store/novelStore';
import { SupabaseAuthRepository } from '../../../repositories/supabase';
import { isAdmin } from '../../../types/auth';
import { createClient } from '../../../lib/supabase/client';

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
      triggerToast(result.error || "Invalid email or password.");
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    const result = await supabaseAuth.registerAsync({ username, email, password });

    if (result.success) {
      triggerToast("Account created! Check your email to confirm your account.");
      setShowAuthModal('login');
      return true;
    } else {
      triggerToast(result.error || "Registration failed.");
      return false;
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      triggerToast(error.message || "Failed to send reset link.");
      return false;
    }

    triggerToast("Password reset link sent! Check your email inbox.");
    return true;
  };

  const logout = async () => {
    await supabaseAuth.logoutAsync();
    storeLogout();
    triggerToast("Logged out successfully.");
  };

  return {
    currentUser,
    showAuthModal,
    setShowAuthModal,
    login,
    register,
    forgotPassword,
    logout
  };
};
export default useAuth;
