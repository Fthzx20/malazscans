import React, { useRef, useState, useEffect } from 'react';
import { BookOpen, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNovelStore } from '../store/novelStore';
import { useLibraryStore } from '../../library/store/libraryStore';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';
import { getFlatChapters, getRelativeTime } from '../utils';
import { NovelCarousel } from './NovelCarousel';
import { NovelCard } from './NovelCard';
import { Chapter, Novel, Recommendation } from '../../../types';

export const DashboardPage: React.FC = () => {
  const novels = useNovelStore((state) => state.novels);
  const newestAddedIndex = useNovelStore((state) => state.newestAddedIndex);
  const setNewestAddedIndex = useNovelStore((state) => state.setNewestAddedIndex);
  const setSelectedGenre = useNovelStore((state) => state.setSelectedGenre);
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const setSelectedNovel = useNovelStore((state) => state.setSelectedNovel);
  
  const history = useLibraryStore((state) => state.history);
  const readChapters = useLibraryStore((state) => state.readChapters);
  const logReadingProgress = useLibraryStore((state) => state.logReadingProgress);
  const markChapterAsRead = useLibraryStore((state) => state.markChapterAsRead);

  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  // Dynamically import readerStore active chapter setter
  const { setActiveChapter: setReaderActiveChapter } = useReaderStore.getState();

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Load recommendations from API, fallback to empty
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  useEffect(() => {
    fetch('/api/recommendations')
      .then(res => res.ok ? res.json() : [])
      .then((recs: Recommendation[]) => setRecommendations(recs.sort((a, b) => a.order - b.order)))
      .catch(() => setRecommendations([]));
  }, []);

  const recommendedNovels = recommendations
    .map(rec => novels.find(n => n.id === rec.novelId))
    .filter((n): n is Novel => !!n);

  const newestAddedNovels = [...novels].sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());

  const handleNavigateToReader = (novel: Novel, chapter: Chapter) => {
    setSelectedNovel(novel);
    setReaderActiveChapter(chapter);
    logReadingProgress(novel.id, chapter.id, chapter.title);
    markChapterAsRead(chapter.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'kult_reader_position',
        JSON.stringify({
          novelId: novel.id,
          chapterId: chapter.id,
          scrollY: 0
        })
      );
    }
    setCurrentPage('reader');
  };

  const slideNewest = (direction: 'left' | 'right') => {
    const maxIndex = newestAddedNovels.length - 1;
    if (direction === 'left') {
      setNewestAddedIndex(Math.max(0, newestAddedIndex - 1));
    } else {
      setNewestAddedIndex(Math.min(maxIndex, newestAddedIndex + 1));
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) < 40) return;
    if (diff > 50) {
      slideNewest('right');
    } else if (diff < -50) {
      slideNewest('left');
    }
  };

  const navigateToBrowse = (genre = 'ALL') => {
    setSelectedGenre(genre);
    setCurrentPage('browse');
  };

  const getAllRecentReleases = () => {
    const releases: { novel: Novel; chapter: Chapter; publishDate: Date }[] = [];
    novels.forEach(novel => {
      novel.volumes.forEach(vol => {
        vol.chapters.forEach(chap => {
          releases.push({
            novel,
            chapter: chap,
            publishDate: new Date(chap.publishDate)
          });
        });
      });
    });
    return releases.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
  };

  if (novels.length === 0) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-24 flex flex-col items-center justify-center text-center space-y-6">
        <div className={`border ${themeStyles.border} ${themeStyles.cardBg} p-8 max-w-md space-y-4`}>
          <BookOpen className="w-12 h-12 text-[#FF3D00] mx-auto" />
          <h2 className="text-lg font-black uppercase tracking-tight text-current font-sans">No Novels Added Yet</h2>
          <p className={`text-xs font-mono leading-relaxed ${themeStyles.accentText}`}>
            No data yet. The database is currently empty. Please access the Admin Dashboard to create or seed novel records.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      {/* 1. HERO CAROUSEL */}
      <NovelCarousel recommendedNovels={recommendedNovels} />

      {/* 2. DYNAMIC READING HISTORY PANEL */}
      {history.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#FF3D00] font-bold">
            <span className="w-1.5 h-1.5 bg-[#FF3D00]"></span>
            <span>CONTINUE READING</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.slice(0, 2).map((item) => {
              const novel = novels.find(n => n.id === item.novelId);
              const flatChaps = novel ? getFlatChapters(novel) : [];
              const activeChap = flatChaps.find(c => c.id === item.chapterId);
              
              if (!novel || !activeChap) return null;
              
              return (
                <div key={item.novelId} className={`border ${themeStyles.border} p-4 ${themeStyles.cardBg} flex justify-between items-center hover:border-[#FF3D00] transition-colors`}>
                  <div className="space-y-1">
                    <span className={`text-[8px] font-mono ${themeStyles.accentText} tracking-widest block uppercase`}>LAST READ: {item.timestamp}</span>
                    <h4 className="text-sm font-bold text-current truncate max-w-[250px]">{novel.title}</h4>
                    <p className={`text-xs ${themeStyles.accentText}`}>{activeChap.title}</p>
                  </div>
                  <button 
                    onClick={() => handleNavigateToReader(novel, activeChap)}
                    className="p-3 bg-[#FF3D00] text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors active:translate-y-px cursor-pointer border-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. NEWEST RELEASES */}
      <section className="space-y-4">
        <div className={`border-b ${themeStyles.border} pb-3 flex justify-between items-baseline`}>
          <div className="flex items-center space-x-2 text-current">
            <Clock className="w-4 h-4 text-[#FF3D00]" />
            <h3 className="text-lg font-black uppercase tracking-tight font-sans">Newest Releases</h3>
          </div>
          <span className={`text-[10px] font-mono ${themeStyles.accentText}`}>UPDATED IN REAL-TIME</span>
        </div>

        <div className={`divide-y ${themeStyles.border.replace('border-', 'divide-')} border ${themeStyles.border}`}>
          {getAllRecentReleases().slice(0, 4).map((rel, index) => {
            const isRead = readChapters.includes(rel.chapter.id);
            return (
              <div 
                key={index} 
                className={`p-4 ${themeStyles.cardBg} hover:opacity-95 transition-opacity flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer`}
                onClick={() => handleNavigateToReader(rel.novel, rel.chapter)}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-mono text-[#FF3D00] font-black uppercase bg-[#FF3D00]/10 px-2 py-0.5">
                      {rel.novel.genres[0]}
                    </span>
                    <span className="text-xs font-bold text-current hover:underline">
                      {rel.novel.title}
                    </span>
                    {isRead && (
                      <span className={`text-[8px] font-mono ${themeStyles.accentText} uppercase tracking-wider ${themeStyles.cardBg} px-1.5 py-0.5 border ${themeStyles.border}`}>✓ Read</span>
                    )}
                  </div>
                  <p className={`text-sm font-extrabold pl-0 sm:pl-2 ${isRead ? `${themeStyles.accentText} line-through` : 'text-current'}`}>
                    {rel.chapter.title}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className={`text-xs font-mono ${themeStyles.accentText} flex items-center gap-1`}>
                    <Clock className="w-3.5 h-3.5" />
                    {getRelativeTime(rel.chapter.publishDate)}
                  </span>
                  <span className="text-xs font-mono text-[#FF3D00] font-black uppercase flex items-center">
                    {isRead ? 'READ AGAIN' : 'READ NOW'} <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. NEWEST ADDED SLIDER */}
      <section className="space-y-4 relative">
        <div className={`border-b ${themeStyles.border} pb-3 flex justify-between items-center text-current`}>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-[#FF3D00]" />
            <h3 className="text-lg font-black uppercase tracking-tight font-sans">Recently Added</h3>
          </div>
          
          <div className="flex items-center space-x-1.5">
            <button 
              onClick={() => slideNewest('left')} 
              disabled={newestAddedIndex === 0}
              className={`p-1.5 border transition-all cursor-pointer bg-transparent ${
                newestAddedIndex === 0 
                  ? `border-${themeStyles.border} ${themeStyles.accentText} cursor-not-allowed` 
                  : 'border-current text-current hover:text-[#FF3D00] hover:border-[#FF3D00] active:scale-95'
              }`}
              aria-label="Slide Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => slideNewest('right')} 
              disabled={newestAddedIndex >= newestAddedNovels.length - 1}
              className={`p-1.5 border transition-all cursor-pointer bg-transparent ${
                newestAddedIndex >= newestAddedNovels.length - 1 
                  ? `border-${themeStyles.border} ${themeStyles.accentText} cursor-not-allowed` 
                  : 'border-current text-current hover:text-[#FF3D00] hover:border-[#FF3D00] active:scale-95'
              }`}
              aria-label="Slide Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div 
          className="overflow-hidden w-full relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="flex transition-transform duration-500 ease-out gap-6"
            style={{ transform: `translateX(-${newestAddedIndex * 290}px)` }}
          >
            {newestAddedNovels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} variant="slider" />
            ))}
          </div>
        </div>
        
        <p className={`text-[10px] font-mono ${themeStyles.accentText} text-center md:hidden pt-2`}>
          &larr; Swipe to view more novels &rarr;
        </p>
      </section>

      {/* 5. COLLECTION PREVIEW */}
      <section className={`space-y-6 pt-6 border-t ${themeStyles.border}`}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-tight text-current font-sans">Translation Directory</h3>
            <p className={`text-xs font-mono ${themeStyles.accentText}`}>A curated selection of light novels actively being translated.</p>
          </div>
          <button 
            onClick={() => navigateToBrowse('ALL')}
            className="text-xs font-mono text-[#FF3D00] font-bold hover:underline flex items-center gap-1.5 uppercase bg-transparent border-none cursor-pointer"
          >
            <span>View Full Directory</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {novels.slice(0, 4).map((novel) => (
            <NovelCard key={novel.id} novel={novel} variant="list" />
          ))}
        </div>

        <div className="pt-4 text-center">
          <button 
            onClick={() => navigateToBrowse('ALL')}
            className="inline-flex items-center space-x-2 border-2 border-[#FF3D00] text-[#FF3D00] font-mono text-xs font-black py-3.5 px-8 uppercase hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-all cursor-pointer bg-transparent"
          >
            <span>Show Complete Collection ({novels.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </main>
  );
};

export default DashboardPage;

