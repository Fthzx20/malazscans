"use client";

import React, { useState } from 'react';
import { 
  Sliders, Layout, Monitor, Shield, Bell, Eye, EyeOff, 
  Sparkles, CheckCircle2, User as UserIcon, ArrowRight
} from 'lucide-react';
import { useReaderStore } from '../../reader/store/readerStore';
import { useAuthStore } from '../../auth/store/authStore';
import { useNovelStore } from '../../novels/store/novelStore';
import { getThemeStyles } from '../../reader/utils/theme';

export const SettingsPage: React.FC = () => {
  const { readerSettings, setReaderSettings } = useReaderStore();
  const { currentUser } = useAuthStore();
  const { setCurrentPage } = useNovelStore();

  const themeStyles = getThemeStyles(readerSettings.theme);

  // Sample paragraph for live reading preview
  const sampleParagraph = "The twin moons of Malazan hung low against the obsidian sky, casting an ethereal crimson glow across the ancient citadel. A lone shadow emerged from the mist, fingers lightly tracing the worn hilt of a rune-carved blade. In this realm where gods walk among mortals, every step is a gamble with destiny.";

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 sm:space-y-8 text-current transition-colors duration-200 font-mono">
      {/* ─── Header & Auto-Save Status ─── */}
      <div className="border-b border-[#262626] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-sans">Reading Preferences</h1>
          <p className="text-xs text-[#737373]">Customize typography, canvas width, contrast themes, and reading behavior.</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Preferences Auto-Saved</span>
        </div>
      </div>

      {/* ─── Reader Profile Shortcut Banner ─── */}
      {currentUser && (
        <div 
          onClick={() => setCurrentPage('profile')}
          className="border border-[#FF3D00]/40 bg-[#FF3D00]/5 p-4 flex items-center justify-between hover:bg-[#FF3D00]/10 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border border-[#FF3D00]/60 bg-[#151515] flex items-center justify-center text-[#FF3D00]">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white uppercase block">
                Manage Profile & Reader Pass ({currentUser.username})
              </span>
              <span className="text-[10px] text-[#737373] block">
                View connected {currentUser.provider || 'OAuth'} account, unlocked chapters, and coin balance.
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#FF3D00] group-hover:translate-x-1 transition-transform" />
        </div>
      )}

      {/* ─── Live Reading Preview Box ─── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between text-[10px] text-[#737373] uppercase font-bold">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#FF3D00]" /> Live Reading Canvas Preview
          </span>
          <span>
            {readerSettings.theme.toUpperCase()} • {readerSettings.fontFamily.replace('font-', '').toUpperCase()} • {readerSettings.fontSize.replace('text-', '').toUpperCase()}
          </span>
        </div>

        <div className={`border ${themeStyles.border} ${themeStyles.cardBg} ${themeStyles.text} p-6 sm:p-8 transition-all shadow-xl`}>
          <div className={`mx-auto ${readerSettings.contentWidth} space-y-4`}>
            <div className="border-b border-current/15 pb-2">
              <span className="text-[10px] uppercase font-bold opacity-60 block font-mono">Sample Novel Title</span>
              <h3 className="text-base sm:text-lg font-black font-sans">Chapter 1: The Crimson Horizon</h3>
            </div>
            <p className={`${readerSettings.fontFamily} ${readerSettings.fontSize} ${readerSettings.lineHeight} leading-relaxed transition-all`}>
              {sampleParagraph}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Typography & Layout Settings ─── */}
      <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-5 sm:p-6 space-y-5`}>
        <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
          <Sliders className="w-4 h-4 text-[#FF3D00]" />
          <h3 className="text-sm font-black uppercase tracking-tight">Typography & Layout</h3>
        </div>

        <div className="space-y-5 font-mono text-xs">
          {/* Font Family */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#737373] uppercase font-bold block">Font Family</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'font-serif', label: 'Serif (Classic)' },
                { key: 'font-sans', label: 'Sans-Serif (Modern)' },
                { key: 'font-mono', label: 'Monospace (Technical)' }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setReaderSettings({ fontFamily: f.key })}
                  className={`min-h-[44px] py-2.5 px-2 border text-xs font-bold text-center cursor-pointer transition-colors bg-transparent ${
                    readerSettings.fontFamily === f.key ? 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/10 ring-1 ring-[#FF3D00]' : 'border-[#262626] text-current hover:border-current/40'
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
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {[
                { key: 'text-sm', label: 'S' },
                { key: 'text-base', label: 'M' },
                { key: 'text-lg', label: 'L' },
                { key: 'text-xl', label: 'XL' },
                { key: 'text-2xl', label: 'XXL' }
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => setReaderSettings({ fontSize: s.key })}
                  className={`min-h-[44px] py-2.5 border text-xs font-bold text-center cursor-pointer transition-colors bg-transparent ${
                    readerSettings.fontSize === s.key ? 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/10 ring-1 ring-[#FF3D00]' : 'border-[#262626] text-current hover:border-current/40'
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'leading-snug', label: 'Compact' },
                { key: 'leading-normal', label: 'Normal' },
                { key: 'leading-relaxed', label: 'Relaxed' },
                { key: 'leading-loose', label: 'Spacious' }
              ].map(l => (
                <button
                  key={l.key}
                  onClick={() => setReaderSettings({ lineHeight: l.key })}
                  className={`min-h-[44px] py-2.5 border text-xs font-bold text-center cursor-pointer transition-colors bg-transparent ${
                    readerSettings.lineHeight === l.key ? 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/10 ring-1 ring-[#FF3D00]' : 'border-[#262626] text-current hover:border-current/40'
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
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'space-y-4', label: 'Narrow' },
                { key: 'space-y-6', label: 'Standard' },
                { key: 'space-y-8', label: 'Wide' }
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => setReaderSettings({ paragraphSpacing: p.key })}
                  className={`min-h-[44px] py-2.5 border text-xs font-bold text-center cursor-pointer transition-colors bg-transparent ${
                    readerSettings.paragraphSpacing === p.key ? 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/10 ring-1 ring-[#FF3D00]' : 'border-[#262626] text-current hover:border-current/40'
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'max-w-xl', label: 'Narrow (576px)' },
                { key: 'max-w-2xl', label: 'Default (672px)' },
                { key: 'max-w-3xl', label: 'Wide (768px)' },
                { key: 'max-w-4xl', label: 'Full (896px)' }
              ].map(w => (
                <button
                  key={w.key}
                  onClick={() => setReaderSettings({ contentWidth: w.key })}
                  className={`min-h-[44px] py-2.5 border text-xs font-bold text-center cursor-pointer transition-colors bg-transparent ${
                    readerSettings.contentWidth === w.key ? 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/10 ring-1 ring-[#FF3D00]' : 'border-[#262626] text-current hover:border-current/40'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Contrast Theme Selector ─── */}
      <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-5 sm:p-6 space-y-4`}>
        <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
          <Monitor className="w-4 h-4 text-[#FF3D00]" />
          <h3 className="text-sm font-black uppercase tracking-tight">Color Theme & Contrast</h3>
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
              onClick={() => setReaderSettings({ theme: t.key as 'light' | 'dark' | 'sepia' | 'amoled' })}
              className={`min-h-[56px] flex flex-col items-center justify-center p-3 border rounded-none cursor-pointer transition-all ${t.bg} ${t.text} ${
                readerSettings.theme === t.key ? 'border-[#FF3D00] scale-[1.02] ring-2 ring-[#FF3D00]' : 'border-[#262626] opacity-80 hover:opacity-100'
              }`}
            >
              <span className="font-bold">{t.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ─── Reading Behavior Toggles ─── */}
      <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-5 sm:p-6 space-y-4`}>
        <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
          <Layout className="w-4 h-4 text-[#FF3D00]" />
          <h3 className="text-sm font-black uppercase tracking-tight">Reading Behavior</h3>
        </div>

        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between min-h-[44px]">
            <div>
              <span className="font-bold block">Auto Bookmark</span>
              <p className="text-[10px] text-[#737373]">Automatically save the novel to your bookshelf when you start reading.</p>
            </div>
            <input 
              type="checkbox" 
              checked={readerSettings.autoBookmark}
              onChange={(e) => setReaderSettings({ autoBookmark: e.target.checked })}
              className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between min-h-[44px]">
            <div>
              <span className="font-bold block">Auto Save Progress</span>
              <p className="text-[10px] text-[#737373]">Track read chapters and sync reading history with your account.</p>
            </div>
            <input 
              type="checkbox" 
              checked={readerSettings.autoSaveProgress}
              onChange={(e) => setReaderSettings({ autoSaveProgress: e.target.checked })}
              className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between min-h-[44px]">
            <div>
              <span className="font-bold block">Remember Scroll Position</span>
              <p className="text-[10px] text-[#737373]">Resume reading exactly where you left off in the chapter.</p>
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

      {/* ─── Content Preferences Toggles ─── */}
      <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-5 sm:p-6 space-y-4`}>
        <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
          <EyeOff className="w-4 h-4 text-[#FF3D00]" />
          <h3 className="text-sm font-black uppercase tracking-tight">Content Preferences</h3>
        </div>

        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between min-h-[44px]">
            <div>
              <span className="font-bold block">Show Illustrations</span>
              <p className="text-[10px] text-[#737373]">Load light novel illustrations within the reading canvas.</p>
            </div>
            <input 
              type="checkbox" 
              checked={readerSettings.showIllustrations}
              onChange={(e) => setReaderSettings({ showIllustrations: e.target.checked })}
              className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between min-h-[44px]">
            <div>
              <span className="font-bold block">Translator Notes (TL Notes)</span>
              <p className="text-[10px] text-[#737373]">Display translator explanation callout boxes inside the reader.</p>
            </div>
            <input 
              type="checkbox" 
              checked={readerSettings.showTranslatorNotes}
              onChange={(e) => setReaderSettings({ showTranslatorNotes: e.target.checked })}
              className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between min-h-[44px]">
            <div>
              <span className="font-bold block">Author Notes</span>
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

      {/* ─── Notification Preferences Toggles ─── */}
      <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-5 sm:p-6 space-y-4`}>
        <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
          <Bell className="w-4 h-4 text-[#FF3D00]" />
          <h3 className="text-sm font-black uppercase tracking-tight">Notification Preferences</h3>
        </div>

        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between min-h-[44px]">
            <div>
              <span className="font-bold block">New Chapter Notifications</span>
              <p className="text-[10px] text-[#737373]">Receive system notifications when followed novels release a new chapter.</p>
            </div>
            <input 
              type="checkbox" 
              checked={readerSettings.newChapterNotify}
              onChange={(e) => setReaderSettings({ newChapterNotify: e.target.checked })}
              className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between min-h-[44px]">
            <div>
              <span className="font-bold block">Site Announcements</span>
              <p className="text-[10px] text-[#737373]">Receive banner alerts whenever important platform updates are published.</p>
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
    </main>
  );
};

export default SettingsPage;
