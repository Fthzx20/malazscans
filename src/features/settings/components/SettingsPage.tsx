import React, { useRef, useState } from 'react';
import { User, Sliders, Layout, Monitor, Upload, Check, Shield, Bell, EyeOff } from 'lucide-react';
import { useReaderStore } from '../../reader/store/readerStore';
import { useAuthStore } from '../../auth/store/authStore';
import { useNovelStore } from '../../novels/store/novelStore';
import { getThemeStyles } from '../../reader/utils/theme';

export const SettingsPage: React.FC = () => {
  const { readerSettings, setReaderSettings } = useReaderStore();
  const { currentUser, setCurrentUser } = useAuthStore();
  const { triggerToast, setCurrentPage } = useNovelStore();

  const themeStyles = getThemeStyles(readerSettings.theme);

  // Account Form local states
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      triggerToast("Unsupported file type. Use JPG, PNG or WEBP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      triggerToast("Image size must be less than 10MB.");
      return;
    }

    // Upload to R2 via API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'avatars');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();

      // TODO: Delete old avatar from R2 if it was an R2 URL
      setAvatar(url);
      triggerToast("Avatar uploaded successfully.");
    } catch {
      // Fallback to base64 if R2 is not configured
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setAvatar(e.target.result as string);
          triggerToast("Avatar updated (local preview).");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      triggerToast("Username and Email are required.");
      return;
    }

    const updatedUser = currentUser 
      ? { ...currentUser, username, email, avatar }
      : { username, email, avatar };
    
    setCurrentUser(updatedUser);
    triggerToast("Account settings updated successfully.");
  };

  return (
    <main className={`max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-current transition-colors duration-200`}>
      <div className="border-b border-[#262626] pb-4 space-y-1">
        <h1 className="text-3xl font-black uppercase tracking-tight">Platform Settings</h1>
        <p className="text-xs font-mono text-[#737373]">Customize your reading canvas, preferences, and account credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Side: Reader Configuration Settings */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Reader Display Styles */}
          <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-6 space-y-4`}>
            <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
              <Sliders className="w-4 h-4 text-[#FF3D00]" />
              <h3 className="text-sm font-black uppercase tracking-tight">Reader Styles</h3>
            </div>

            <div className="space-y-4 font-mono text-xs">
              {/* Font Family */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#737373] uppercase font-bold block">Font Family</label>
                <div className="flex gap-2">
                  {[
                    { key: 'font-serif', label: 'Serif (Classic Novel)' },
                    { key: 'font-sans', label: 'Sans-Serif (Modern)' },
                    { key: 'font-mono', label: 'Monospace (Technical)' }
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setReaderSettings({ fontFamily: f.key })}
                      className={`flex-1 py-2 border text-[10px] font-bold text-center cursor-pointer transition-colors bg-transparent ${
                        readerSettings.fontFamily === f.key ? 'border-[#FF3D00] text-[#FF3D00]' : 'border-[#262626] text-current'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#737373] uppercase font-bold block">Font Size</label>
                <div className="flex gap-2">
                  {[
                    { key: 'text-sm', label: 'Small' },
                    { key: 'text-base', label: 'Medium' },
                    { key: 'text-lg', label: 'Large' },
                    { key: 'text-xl', label: 'Extra Large' },
                    { key: 'text-2xl', label: 'Giant' }
                  ].map(s => (
                    <button
                      key={s.key}
                      onClick={() => setReaderSettings({ fontSize: s.key })}
                      className={`flex-1 py-2 border text-[10px] font-bold text-center cursor-pointer transition-colors bg-transparent ${
                        readerSettings.fontSize === s.key ? 'border-[#FF3D00] text-[#FF3D00]' : 'border-[#262626] text-current'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Height */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#737373] uppercase font-bold block">Line Height</label>
                <div className="flex gap-2">
                  {[
                    { key: 'leading-snug', label: 'Compact' },
                    { key: 'leading-normal', label: 'Normal' },
                    { key: 'leading-relaxed', label: 'Relaxed' },
                    { key: 'leading-loose', label: 'Spacious' }
                  ].map(l => (
                    <button
                      key={l.key}
                      onClick={() => setReaderSettings({ lineHeight: l.key })}
                      className={`flex-1 py-2 border text-[10px] font-bold text-center cursor-pointer transition-colors bg-transparent ${
                        readerSettings.lineHeight === l.key ? 'border-[#FF3D00] text-[#FF3D00]' : 'border-[#262626] text-current'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paragraph Spacing */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#737373] uppercase font-bold block">Paragraph Spacing</label>
                <div className="flex gap-2">
                  {[
                    { key: 'space-y-4', label: 'Narrow' },
                    { key: 'space-y-6', label: 'Standard' },
                    { key: 'space-y-8', label: 'Wide' }
                  ].map(p => (
                    <button
                      key={p.key}
                      onClick={() => setReaderSettings({ paragraphSpacing: p.key })}
                      className={`flex-1 py-2 border text-[10px] font-bold text-center cursor-pointer transition-colors bg-transparent ${
                        readerSettings.paragraphSpacing === p.key ? 'border-[#FF3D00] text-[#FF3D00]' : 'border-[#262626] text-current'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Width */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#737373] uppercase font-bold block">Reading Canvas Width</label>
                <div className="flex gap-2">
                  {[
                    { key: 'max-w-xl', label: 'Narrow (576px)' },
                    { key: 'max-w-2xl', label: 'Default (672px)' },
                    { key: 'max-w-3xl', label: 'Wide (768px)' },
                    { key: 'max-w-4xl', label: 'Extended (896px)' }
                  ].map(w => (
                    <button
                      key={w.key}
                      onClick={() => setReaderSettings({ contentWidth: w.key })}
                      className={`flex-1 py-2 border text-[10px] font-bold text-center cursor-pointer transition-colors bg-transparent ${
                        readerSettings.contentWidth === w.key ? 'border-[#FF3D00] text-[#FF3D00]' : 'border-[#262626] text-current'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Contrast Theme Selector */}
          <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-6 space-y-4`}>
            <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
              <Monitor className="w-4 h-4 text-[#FF3D00]" />
              <h3 className="text-sm font-black uppercase tracking-tight">Contrast Theme</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              {[
                { key: 'light', name: 'Light Mode', bg: 'bg-[#FAFAFA]', border: 'border-[#E5E5E5]', text: 'text-[#0A0A0A]' },
                { key: 'dark', name: 'Dark Mode', bg: 'bg-[#0A0A0A]', border: 'border-[#262626]', text: 'text-[#FAFAFA]' },
                { key: 'sepia', name: 'Sepia Mode', bg: 'bg-[#F4ECD8]', border: 'border-[#D9CDB8]', text: 'text-[#5C4033]' },
                { key: 'amoled', name: 'AMOLED Black', bg: 'bg-black', border: 'border-[#1A1A1A]', text: 'text-white' }
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setReaderSettings({ theme: t.key as any })}
                  className={`flex flex-col items-center justify-between p-3 border rounded-none cursor-pointer transition-all ${t.bg} ${t.text} ${
                    readerSettings.theme === t.key ? 'border-[#FF3D00] scale-[1.03] ring-1 ring-[#FF3D00]' : 'border-[#262626] opacity-80 hover:opacity-100'
                  }`}
                >
                  <span className="font-bold text-[10px] uppercase mb-2">{t.name}</span>
                  <div className="w-full h-8 border border-current/20 flex items-center justify-center text-[10px]">
                    {readerSettings.theme === t.key && <Check className="w-3.5 h-3.5 text-[#FF3D00]" />}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Reading Preferences Toggles */}
          <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-6 space-y-4`}>
            <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
              <Layout className="w-4 h-4 text-[#FF3D00]" />
              <h3 className="text-sm font-black uppercase tracking-tight">Reading Behavior</h3>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold block">Auto-Bookmark Chapters</span>
                  <p className="text-[10px] text-[#737373]">Automatically add active chapter to bookmarks upon loading.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={readerSettings.autoBookmark}
                  onChange={(e) => setReaderSettings({ autoBookmark: e.target.checked })}
                  className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold block">Auto-Save Reading Progress</span>
                  <p className="text-[10px] text-[#737373]">Track read history logs persistently on local cache database.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={readerSettings.autoSaveProgress}
                  onChange={(e) => setReaderSettings({ autoSaveProgress: e.target.checked })}
                  className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold block">Remember Last Position</span>
                  <p className="text-[10px] text-[#737373]">Resume reading from the exact vertical scroll alignment on load.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={readerSettings.rememberPosition}
                  onChange={(e) => setReaderSettings({ rememberPosition: e.target.checked })}
                  className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
                />
              </div>
            </div>
          </section>

          {/* Site Preferences Toggles */}
          <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-6 space-y-4`}>
            <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
              <EyeOff className="w-4 h-4 text-[#FF3D00]" />
              <h3 className="text-sm font-black uppercase tracking-tight">Site Preferences</h3>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold block">Hide Mature Content</span>
                  <p className="text-[10px] text-[#737373]">Filter out light novels with mature tags from directories.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={readerSettings.hideMatureContent}
                  onChange={(e) => setReaderSettings({ hideMatureContent: e.target.checked })}
                  className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold block">Show Illustrations</span>
                  <p className="text-[10px] text-[#737373]">Load light novel internal images and illustrations inside sheets.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={readerSettings.showIllustrations}
                  onChange={(e) => setReaderSettings({ showIllustrations: e.target.checked })}
                  className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold block">Show Translator Notes</span>
                  <p className="text-[10px] text-[#737373]">Display translator-specific context callout boxes inside the reader.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={readerSettings.showTranslatorNotes}
                  onChange={(e) => setReaderSettings({ showTranslatorNotes: e.target.checked })}
                  className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold block">Show Author Notes</span>
                  <p className="text-[10px] text-[#737373]">Display original writer commentary callout boxes inside the reader.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={readerSettings.showAuthorNotes}
                  onChange={(e) => setReaderSettings({ showAuthorNotes: e.target.checked })}
                  className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
                />
              </div>
            </div>
          </section>

          {/* Notification Preferences Toggles */}
          <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-6 space-y-4`}>
            <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
              <Bell className="w-4 h-4 text-[#FF3D00]" />
              <h3 className="text-sm font-black uppercase tracking-tight">Notification Preferences</h3>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold block">New Chapter Notifications</span>
                  <p className="text-[10px] text-[#737373]">Receive system notifications when followed novels publish a new chapter.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={readerSettings.newChapterNotify}
                  onChange={(e) => setReaderSettings({ newChapterNotify: e.target.checked })}
                  className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold block">Announcement Notifications</span>
                  <p className="text-[10px] text-[#737373]">Receive push or banner alerts when global notices are updated.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={readerSettings.announcementNotify}
                  onChange={(e) => setReaderSettings({ announcementNotify: e.target.checked })}
                  className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
                />
              </div>
            </div>
          </section>

        </div>

        {/* Right Side: Account Settings */}
        <div className="md:col-span-5">
          <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-6 space-y-4`}>
            <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
              <User className="w-4 h-4 text-[#FF3D00]" />
              <h3 className="text-sm font-black uppercase tracking-tight">Account Settings</h3>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4 font-mono text-xs">
              
              {/* Profile Avatar Upload */}
              <div className="space-y-2">
                <label className="text-[10px] text-[#737373] uppercase font-bold block">Profile Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 border border-[#262626] bg-[#151515] flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {avatar ? (
                      <img src={avatar} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-[#737373]" />
                    )}
                  </div>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-grow border border-dashed p-3 text-center cursor-pointer transition-colors ${
                      isDragging ? 'border-[#FF3D00] bg-[#FF3D00]/5' : 'border-[#262626] hover:border-[#FF3D00]'
                    }`}
                  >
                    <Upload className="w-4 h-4 mx-auto text-[#737373] mb-1" />
                    <span className="text-[9px] text-[#737373] block uppercase font-bold">Drag & Drop or Click</span>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileSelect} 
                      className="hidden" 
                      accept="image/jpeg,image/png,image/webp" 
                    />
                  </div>
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#737373] uppercase font-bold block">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00]"
                  placeholder="Reader123"
                  required
                />
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#737373] uppercase font-bold block">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00]"
                  placeholder="reader@domain.com"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#FF3D00] text-[#0A0A0A] font-bold py-3 uppercase hover:bg-white transition-colors cursor-pointer border-none"
              >
                Update Profile
              </button>
            </form>
          </section>

          {/* Account Security Info / Dummy */}
          <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-6 mt-6 space-y-3`}>
            <div className="flex items-center gap-1.5 text-[#737373] font-mono text-[10px]">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              <span className="uppercase font-bold">Local Sync Status</span>
            </div>
            <p className="text-[10px] text-[#737373] leading-relaxed">
              Your profile configurations are stored locally on this machine&apos;s IndexedDB / localStorage instances and will remain synced until local caches are wiped.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default SettingsPage;
