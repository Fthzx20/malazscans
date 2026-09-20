"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  User as UserIcon, Shield, ShieldCheck, Coins, BookOpen, 
  Bookmark, History, LogOut, Settings, ExternalLink, 
  Upload, Check, AlertCircle, Sparkles, Lock
} from 'lucide-react';
import { useAuthStore } from '../../auth/store/authStore';
import { useNovelStore } from '../../novels/store/novelStore';
import { useLibraryStore } from '../../library/store/libraryStore';
import { useCoinStore } from '../../coins/store/coinStore';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';
import { isAdmin } from '../../../types/auth';

interface UnlockedItem {
  id: string;
  novelId: string;
  chapterId: string;
  cost: number;
  unlockedAt: string;
  chapterTitle?: string;
  novelTitle?: string;
}

export const ProfilePage: React.FC = () => {
  const { currentUser, setCurrentUser, logout } = useAuthStore();
  const { setCurrentPage, triggerToast, novels, setSelectedNovel } = useNovelStore();
  const { bookmarks, history } = useLibraryStore();
  const { userCoins, openWallet } = useCoinStore();
  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  const [username, setUsername] = useState(currentUser?.username || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [unlockedChapters, setUnlockedChapters] = useState<UnlockedItem[]>([]);
  const [loadingUnlocked, setLoadingUnlocked] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username);
      setAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  // Fetch unlocked chapters from Neon DB
  useEffect(() => {
    if (!currentUser) return;
    setLoadingUnlocked(true);
    fetch('/api/coins/unlocked')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: UnlockedItem[]) => {
        // Enrich with novel & chapter titles
        const enriched = data.map((item) => {
          const novel = novels.find((n) => n.id === item.novelId);
          let chapterTitle = item.chapterId;
          if (novel) {
            novel.volumes?.forEach((v) => {
              const chap = v.chapters.find((c) => c.id === item.chapterId);
              if (chap) chapterTitle = chap.title;
            });
          }
          return {
            ...item,
            novelTitle: novel?.title || item.novelId,
            chapterTitle,
          };
        });
        setUnlockedChapters(enriched);
      })
      .catch(() => setUnlockedChapters([]))
      .finally(() => setLoadingUnlocked(false));
  }, [currentUser, novels]);

  const handleSaveUsername = async () => {
    if (!username.trim() || username.trim().length < 2) {
      triggerToast('Username must be at least 2 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        triggerToast(err.error || 'Failed to update username.');
        return;
      }

      if (currentUser) {
        setCurrentUser({ ...currentUser, username: username.trim() });
      }
      setIsEditingUsername(false);
      triggerToast('Username updated successfully.');
    } catch {
      triggerToast('Network error while updating username.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      triggerToast('Image size exceeds 2MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      let newAvatarUrl = '';
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        newAvatarUrl = uploadData.url;
      } else {
        // Fallback to base64
        const reader = new FileReader();
        newAvatarUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      // Save to profile
      const patchRes = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: newAvatarUrl }),
      });

      if (patchRes.ok) {
        setAvatar(newAvatarUrl);
        if (currentUser) setCurrentUser({ ...currentUser, avatar: newAvatarUrl });
        triggerToast('Profile avatar updated successfully.');
      }
    } catch {
      triggerToast('Failed to upload profile avatar.');
    }
  };

  const handleReadChapter = (novelId: string) => {
    const novel = novels.find((n) => n.id === novelId);
    if (novel) {
      setSelectedNovel(novel);
      setCurrentPage('detail');
    }
  };

  if (!currentUser) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center space-y-6">
        <div className="border border-[#262626] bg-[#0F0F11] p-8 max-w-md mx-auto space-y-4">
          <UserIcon className="w-12 h-12 text-[#FF3D00] mx-auto opacity-70" />
          <h2 className="text-xl font-black uppercase tracking-tight text-white font-mono">Sign In Required</h2>
          <p className="text-xs text-[#737373] font-mono leading-relaxed">
            Please sign in with Google or GitHub to view your Reader Pass, synchronize reading history, and manage unlocked chapters.
          </p>
          <button
            onClick={() => useAuthStore.getState().setShowAuthModal('login')}
            className="w-full bg-[#FF3D00] text-[#0A0A0A] font-bold font-mono py-3 uppercase hover:bg-white transition-colors cursor-pointer border-none"
          >
            Sign In Now
          </button>
        </div>
      </main>
    );
  }

  const provider = currentUser.provider || 'local';
  const isUserAdmin = isAdmin(currentUser);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 sm:space-y-8 font-mono text-current">
      {/* ─── Reader Pass ID Card Header ─── */}
      <div className={`border ${themeStyles.border} ${themeStyles.cardBg} relative overflow-hidden shadow-2xl shadow-black/60`}>
        {/* Top Cyberpunk Accent Bar */}
        <div className="bg-gradient-to-r from-[#FF3D00] via-[#FF6A00] to-[#FF3D00] h-1.5 w-full" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Card Top Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#737373]">
                  MALAZ READER PASS // ID: {currentUser.id?.slice(0, 13) || 'GUEST-001'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-sans mt-0.5">
                {currentUser.username}
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Role Badge */}
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                isUserAdmin 
                  ? 'bg-[#FF3D00]/10 text-[#FF3D00] border-[#FF3D00]/40' 
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}>
                {isUserAdmin ? '[ADMIN / OPERATOR]' : '[AUTHENTICATED READER]'}
              </span>

              {/* Provider Badge */}
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center gap-1.5">
                {provider === 'google' && (
                  <>
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Google
                  </>
                )}
                {provider === 'github' && (
                  <>
                    <svg className="w-3 h-3 fill-current text-white" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                    </svg>
                    GitHub
                  </>
                )}
                {provider === 'local' && 'Dev Mode'}
              </span>
            </div>
          </div>

          {/* Profile Identity Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Avatar & Upload */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 border-2 border-[#262626] bg-[#151515] flex-shrink-0 overflow-hidden flex items-center justify-center group">
                {avatar ? (
                  <img src={avatar} alt={username} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-[#737373]" />
                )}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white"
                  title="Upload custom avatar"
                >
                  <Upload className="w-5 h-5 text-[#FF3D00] mb-1" />
                  <span className="text-[9px] uppercase font-bold">Change</span>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] text-[#FF3D00] hover:underline uppercase font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
                >
                  <Upload className="w-3 h-3" /> Upload Avatar
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                />
                <span className="text-[9px] text-[#737373] block">JPG, PNG, or WEBP (Max 2MB)</span>
              </div>
            </div>

            {/* Account Details & Username Editor */}
            <div className="md:col-span-2 space-y-3">
              {/* Username row */}
              <div className="space-y-1">
                <label className="text-[9px] text-[#737373] uppercase font-bold block">Username</label>
                {isEditingUsername ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-[#151515] border border-[#FF3D00] px-3 py-1.5 text-xs text-white focus:outline-none flex-grow"
                      placeholder="Enter new username"
                    />
                    <button
                      onClick={handleSaveUsername}
                      disabled={isSaving}
                      className="bg-[#FF3D00] text-[#0A0A0A] font-bold px-3 py-1.5 uppercase text-xs hover:bg-white transition-colors cursor-pointer border-none flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                    <button
                      onClick={() => { setUsername(currentUser.username); setIsEditingUsername(false); }}
                      className="border border-[#262626] text-[#737373] hover:text-white px-3 py-1.5 uppercase text-xs bg-transparent cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{currentUser.username}</span>
                    <button
                      onClick={() => setIsEditingUsername(true)}
                      className="text-[10px] text-[#737373] hover:text-[#FF3D00] underline uppercase cursor-pointer bg-transparent border-none"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Email row (Read-Only) */}
              <div className="space-y-1">
                <label className="text-[9px] text-[#737373] uppercase font-bold block">Email Address</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-300">{currentUser.email}</span>
                  <span className="bg-green-500/10 text-green-400 border border-green-500/30 text-[9px] px-1.5 py-0.5 font-bold uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-green-400" /> Verified via {provider}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Reader Stats Grid ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className={`border ${themeStyles.border} ${themeStyles.cardBg} p-4 space-y-1`}>
          <div className="flex items-center justify-between text-[#737373]">
            <span className="text-[9px] uppercase font-bold">Chapters Read</span>
            <History className="w-4 h-4 text-[#FF3D00]" />
          </div>
          <p className="text-2xl font-black text-white">{history.length}</p>
          <span className="text-[9px] text-[#737373] block">Recorded in reading history</span>
        </div>

        <div className={`border ${themeStyles.border} ${themeStyles.cardBg} p-4 space-y-1`}>
          <div className="flex items-center justify-between text-[#737373]">
            <span className="text-[9px] uppercase font-bold">Bookmarked</span>
            <Bookmark className="w-4 h-4 text-[#FF3D00]" />
          </div>
          <p className="text-2xl font-black text-white">{bookmarks.length}</p>
          <span className="text-[9px] text-[#737373] block">Novels in bookshelf</span>
        </div>

        <div className={`border ${themeStyles.border} ${themeStyles.cardBg} p-4 space-y-1`}>
          <div className="flex items-center justify-between text-[#737373]">
            <span className="text-[9px] uppercase font-bold">Coin Balance</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{userCoins.toLocaleString()}</p>
          <button
            onClick={() => openWallet()}
            className="text-[9px] text-[#FF3D00] hover:underline uppercase font-bold block bg-transparent border-none cursor-pointer p-0 text-left"
          >
            + Top Up Coins
          </button>
        </div>

        <div className={`border ${themeStyles.border} ${themeStyles.cardBg} p-4 space-y-1`}>
          <div className="flex items-center justify-between text-[#737373]">
            <span className="text-[9px] uppercase font-bold">Unlocked Chapters</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{unlockedChapters.length}</p>
          <span className="text-[9px] text-[#737373] block">Paid chapters owned</span>
        </div>
      </div>

      {/* ─── Unlocked Chapters History ─── */}
      <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-5 sm:p-6 space-y-4`}>
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-black uppercase tracking-tight text-white">Unlocked Chapters Library</h3>
          </div>
          <span className="text-[10px] text-[#737373] font-bold uppercase">
            {unlockedChapters.length} Total Owned
          </span>
        </div>

        {loadingUnlocked ? (
          <div className="py-6 text-center text-xs text-[#737373] animate-pulse">
            Loading unlocked chapters from database...
          </div>
        ) : unlockedChapters.length > 0 ? (
          <div className="divide-y divide-[#262626]/40 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[#737373] uppercase text-[10px] pb-2">
                  <th className="pb-2">Novel</th>
                  <th className="pb-2">Chapter</th>
                  <th className="pb-2 text-center">Cost</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]/30">
                {unlockedChapters.map((item) => (
                  <tr key={item.id} className="hover:bg-[#151515] transition-colors">
                    <td className="py-3 font-bold text-white">{item.novelTitle}</td>
                    <td className="py-3 text-zinc-400">{item.chapterTitle}</td>
                    <td className="py-3 text-center text-amber-400 font-bold">{item.cost} Coins</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleReadChapter(item.novelId)}
                        className="text-[10px] font-bold text-[#FF3D00] hover:underline uppercase bg-transparent border-none cursor-pointer"
                      >
                        Read Now →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center space-y-2 text-[#737373]">
            <Lock className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs">No unlocked chapters yet.</p>
            <p className="text-[10px]">When you unlock premium chapters using coins, they will appear here for instant re-reading.</p>
          </div>
        )}
      </section>

      {/* ─── Quick Actions & Security Bar ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setCurrentPage('library')}
          className="flex items-center justify-center gap-2 p-3.5 border border-[#262626] hover:border-white bg-[#0F0F11] text-xs font-bold uppercase transition-colors cursor-pointer text-white"
        >
          <BookOpen className="w-4 h-4 text-[#FF3D00]" />
          <span>Go to Bookshelf</span>
        </button>

        <button
          onClick={() => setCurrentPage('settings')}
          className="flex items-center justify-center gap-2 p-3.5 border border-[#262626] hover:border-white bg-[#0F0F11] text-xs font-bold uppercase transition-colors cursor-pointer text-white"
        >
          <Settings className="w-4 h-4 text-[#FF3D00]" />
          <span>Reading Settings</span>
        </button>

        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 p-3.5 border border-red-900/40 hover:border-red-500 bg-red-950/20 hover:bg-red-950/40 text-xs font-bold uppercase transition-colors cursor-pointer text-red-400"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </main>
  );
};

export default ProfilePage;
