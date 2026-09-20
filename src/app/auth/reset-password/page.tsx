"use client";

import React from 'react';
import { ShieldCheck, ArrowRight, Home } from 'lucide-react';
import { useAuthStore } from '../../../features/auth/store/authStore';

export default function ResetPasswordPage() {
  const setShowAuthModal = useAuthStore((state) => state.setShowAuthModal);

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-[#262626] bg-[#0F0F0F] p-8 space-y-6 text-center">
        <div className="w-14 h-14 mx-auto bg-[#FF3D00]/10 border border-[#FF3D00]/30 flex items-center justify-center text-[#FF3D00]">
          <ShieldCheck className="w-7 h-7" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-xl font-black uppercase text-white font-sans">
            Passwordless Account
          </h1>
          <p className="text-xs font-mono text-[#737373] leading-relaxed">
            Malaz Scans utilizes 1-click Google and GitHub OAuth authentication for maximum security. You do not need to memorize or reset a password.
          </p>
        </div>

        <div className="space-y-3 pt-2 font-mono text-xs">
          <button
            onClick={() => {
              window.location.href = '/api/auth/google';
            }}
            className="w-full bg-[#FF3D00] text-[#0A0A0A] font-black py-3 uppercase hover:bg-white transition-colors cursor-pointer border-none flex items-center justify-center gap-2"
          >
            <span>Sign In with Google</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              window.location.href = '/api/auth/github';
            }}
            className="w-full bg-[#181818] border border-[#262626] text-white hover:border-white font-bold py-3 uppercase transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Sign In with GitHub</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-[#737373] hover:text-[#FF3D00] transition-colors pt-2 text-[11px] uppercase font-bold"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Homepage</span>
          </a>
        </div>
      </div>
    </main>
  );
}
