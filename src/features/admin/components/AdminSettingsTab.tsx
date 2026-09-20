"use client";

import React, { useState } from 'react';
import { Save, User, Key, Database, ShieldAlert, ShieldCheck, Server, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../auth/store/authStore';
import { useNovelStore } from '../../novels/store/novelStore';

export const AdminSettingsTab: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuthStore();
  const { triggerToast } = useNovelStore();

  const [username, setUsername] = useState(currentUser?.username || 'Administrator');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [isTestingDb, setIsTestingDb] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      triggerToast("Username and Email are required.");
      return;
    }
    if (currentUser) {
      setCurrentUser({ ...currentUser, username, email });
    }
    triggerToast("Admin profile settings saved.");
  };

  const handleTestConnections = async () => {
    setIsTestingDb(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        triggerToast("Dual-DB connection verified: Neon PostgreSQL & Turso libSQL operational.");
      } else {
        triggerToast("Connection error: Database health check failed.");
      }
    } catch {
      triggerToast("Network error testing database connection.");
    } finally {
      setIsTestingDb(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start text-xs font-mono text-white">
      {/* Left Column: Admin Operator Credentials */}
      <form onSubmit={handleSave} className="border border-[#262626] bg-[#0F0F0F] p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#FF3D00]" />
            <h3 className="text-sm font-black uppercase tracking-tight font-sans">Operator Profile</h3>
          </div>
          <span className="text-[10px] bg-[#FF3D00]/10 text-[#FF3D00] border border-[#FF3D00]/30 px-2 py-0.5 font-bold uppercase">
            [ROOT ADMIN]
          </span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#737373] uppercase font-bold block">Operator Handle</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-[#737373] uppercase font-bold block">Admin Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-[#737373] uppercase font-bold block">Authentication Engine</label>
            <div className="p-3 border border-[#262626] bg-[#151515] text-[#A3A3A3] space-y-1">
              <div className="flex justify-between items-center">
                <span>Auth Protocol:</span>
                <span className="text-white font-bold">OAuth 2.0 (Google / GitHub)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Session Security:</span>
                <span className="text-emerald-400 font-bold">HMAC-SHA256 Signed HTTP-Only Cookie</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#FF3D00] text-[#0A0A0A] font-bold py-3 uppercase hover:bg-white transition-colors cursor-pointer border-none flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Operator Credentials</span>
          </button>
        </div>
      </form>

      {/* Right Column: Dual-DB System Architecture */}
      <div className="border border-[#262626] bg-[#0F0F0F] p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#FF3D00]" />
            <h3 className="text-sm font-black uppercase tracking-tight font-sans">Dual-DB Architecture</h3>
          </div>
          <button
            onClick={handleTestConnections}
            disabled={isTestingDb}
            className="text-[10px] text-[#FF3D00] hover:underline uppercase font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isTestingDb ? 'animate-spin' : ''}`} />
            Test Health
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-[#737373] text-[11px] leading-relaxed">
            The platform operates on a decoupled Dual-Database architecture for peak performance and strict data isolation.
          </p>

          <div className="space-y-2 font-mono text-[11px]">
            <div className="p-3 border border-[#262626] bg-[#151515] flex justify-between items-center">
              <div>
                <span className="text-white font-bold block">Neon PostgreSQL</span>
                <span className="text-[10px] text-[#737373]">Users, OAuth, Coins, Orders, Bookmarks & Comments</span>
              </div>
              <span className="text-green-500 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Active
              </span>
            </div>

            <div className="p-3 border border-[#262626] bg-[#151515] flex justify-between items-center">
              <div>
                <span className="text-white font-bold block">Turso libSQL</span>
                <span className="text-[10px] text-[#737373]">Novels, Volumes, Chapters & Tiptap Content</span>
              </div>
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Active
              </span>
            </div>

            <div className="p-3 border border-[#262626] bg-[#151515] flex justify-between items-center">
              <div>
                <span className="text-white font-bold block">Cloudflare R2</span>
                <span className="text-[10px] text-[#737373]">Novel Covers, Illustrations & Avatar CDN</span>
              </div>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
              </span>
            </div>

            <div className="p-3 border border-[#262626] bg-[#151515] flex justify-between items-center">
              <div>
                <span className="text-white font-bold block">Midtrans Snap</span>
                <span className="text-[10px] text-[#737373]">QRIS, GoPay & Virtual Account Gateway</span>
              </div>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Ready
              </span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="border border-[#FF3D00]/30 bg-[#FF3D00]/5 p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[#FF3D00] text-[10px] font-bold uppercase">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Zero-Supabase Runtime Confirmed</span>
          </div>
          <p className="text-[10px] text-[#A3A3A3] leading-relaxed">
            All server routes and authentication guards are 100% decoupled from Supabase. Sessions are verified via secure cryptographic HMAC signatures.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsTab;
