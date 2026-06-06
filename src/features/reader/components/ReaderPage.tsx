import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNovelStore } from '../../novels/store/novelStore';
import { useReaderStore } from '../store/readerStore';
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
  
  const { readerSettings } = useReaderSettings();
  const { markChapterAsRead, logReadingProgress } = useHistory();

  const themeStyles = getThemeStyles(readerSettings.theme);

  // Save scroll position to localStorage (debounced)
  useEffect(() => {
    if (typeof window === 'undefined' || !selectedNovel || !activeChapter) return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollY = window.scrollY;
        localStorage.setItem(
          'kult_reader_position',
          JSON.stringify({
            novelId: selectedNovel.id,
            chapterId: activeChapter.id,
            scrollY
          })
        );
      }, 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [selectedNovel?.id, activeChapter?.id]);

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
          }, 100);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        // Ignore
      }
    }
  }, [activeChapter?.id]);

  if (!selectedNovel || !activeChapter) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-12 text-center text-xs font-mono text-[#737373]">
        No chapter is currently selected for reading.
      </main>
    );
  }

  const flatChapters = getFlatChapters(selectedNovel);
  const currIndex = flatChapters.findIndex((c) => c.id === activeChapter.id);

  const navigateToChapter = (chapter: Chapter) => {
    setActiveChapter(chapter);
    logReadingProgress(selectedNovel.id, chapter.id, chapter.title);
    markChapterAsRead(chapter.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'kult_reader_position',
        JSON.stringify({
          novelId: selectedNovel.id,
          chapterId: chapter.id,
          scrollY: 0
        })
      );
      window.scrollTo(0, 0);
    }
  };

  const handleChapterShift = (direction: 'prev' | 'next') => {
    if (direction === 'next' && currIndex < flatChapters.length - 1) {
      navigateToChapter(flatChapters[currIndex + 1]);
    } else if (direction === 'prev' && currIndex > 0) {
      navigateToChapter(flatChapters[currIndex - 1]);
    } else {
      triggerToast(direction === 'next' ? "You are on the last chapter." : "You are on the first chapter.");
    }
  };

  return (
    <main className={`min-h-screen pb-16 relative transition-colors duration-200 ${themeStyles.bg} ${themeStyles.text}`}>
      {/* Toolbar & Settings Drawer */}
      <ReaderToolbar novel={selectedNovel} />

      {/* Reader Canvas */}
      <article className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-12">
        <header className={`border-b ${themeStyles.border} pb-6 text-center space-y-2`}>
          <span className="text-[10px] font-mono text-[#FF3D00] uppercase tracking-wider font-extrabold">
            {selectedNovel.title}
          </span>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight">{activeChapter.title}</h1>
          <p className="text-xs font-mono text-[#737373]">
            Translator: <span className="text-[#FF3D00] font-bold">{selectedNovel.translator}</span>
          </p>
        </header>

        {/* Content paragraphs and illustrations */}
        <ReaderContent chapter={activeChapter} />

        {/* Navigation pagination buttons */}
        <div className={`border-t ${themeStyles.border} pt-8 flex gap-4 justify-between`}>
          <button 
            onClick={() => handleChapterShift('prev')}
            disabled={currIndex === 0}
            className={`flex-1 inline-flex justify-center items-center gap-1.5 border ${themeStyles.border} py-3.5 text-xs font-mono font-bold uppercase transition-all bg-transparent text-current ${
              currIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:border-white cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>

          <button 
            onClick={() => setCurrentPage('detail')}
            className={`flex-1 inline-flex justify-center items-center border ${themeStyles.border} hover:border-white py-3.5 text-xs font-mono font-bold uppercase bg-transparent text-current cursor-pointer`}
          >
            Chapters
          </button>

          <button 
            onClick={() => handleChapterShift('next')}
            disabled={currIndex === flatChapters.length - 1}
            className={`flex-1 inline-flex justify-center items-center gap-1.5 py-3.5 text-xs font-mono font-bold uppercase border transition-all ${
              currIndex === flatChapters.length - 1
                ? 'opacity-30 border-[#262626] text-[#737373] bg-transparent cursor-not-allowed'
                : 'bg-[#FF3D00] text-[#0A0A0A] border-[#FF3D00] hover:bg-transparent hover:text-[#FF3D00] cursor-pointer'
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
