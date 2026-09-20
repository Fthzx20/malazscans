import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Home, Settings, Maximize2, Minimize2, List, X, Lock, Bookmark } from 'lucide-react';
import { Chapter, Novel } from '../../../types';
import { useNovelStore } from '../../novels/store/novelStore';
import { useReaderSettings } from '../hooks/useReaderSettings';
import { useHistory } from '../../library/hooks/useHistory';
import { useLibraryStore } from '../../library/store/libraryStore';
import { getThemeStyles } from '../utils/theme';

interface ReaderToolbarProps {
  novel: Novel;
  chapters?: Chapter[];
  activeChapterId?: string;
  onSelectChapter?: (chapter: Chapter) => void;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
  isVisible?: boolean;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  novel,
  chapters = [],
  activeChapterId,
  onSelectChapter,
  isZenMode = false,
  onToggleZenMode,
  isVisible = true,
}) => {
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const triggerToast = useNovelStore((state) => state.triggerToast);
  const isBookmarked = useLibraryStore((state) => state.bookmarks.includes(novel.id));
  const toggleBookmark = useLibraryStore((state) => state.toggleBookmark);
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    readerSettings,
    setReaderSettings
  } = useReaderSettings();
  const { clearReadChapters } = useHistory();

  const themeStyles = getThemeStyles(readerSettings.theme);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isChapterListOpen, setIsChapterListOpen] = useState(false);
  const lastProgressRef = useRef<number>(0);

  // RAF-throttled scroll progress calculation to eliminate layout thrashing & CPU churn
  useEffect(() => {
    let rafId: number;

    const calculateProgress = () => {
      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight <= 0) {
          if (lastProgressRef.current !== 0) {
            lastProgressRef.current = 0;
            setReadingProgress(0);
          }
          return;
        }
        const progress = Math.min(100, Math.max(0, (scrollY / totalHeight) * 100));
        const rounded = Math.round(progress);
        if (rounded !== lastProgressRef.current) {
          lastProgressRef.current = rounded;
          setReadingProgress(rounded);
        }
      });
    };

    window.addEventListener('scroll', calculateProgress, { passive: true });
    calculateProgress();
    return () => {
      window.removeEventListener('scroll', calculateProgress);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const handleBack = () => {
    setCurrentPage('detail');
  };

  const handleHome = () => {
    setCurrentPage('dashboard');
  };

  const handleClearProgress = () => {
    clearReadChapters();
    useNovelStore.getState().triggerToast("Reading history cleared.");
  };

  const handleChapterSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetChapter = chapters.find(c => c.id === e.target.value);
    if (targetChapter && onSelectChapter) {
      onSelectChapter(targetChapter);
    }
  };

  return (
    <>
      {/* Reader Top Bar - Smooth auto-hide via translate-y */}
      <div 
        className={`sticky top-0 z-30 border-b ${themeStyles.border} ${themeStyles.headerBg} py-2.5 transition-all duration-300 ease-in-out text-current relative ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-4xl mx-auto px-3 sm:px-4 flex justify-between items-center gap-2 sm:gap-3">
          
          {/* Left: Navigation actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button 
              onClick={handleHome}
              className="p-1.5 border border-transparent hover:border-current/30 text-current/70 hover:text-[#FF3D00] transition-colors cursor-pointer bg-transparent shrink-0"
              title="Return to Home"
              aria-label="Return to Home"
            >
              <Home className="w-4 h-4" />
            </button>

            <button 
              onClick={handleBack}
              className="inline-flex items-center gap-1 text-xs font-mono text-[#737373] hover:text-[#FF3D00] truncate max-w-[110px] sm:max-w-[240px] bg-transparent border-none cursor-pointer text-current"
              title={`Back to ${novel.title}`}
            >
              <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate font-bold">{novel.title}</span>
            </button>

            {/* Chapter Selector: Dropdown for desktop, button for mobile */}
            {chapters.length > 0 && (
              <>
                <select
                  value={activeChapterId || ''}
                  onChange={handleChapterSelectChange}
                  aria-label="Select Chapter"
                  className={`hidden sm:block text-[11px] font-mono border ${themeStyles.border} ${themeStyles.cardBg} text-current px-2 py-1 cursor-pointer outline-none max-w-[160px] truncate`}
                >
                  {chapters.map((chap) => (
                    <option key={chap.id} value={chap.id} className="bg-[#121212] text-white">
                      {chap.title}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setIsChapterListOpen(true)}
                  className="sm:hidden p-1.5 border border-current/20 hover:border-[#FF3D00] text-current/80 hover:text-[#FF3D00] bg-transparent cursor-pointer shrink-0"
                  title="Select Chapter"
                  aria-label="Select Chapter"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Right: Reading controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            {/* Quick Bookmark Toggle */}
            <button
              onClick={() => {
                toggleBookmark(novel.id);
                triggerToast(
                  !isBookmarked 
                    ? `Bookmarked: ${novel.title}` 
                    : `Removed from Bookmarks`
                );
              }}
              className={`p-1.5 border text-xs font-mono transition-colors cursor-pointer ${
                isBookmarked
                  ? 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/10'
                  : 'border-current/20 text-current hover:text-[#FF3D00] hover:border-[#FF3D00] bg-transparent'
              }`}
              title={isBookmarked ? "Remove Bookmark (B)" : "Add to Bookmarks (B)"}
              aria-label="Toggle Bookmark"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#FF3D00]' : ''}`} />
            </button>

            {/* Progress Badge */}
            <span 
              className="text-[10px] font-mono font-bold text-[#FF3D00] bg-[#FF3D00]/10 px-2 py-1 border border-[#FF3D00]/25 flex items-center gap-1"
              title="Reading progress"
            >
              <span>{readingProgress}%</span>
            </span>

            {/* Zen Mode Toggle */}
            {onToggleZenMode && (
              <button
                onClick={onToggleZenMode}
                className={`p-1.5 border text-xs font-mono transition-colors cursor-pointer ${
                  isZenMode 
                    ? 'border-[#FF3D00] text-[#0A0A0A] bg-[#FF3D00]' 
                    : `border-${themeStyles.border} text-current hover:text-[#FF3D00] hover:border-[#FF3D00] bg-transparent`
                }`}
                title={isZenMode ? "Exit Zen Mode (Z)" : "Enter Zen Mode (Z)"}
                aria-label="Toggle Zen Mode"
              >
                {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Settings Toggle */}
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1.5 border border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/5 hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-colors cursor-pointer"
              aria-label="Open Reader Settings"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Real-time Reading Progress Bar */}
        <div 
          className="absolute bottom-0 left-0 w-full h-[2.5px] bg-current/10 overflow-hidden" 
          role="progressbar" 
          aria-valuenow={readingProgress} 
          aria-valuemin={0} 
          aria-valuemax={100} 
          aria-label="Reading progress"
        >
          <div 
            className="h-full bg-[#FF3D00] transition-all duration-150 ease-out" 
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      </div>

      {/* Collapsible Control Drawer */}
      {isSettingsOpen && (
        <div className={`border-b ${themeStyles.border} ${themeStyles.cardBg} py-4 transition-all text-current z-30 relative shadow-xl`}>
          <div className="max-w-xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Font Family Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-[#737373] font-bold block uppercase font-sans">Font Style</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setReaderSettings({ fontFamily: 'font-serif' })}
                  className={`flex-1 py-1.5 border text-xs font-mono cursor-pointer transition-colors bg-transparent ${readerSettings.fontFamily === 'font-serif' ? 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/10' : 'border-[#262626] text-current'}`}
                >
                  SERIF
                </button>
                <button 
                  onClick={() => setReaderSettings({ fontFamily: 'font-sans' })}
                  className={`flex-1 py-1.5 border text-xs font-mono cursor-pointer transition-colors bg-transparent ${readerSettings.fontFamily === 'font-sans' ? 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/10' : 'border-[#262626] text-current'}`}
                >
                  SANS
                </button>
              </div>
            </div>

            {/* Font Size Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-[#737373] font-bold block uppercase font-sans">Size</span>
              <div className="flex gap-1">
                {['text-base', 'text-lg', 'text-xl'].map((sz) => (
                  <button 
                    key={sz}
                    onClick={() => setReaderSettings({ fontSize: sz })}
                    className={`flex-1 py-1.5 border text-[10px] font-mono uppercase cursor-pointer transition-colors bg-transparent ${readerSettings.fontSize === sz ? 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/10' : 'border-[#262626] text-current'}`}
                  >
                    {sz.replace('text-', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-[#737373] font-bold block uppercase font-sans">Theme</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { key: 'light', label: 'LIGHT' },
                  { key: 'dark', label: 'DARK' },
                  { key: 'sepia', label: 'SEPIA' },
                  { key: 'amoled', label: 'AMOLED' }
                ].map((t) => (
                  <button 
                    key={t.key}
                    onClick={() => setReaderSettings({ theme: t.key as 'light' | 'dark' | 'sepia' | 'amoled' })}
                    className={`flex-1 py-1 px-1.5 border text-[9px] font-mono cursor-pointer transition-colors bg-transparent ${readerSettings.theme === t.key ? 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/10' : 'border-[#262626] text-current'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
          
          {/* Reset Progress Action in Drawer */}
          <div className="max-w-xl mx-auto px-4 pt-4 border-t border-[#262626] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="text-[10px] font-mono text-[#737373]">
              Shortcuts: <kbd className="border border-current/20 px-1 py-0.5">Z</kbd> Zen &bull; <kbd className="border border-current/20 px-1 py-0.5">&larr;</kbd> <kbd className="border border-current/20 px-1 py-0.5">&rarr;</kbd> Chaps &bull; <kbd className="border border-current/20 px-1 py-0.5">B</kbd> Bookmark
            </span>
            <button
              onClick={handleClearProgress}
              className="text-[9px] font-mono uppercase bg-[#FF3D00]/10 text-[#FF3D00] border border-[#FF3D00]/30 hover:bg-[#FF3D00] hover:text-[#0A0A0A] px-3 py-1.5 transition-all active:scale-95 font-bold cursor-pointer"
            >
              Clear Reading History
            </button>
          </div>

          <div className="text-center pt-3">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="text-[10px] font-mono uppercase text-[#737373] hover:text-[#FF3D00] bg-transparent border-none cursor-pointer"
            >
              Close Settings &times;
            </button>
          </div>
        </div>
      )}

      {/* Mobile Chapter Selector Modal / Bottom Sheet */}
      {isChapterListOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-xs sm:hidden">
          <div className="absolute inset-0" onClick={() => setIsChapterListOpen(false)} />
          <div className={`relative ${themeStyles.cardBg} border-t-2 border-[#FF3D00] max-h-[70vh] flex flex-col p-4 shadow-2xl z-10`}>
            <div className="flex justify-between items-center pb-3 border-b border-current/15 mb-2">
              <div>
                <span className="text-xs font-mono font-bold text-[#FF3D00] block uppercase tracking-wider">Chapter List</span>
                <span className="text-[10px] font-mono opacity-60">{chapters.length} Chapters Available</span>
              </div>
              <button 
                onClick={() => setIsChapterListOpen(false)}
                className="p-1 text-current/70 hover:text-[#FF3D00] bg-transparent border-none cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
              {chapters.map((chap, idx) => {
                const isActive = chap.id === activeChapterId;
                return (
                  <button
                    key={chap.id}
                    onClick={() => {
                      if (onSelectChapter) {
                        onSelectChapter(chap);
                      }
                      setIsChapterListOpen(false);
                    }}
                    className={`w-full text-left p-2.5 font-mono text-xs flex items-center justify-between transition-colors border cursor-pointer ${
                      isActive 
                        ? 'border-[#FF3D00] bg-[#FF3D00]/15 text-[#FF3D00] font-bold' 
                        : 'border-current/10 bg-transparent text-current hover:border-[#FF3D00]/50'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="text-[10px] opacity-50 mr-2">#{idx + 1}</span>
                      <span>{chap.title}</span>
                    </div>
                    {chap.isLocked && (
                      <span className="text-[9px] text-[#FF3D00] flex items-center gap-1 shrink-0">
                        <Lock className="w-3 h-3" />
                        {chap.coinPrice || 0}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReaderToolbar;
