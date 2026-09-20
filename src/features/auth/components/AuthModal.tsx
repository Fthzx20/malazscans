'use client';

import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, devLogin } = useAuth();

  const [loadingProvider, setLoadingProvider] = useState<'google' | 'github' | 'dev' | null>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);

  const handleClose = React.useCallback(() => {
    setShowAuthModal(null);
    setLoadingProvider(null);
  }, [setShowAuthModal]);

  // Lock body scroll, handle Escape key, and trap focus
  useEffect(() => {
    if (!showAuthModal) return;

    const previousActive = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    // Focus the first interactive element
    const getFocusableElements = (): HTMLElement[] => {
      if (!modalRef.current) return [];
      return Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    const focusables = getFocusableElements();
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      if (e.key === 'Tab') {
        const elements = getFocusableElements();
        if (elements.length === 0) return;

        const firstElement = elements[0];
        const lastElement = elements[elements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      previousActive?.focus();
    };
  }, [showAuthModal, handleClose]);

  if (!showAuthModal) return null;

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    setLoadingProvider(provider);
    const returnTo = window.location.pathname;
    window.location.href = `/api/auth/${provider}?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const handleDevLogin = async (role: 'user' | 'admin') => {
    setLoadingProvider('dev');
    await devLogin(role);
    setLoadingProvider(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
      aria-hidden="false"
    >
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-desc"
        aria-busy={loadingProvider !== null}
        className="relative w-full max-w-md bg-[#0F0F11] border border-zinc-800 shadow-2xl shadow-black/80 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-[#141416]">
          <div className="space-y-0.5">
            <h2 id="auth-modal-title" className="text-sm font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
              Sign In <span className="text-xs px-2 py-0.5 bg-[#FF3D00] text-black font-extrabold">MALAZ</span>
            </h2>
            <p id="auth-modal-desc" className="text-[11px] text-zinc-400 font-mono">
              Secure 1-Click login via Google &amp; GitHub
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors border-none bg-transparent cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Security Banner */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-[11px] font-mono text-zinc-400 leading-tight">
              <span className="text-zinc-200 font-bold block">Passwordless &amp; Secure</span>
              Safe 1-click authentication without passwords using modern session encryption.
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            {/* Google OAuth Button */}
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={loadingProvider !== null}
              className="w-full py-3.5 px-4 bg-white hover:bg-zinc-100 text-zinc-900 font-bold font-mono text-xs flex items-center justify-center gap-3 border border-zinc-300 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {loadingProvider === 'google' ? (
                <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* GitHub OAuth Button */}
            <button
              onClick={() => handleOAuthLogin('github')}
              disabled={loadingProvider !== null}
              className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold font-mono text-xs flex items-center justify-center gap-3 border border-zinc-700 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {loadingProvider === 'github' ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              )}
              <span>Continue with GitHub</span>
            </button>
          </div>

          {/* Dev Mode Shortcut (Convenience for testing without OAuth keys, development only) */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold">
                  Local Testing (Dev Mode)
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  0 Starting Coins
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDevLogin('user')}
                  disabled={loadingProvider !== null}
                  className="py-2 px-3 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-mono text-[11px] border border-zinc-800 hover:border-zinc-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Sign in as Reader</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDevLogin('admin')}
                  disabled={loadingProvider !== null}
                  className="py-2 px-3 bg-zinc-950 hover:bg-zinc-800 text-[#FF3D00] font-mono text-[11px] border border-zinc-800 hover:border-[#FF3D00]/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                >
                  <span>Sign in as Admin</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-[#121214] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span>HTTP-Only Session Encryption</span>
          <span className="text-zinc-400">Google &amp; GitHub OAuth</span>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
