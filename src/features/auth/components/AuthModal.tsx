import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Mail, Lock, User, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNovelStore } from '../../novels/store/novelStore';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';
import { loginSchema, registerSchema, LoginInput, RegisterInput } from '../types';

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, login, register } = useAuth();
  const triggerToast = useNovelStore((state) => state.triggerToast);

  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);
  
  // Local state for Forgot Password email input
  const [forgotEmail, setForgotEmail] = useState('');

  // Prevent background scrolling when modal is active
  useEffect(() => {
    if (showAuthModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAuthModal]);

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLoginForm
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const {
    register: registerReg,
    handleSubmit: handleRegSubmit,
    formState: { errors: regErrors },
    reset: resetRegForm
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '' }
  });

  if (!showAuthModal) return null;

  const handleClose = () => {
    setShowAuthModal(null);
    resetLoginForm();
    resetRegForm();
    setForgotEmail('');
  };

  const onLoginSubmit = async (data: LoginInput) => {
    await login(data.email, data.password);
  };

  const onRegSubmit = async (data: RegisterInput) => {
    const success = await register(data.username, data.email, data.password);
    if (success) {
      resetRegForm();
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      triggerToast("Email address is required.");
      return;
    }
    triggerToast("Password reset link sent to your email.");
    setForgotEmail('');
    setShowAuthModal('login');
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`w-full max-w-md ${themeStyles.cardBg} border ${themeStyles.border} p-6 sm:p-8 space-y-6 relative text-current shadow-2xl`}>
        
        {/* Close Button */}
        <button 
          onClick={handleClose} 
          className={`absolute top-4 right-4 ${themeStyles.accentText} hover:text-[#FF3D00] transition-colors bg-transparent border-none cursor-pointer p-1`}
        >
          <X className="w-5 h-5" />
        </button>

        {showAuthModal === 'login' && (
          <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl font-black font-sans tracking-tight text-current uppercase font-bold">LOG IN TO MALAZ TL</h3>
              <p className={`text-[10px] font-mono ${themeStyles.accentText}`}>
                Enter your credentials below to log in.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className={`text-[10px] font-mono uppercase ${themeStyles.accentText} font-bold`}>EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className={`w-4 h-4 ${themeStyles.accentText} absolute left-3 top-3.5`} />
                  <input 
                    type="email" 
                    placeholder="example@domain.com"
                    className={`w-full ${themeStyles.bg} border ${themeStyles.border} py-3 pl-10 pr-4 text-xs font-mono focus:border-[#FF3D00] focus:outline-none text-current rounded-none`}
                    {...registerLogin('email')}
                  />
                </div>
                {loginErrors.email && (
                  <p className="text-[10px] font-mono text-[#FF3D00]">{loginErrors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className={`text-[10px] font-mono uppercase ${themeStyles.accentText} font-bold`}>PASSWORD</label>
                  <button
                    type="button"
                    onClick={() => setShowAuthModal('forgot')}
                    className="text-[10px] font-mono text-[#FF3D00] hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className={`w-4 h-4 ${themeStyles.accentText} absolute left-3 top-3.5`} />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className={`w-full ${themeStyles.bg} border ${themeStyles.border} py-3 pl-10 pr-4 text-xs font-mono focus:border-[#FF3D00] focus:outline-none text-current rounded-none`}
                    {...registerLogin('password')}
                  />
                </div>
                {loginErrors.password && (
                  <p className="text-[10px] font-mono text-[#FF3D00]">{loginErrors.password.message}</p>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#FF3D00] text-[#0A0A0A] font-mono font-black py-3 text-xs uppercase hover:bg-white transition-colors cursor-pointer border-none rounded-none"
            >
              Log In
            </button>

            <p className={`text-center text-xs ${themeStyles.accentText}`}>
              Don&apos;t have an account?{' '}
              <button 
                type="button" 
                onClick={() => {
                  setShowAuthModal('register');
                  resetLoginForm();
                }} 
                className="text-[#FF3D00] hover:underline font-bold bg-transparent border-none cursor-pointer"
              >
                Register Now
              </button>
            </p>
          </form>
        )}

        {showAuthModal === 'register' && (
          <form onSubmit={handleRegSubmit(onRegSubmit)} className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl font-black font-sans tracking-tight text-current uppercase font-bold">CREATE NEW ACCOUNT</h3>
              <p className={`text-[10px] font-mono ${themeStyles.accentText}`}>
                Enjoy verified comment badges and bookshelf bookmarks syncs.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className={`text-[10px] font-mono uppercase ${themeStyles.accentText} font-bold`}>USERNAME / ALIAS</label>
                <div className="relative">
                  <User className={`w-4 h-4 ${themeStyles.accentText} absolute left-3 top-3.5`} />
                  <input 
                    type="text" 
                    placeholder="kultur_reader"
                    className={`w-full ${themeStyles.bg} border ${themeStyles.border} py-3 pl-10 pr-4 text-xs font-mono focus:border-[#FF3D00] focus:outline-none text-current rounded-none`}
                    {...registerReg('username')}
                  />
                </div>
                {regErrors.username && (
                  <p className="text-[10px] font-mono text-[#FF3D00]">{regErrors.username.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className={`text-[10px] font-mono uppercase ${themeStyles.accentText} font-bold`}>EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className={`w-4 h-4 ${themeStyles.accentText} absolute left-3 top-3.5`} />
                  <input 
                    type="email" 
                    placeholder="example@domain.com"
                    className={`w-full ${themeStyles.bg} border ${themeStyles.border} py-3 pl-10 pr-4 text-xs font-mono focus:border-[#FF3D00] focus:outline-none text-current rounded-none`}
                    {...registerReg('email')}
                  />
                </div>
                {regErrors.email && (
                  <p className="text-[10px] font-mono text-[#FF3D00]">{regErrors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className={`text-[10px] font-mono uppercase ${themeStyles.accentText} font-bold`}>PASSWORD</label>
                <div className="relative">
                  <Lock className={`w-4 h-4 ${themeStyles.accentText} absolute left-3 top-3.5`} />
                  <input 
                    type="password" 
                    placeholder="Create a strong password"
                    className={`w-full ${themeStyles.bg} border ${themeStyles.border} py-3 pl-10 pr-4 text-xs font-mono focus:border-[#FF3D00] focus:outline-none text-current rounded-none`}
                    {...registerReg('password')}
                  />
                </div>
                {regErrors.password && (
                  <p className="text-[10px] font-mono text-[#FF3D00]">{regErrors.password.message}</p>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#FF3D00] text-[#0A0A0A] font-mono font-black py-3 text-xs uppercase hover:bg-white transition-colors cursor-pointer border-none rounded-none"
            >
              Register Account
            </button>

            <p className={`text-center text-xs ${themeStyles.accentText}`}>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => {
                  setShowAuthModal('login');
                  resetRegForm();
                }} 
                className="text-[#FF3D00] hover:underline font-bold bg-transparent border-none cursor-pointer"
              >
                Log In
              </button>
            </p>
          </form>
        )}

        {showAuthModal === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl font-black font-sans tracking-tight text-current uppercase font-bold">RESET PASSWORD</h3>
              <p className={`text-[10px] font-mono ${themeStyles.accentText}`}>
                Enter your registered email and we will send you a password reset link.
              </p>
            </div>

            <div className="space-y-1">
              <label className={`text-[10px] font-mono uppercase ${themeStyles.accentText} font-bold`}>EMAIL ADDRESS</label>
              <div className="relative">
                <Mail className={`w-4 h-4 ${themeStyles.accentText} absolute left-3 top-3.5`} />
                <input 
                  type="email" 
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="example@domain.com"
                  className={`w-full ${themeStyles.bg} border ${themeStyles.border} py-3 pl-10 pr-4 text-xs font-mono focus:border-[#FF3D00] focus:outline-none text-current rounded-none`}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#FF3D00] text-[#0A0A0A] font-mono font-black py-3 text-xs uppercase hover:bg-white transition-colors cursor-pointer border-none rounded-none flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-4 h-4" />
              <span>Send Reset Link</span>
            </button>

            <p className={`text-center text-xs ${themeStyles.accentText}`}>
              Back to{' '}
              <button 
                type="button" 
                onClick={() => setShowAuthModal('login')} 
                className="text-[#FF3D00] hover:underline font-bold bg-transparent border-none cursor-pointer"
              >
                Log In
              </button>
            </p>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthModal;

