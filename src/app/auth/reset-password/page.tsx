"use client";

import React, { useState, useEffect } from 'react';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Supabase handles the token exchange automatically via the URL hash
  useEffect(() => {
    const supabase = createClient();
    // Listen for auth state change (Supabase processes the recovery token from URL)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User landed here from the reset email — ready to set new password
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
    }

    setIsLoading(false);
  };

  if (success) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="w-full max-w-md border border-[#262626] bg-[#0F0F0F] p-8 space-y-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <h1 className="text-xl font-black uppercase text-white">Password Updated</h1>
          <p className="text-xs font-mono text-[#737373]">Your password has been changed successfully. You can now log in with your new password.</p>
          <a
            href="/"
            className="inline-block bg-[#FF3D00] text-[#0A0A0A] font-mono font-black py-3 px-6 text-xs uppercase hover:bg-white transition-colors"
          >
            Go to Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-[#262626] bg-[#0F0F0F] p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-black uppercase text-white font-sans">Set New Password</h1>
          <p className="text-[10px] font-mono text-[#737373]">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-[#737373] font-bold">NEW PASSWORD</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#737373] absolute left-3 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full bg-[#151515] border border-[#262626] py-3 pl-10 pr-4 text-xs font-mono text-white focus:border-[#FF3D00] focus:outline-none rounded-none"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-[#737373] font-bold">CONFIRM PASSWORD</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#737373] absolute left-3 top-3.5" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="w-full bg-[#151515] border border-[#262626] py-3 pl-10 pr-4 text-xs font-mono text-white focus:border-[#FF3D00] focus:outline-none rounded-none"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <p className="text-[10px] font-mono text-[#FF3D00] bg-[#FF3D00]/10 border border-[#FF3D00]/20 px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FF3D00] text-[#0A0A0A] font-mono font-black py-3 text-xs uppercase hover:bg-white transition-colors cursor-pointer border-none rounded-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
          </button>
        </form>
      </div>
    </main>
  );
}
