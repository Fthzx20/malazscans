import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Minimize2, BookOpen, Clock, Lock, Unlock, Coins, Sparkles } from 'lucide-react';
import { useNovelStore } from '../../novels/store/novelStore';
import { useReaderStore } from '../store/readerStore';
import { useCoinStore } from '../../coins/store/coinStore';
import { useReaderSettings } from '../hooks/useReaderSettings';
import { useHistory } from '../../library/hooks/useHistory';
import { getFlatChapters } from '../../novels/utils';
import { ReaderToolbar } from './ReaderToolbar';
import { ReaderContent } from './ReaderContent';
import { CommentSection } from '../../comments/components/CommentSection';
import { getThemeStyles } from '../utils/theme';
import { Chapter } from '../../../types';

export const ReaderPage: React.FC = () => {
  const selectedNovel = useNovelStore((state) => state.selectedNovel);
  const triggerToast = useNovelStore((state) => state.triggerToast);
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  
  const activeChapter = useReaderStore((state) => state.activeChapter);
  const setActiveChapter = useReaderStore((state) => state.setActiveChapter);
  
  const isChapterUnlocked = useCoinStore((state) => state.isChapterUnlocked);
  const unlockChapter = useCoinStore((state) => state.unlockChapter);
  const userCoins = useCoinStore((state) => state.userCoins);
  const openWallet = useCoinStore((state) => state.openWallet);

  const { readerSettings } = useReaderSettings();
  const { markChapterAsRead, logReadingProgress } = useHistory();

  const themeStyles = getThemeStyles(readerSettings.theme);

  // Zen Mode & Auto-Hide state
  const [isZenMode, setIsZenMode] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const lastScrollYRef = useRef<number>(0);

  // Calculate word count & estimated reading time
  const { wordCount, readingMinutes } = useMemo(() => {
    if (!activeChapter?.content) return { wordCount: 0, readingMinutes: 1 };
    const text = Array.isArray(activeChapter.content)
      ? activeChapter.content.join(' ')
      : typeof activeChapter.content === 'string'
      ? activeChapter.content
      : '';
    const count = text.trim() ? text.trim().split(/\s+/).length : 0;
    return {
      wordCount: count,
      readingMinutes: Math.max(1, Math.ceil(count / 220))
    };
  }, [activeChapter?.content]);

  // Smart Auto-Hide Header & Save scroll position (RAF throttled + debounced)
  useEffect(() => {
    if (typeof window === 'undefined' || !selectedNovel || !activeChapter) return;

    let rafId: number;
    let saveTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const diff = currentScrollY - lastScrollYRef.current;

        // Calculate continuous reading progress percentage
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = totalHeight > 0 
          ? Math.min(100, Math.max(0, Math.round((currentScrollY / totalHeight) * 100))) 
          : 0;
        setReadingProgress(progress);

        // Auto-hide toolbar logic:
        // Scrolling down by > 35px hides it; scrolling up by > 15px or near top (< 80px) reveals it
        if (!isZenMode) {
          if (currentScrollY < 80) {
            setIsToolbarVisible(true);
          } else if (diff > 35) {
            setIsToolbarVisible(false);
          } else if (diff < -15) {
            setIsToolbarVisible(true);
          }
        }

        lastScrollYRef.current = currentScrollY;

        // Debounced local storage position saving
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          localStorage.setItem(
            'kult_reader_position',
            JSON.stringify({
              novelId: selectedNovel.id,
              chapterId: activeChapter.id,
              scrollY: currentScrollY
            })
          );
        }, 300);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
      clearTimeout(saveTimeout);
    };
  }, [selectedNovel?.id, activeChapter?.id, isZenMode]);

  // Restore scroll position on chapter mount/change
  useEffect(() => {
    if (typeof window === 'undefined' || !activeChapter) return;

    const saved = localStorage.getItem('kult_reader_position');
    if (saved) {
      try {
        const { chapterId, scrollY } = JSON.parse(saved);
        if (chapterId === activeChapter.id && scrollY > 0) {
          const timer = setTimeout(() => {
            window.scrollTo({
              top: scrollY,
              behavior: 'instant' as ScrollBehavior
            });
          }, 80);
          return () => clearTimeout(timer);
        }
      } catch {
        // Ignore JSON parse errors
      }
    }
  }, [activeChapter?.id]);

  const flatChapters = useMemo(() => {
    return selectedNovel ? getFlatChapters(selectedNovel) : [];
  }, [selectedNovel]);

  const currIndex = useMemo(() => {
    return flatChapters.findIndex((c) => c.id === activeChapter?.id);
  }, [flatChapters, activeChapter?.id]);

  const navigateToChapter = useCallback((chapter: Chapter) => {
    setActiveChapter(chapter);
    if (selectedNovel) {
      logReadingProgress(selectedNovel.id, chapter.id, chapter.title);
      markChapterAsRead(chapter.id);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'kult_reader_position',
        JSON.stringify({
          novelId: selectedNovel?.id,
          chapterId: chapter.id,
          scrollY: 0
        })
      );
      window.scrollTo(0, 0);
    }
  }, [setActiveChapter, selectedNovel, logReadingProgress, markChapterAsRead]);

  const handleChapterShift = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'next' && currIndex < flatChapters.length - 1) {
      navigateToChapter(flatChapters[currIndex + 1]);
    } else if (direction === 'prev' && currIndex > 0) {
      navigateToChapter(flatChapters[currIndex - 1]);
    } else {
      triggerToast(direction === 'next' ? "You are on the last chapter." : "You are on the first chapter.");
    }
  }, [currIndex, flatChapters, navigateToChapter, triggerToast]);

  // Keyboard navigation: Z for Zen Mode, ArrowLeft/Right for Chapter shift, B for Bookmark
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input or textarea (e.g. comment field)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'z' || e.key === 'Z') {
        setIsZenMode(prev => {
          const next = !prev;
          setIsToolbarVisible(!next);
          triggerToast(next ? "Zen Mode: ON (Press Z to exit)" : "Zen Mode: OFF");
          return next;
        });
      } else if (e.key === 'ArrowLeft') {
        handleChapterShift('prev');
      } else if (e.key === 'ArrowRight') {
        handleChapterShift('next');
      } else if (e.key === 'b' || e.key === 'B') {
        if (selectedNovel) {
          import('../../library/store/libraryStore').then(({ useLibraryStore }) => {
            const isBookmarked = useLibraryStore.getState().bookmarks.includes(selectedNovel.id);
            useLibraryStore.getState().toggleBookmark(selectedNovel.id);
            triggerToast(!isBookmarked ? `Bookmarked: ${selectedNovel.title}` : `Removed from Bookmarks`);
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleChapterShift, triggerToast, selectedNovel]);

  const toggleZenMode = useCallback(() => {
    setIsZenMode(prev => {
      const next = !prev;
      setIsToolbarVisible(!next);
      triggerToast(next ? "Zen Mode: ON (Press Z to exit)" : "Zen Mode: OFF");
      return next;
    });
  }, [triggerToast]);

  if (!selectedNovel || !activeChapter) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-12 text-center text-xs font-mono text-[#737373]">
        No chapter is currently selected for reading.
      </main>
    );
  }

  return (
    <main className={`min-h-screen pb-16 relative transition-colors duration-200 ${themeStyles.bg} ${themeStyles.text}`}>
      {/* Fixed Top Reading Progress Bar (Always visible even in Zen mode or when toolbar hides) */}
      <div 
        className="fixed top-0 left-0 w-full h-[3px] bg-black/40 z-50 pointer-events-none"
        role="progressbar"
        aria-valuenow={readingProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress bar"
      >
        <div 
          className="h-full bg-[#FF3D00] transition-all duration-150 ease-out shadow-[0_0_8px_rgba(255,61,0,0.8)]"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Floating Zen Mode Exit Indicator */}
      {isZenMode && (
        <button
          onClick={toggleZenMode}
          className="fixed top-4 right-4 z-50 p-2.5 bg-[#FF3D00] text-[#0A0A0A] shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border-none flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider"
          title="Exit Zen Mode (Z)"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exit Zen</span>
        </button>
      )}

      {/* Reader Toolbar with Auto-Hide & Quick Jump */}
      <ReaderToolbar 
        novel={selectedNovel} 
        chapters={flatChapters}
        activeChapterId={activeChapter.id}
        onSelectChapter={navigateToChapter}
        isZenMode={isZenMode}
        onToggleZenMode={toggleZenMode}
        isVisible={!isZenMode && isToolbarVisible}
      />

      {/* Reader Canvas */}
      <article className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-12 space-y-8 sm:space-y-12">
        <header className={`border-b ${themeStyles.border} pb-6 text-center space-y-3`}>
          <span className="text-[10px] font-mono text-[#FF3D00] uppercase tracking-wider font-extrabold block">
            {selectedNovel.title}
          </span>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight">{activeChapter.title}</h1>
          
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-mono text-[#737373] pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#FF3D00]" />
              ~{readingMinutes} min read
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {wordCount.toLocaleString()} words
            </span>
            <span>&bull;</span>
            <span>
              Translator: <span className="text-[#FF3D00] font-bold">{selectedNovel.translator}</span>
            </span>
          </div>
        </header>

        {/* Content paragraphs or Paywall Barrier */}
        {activeChapter.isLocked && !isChapterUnlocked(activeChapter.id) ? (
          <div className={`p-5 sm:p-12 border ${themeStyles.border} bg-[#0D0D0E] text-center space-y-5 sm:space-y-6 my-6 sm:my-8`}>
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-lg sm:text-2xl font-black uppercase font-mono tracking-tight text-white">
                Chapter Locked
              </h2>
              <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                This premium chapter requires coins to unlock. Once unlocked, you can read it anytime with no additional cost.
              </p>
            </div>

            <div className="inline-flex items-center gap-4 sm:gap-6 p-3 sm:p-4 bg-zinc-950 border border-zinc-800 font-mono text-xs">
              <div className="text-left">
                <span className="text-[10px] uppercase text-zinc-500 block">Unlock Cost</span>
                <span className="text-sm sm:text-base font-black text-amber-400 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {activeChapter.coinPrice || 5} Coins
                </span>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div className="text-left">
                <span className="text-[10px] uppercase text-zinc-500 block">Your Coin Balance</span>
                <span className="text-sm sm:text-base font-black text-white flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> {userCoins} Coins
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-sm mx-auto">
              {userCoins >= (activeChapter.coinPrice || 5) ? (
                <button
                  onClick={() => {
                    const cost = activeChapter.coinPrice || 5;
                    const success = unlockChapter(selectedNovel.id, activeChapter.id, cost, activeChapter.title);
                    if (success) {
                      triggerToast(`Chapter unlocked successfully! (-${cost} Coins)`);
                    } else {
                      triggerToast('Insufficient coins to unlock chapter.');
                    }
                  }}
                  className="w-full py-3.5 bg-[#FF3D00] hover:bg-[#FF3D00]/90 text-black font-black uppercase font-mono tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.99]"
                >
                  <Unlock className="w-4 h-4" />
                  Unlock Chapter Now ({activeChapter.coinPrice || 5} Coins)
                </button>
              ) : (
                <button
                  onClick={() => openWallet()}
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-black font-black uppercase font-mono tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4" />
                  Insufficient Coins — Top Up Now
                </button>
              )}
            </div>
          </div>
        ) : (
          <ReaderContent chapter={activeChapter} />
        )}

        {/* Navigation pagination buttons */}
        <div className={`border-t ${themeStyles.border} pt-6 sm:pt-8 flex gap-2 sm:gap-4 justify-between`}>
          <button 
            onClick={() => handleChapterShift('prev')}
            disabled={currIndex === 0}
            className={`flex-1 inline-flex justify-center items-center gap-1 border ${themeStyles.border} py-3 sm:py-3.5 text-xs font-mono font-bold uppercase transition-all bg-transparent text-current ${
              currIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:border-white cursor-pointer active:scale-[0.99]'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>

          <button 
            onClick={() => setCurrentPage('detail')}
            className={`flex-1 inline-flex justify-center items-center border ${themeStyles.border} hover:border-white py-3 sm:py-3.5 text-xs font-mono font-bold uppercase bg-transparent text-current cursor-pointer active:scale-[0.99]`}
          >
            Chapter List
          </button>

          <button 
            onClick={() => handleChapterShift('next')}
            disabled={currIndex === flatChapters.length - 1}
            className={`flex-1 inline-flex justify-center items-center gap-1 py-3 sm:py-3.5 text-xs font-mono font-bold uppercase border transition-all ${
              currIndex === flatChapters.length - 1
                ? 'opacity-30 border-[#262626] text-[#737373] bg-transparent cursor-not-allowed'
                : 'bg-[#FF3D00] text-[#0A0A0A] border-[#FF3D00] hover:bg-transparent hover:text-[#FF3D00] cursor-pointer active:scale-[0.99]'
            }`}
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Comments section */}
        <CommentSection chapterId={activeChapter.id} />
      </article>
    </main>
  );
};

export default ReaderPage;
