import React, { useRef, useState, useEffect, useMemo } from 'react';
import { BookOpen, Clock, ChevronLeft, ChevronRight, TrendingUp, Sparkles, Compass, Layers, ArrowRight, Star, Flame } from 'lucide-react';
import { useNovelStore } from '../store/novelStore';
import { useLibraryStore } from '../../library/store/libraryStore';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';
import { getFlatChapters, getRelativeTime } from '../utils';
import { NovelCarousel } from './NovelCarousel';
import { NovelCard } from './NovelCard';
import { Chapter, Novel, Recommendation } from '../../../types';
import { COVERS } from '../../../assets/covers';

export const DashboardPage: React.FC = () => {
  const novels = useNovelStore((state) => state.novels);
  const setSelectedGenre = useNovelStore((state) => state.setSelectedGenre);
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const setSelectedNovel = useNovelStore((state) => state.setSelectedNovel);
  
  const history = useLibraryStore((state) => state.history);
  const readChapters = useLibraryStore((state) => state.readChapters);
  const logReadingProgress = useLibraryStore((state) => state.logReadingProgress);
  const markChapterAsRead = useLibraryStore((state) => state.markChapterAsRead);

  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  const sliderRef = useRef<HTMLDivElement>(null);

  // Load recommendations from API, fallback to empty
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  useEffect(() => {
    fetch('/api/recommendations')
      .then(res => res.ok ? res.json() : [])
      .then((recs: Recommendation[]) => setRecommendations(recs.sort((a, b) => a.order - b.order)))
      .catch(() => setRecommendations([]));
  }, []);

  const recommendedNovels = useMemo(() => {
    return recommendations
      .map(rec => novels.find(n => n.id === rec.novelId))
      .filter((n): n is Novel => !!n);
  }, [recommendations, novels]);

  const totalChapters = useMemo(() => {
    return novels.reduce((acc, n) => acc + n.volumes.reduce((vAcc, v) => vAcc + (v.chapters?.length || 0), 0), 0);
  }, [novels]);

  const popularGenres = useMemo(() => {
    const set = new Set<string>();
    novels.forEach(n => n.genres.forEach(g => set.add(g.toUpperCase())));
    return ['ALL', ...Array.from(set).slice(0, 8)];
  }, [novels]);

  const parseNum = (val: string | number | undefined) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return parseFloat(String(val).replace(/,/g, '')) || 0;
  };

  const topTrendingNovels = useMemo(() => {
    return [...novels]
      .sort((a, b) => parseNum(b.views) - parseNum(a.views) || parseNum(b.rating) - parseNum(a.rating))
      .slice(0, 5);
  }, [novels]);

  const newestAddedNovels = useMemo(() => {
    return [...novels].sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
  }, [novels]);

  const recentReleases = useMemo(() => {
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
    return releases.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime()).slice(0, 6);
  }, [novels]);

  const handleNavigateToReader = (novel: Novel, chapter: Chapter) => {
    setSelectedNovel(novel);
    useReaderStore.getState().setActiveChapter(chapter);
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

  const handleNovelClick = (novel: Novel) => {
    setSelectedNovel(novel);
    setCurrentPage('detail');
  };

  const navigateToBrowse = (genre = 'ALL') => {
    setSelectedGenre(genre);
    setCurrentPage('browse');
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const card = sliderRef.current.firstElementChild as HTMLElement | null;
      const cardWidth = card ? card.offsetWidth + 20 : 300;
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const renderCover = (novel: Novel) => {
    if (novel.coverImage) {
      return (
        <img 
          src={novel.coverImage} 
          alt={novel.title} 
          loading="lazy" 
          decoding="async"
          className="w-full h-full object-cover" 
        />
      );
    }
    return COVERS[novel.id] || COVERS['red-sunset'];
  };

  if (novels.length === 0) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-24 flex flex-col items-center justify-center text-center space-y-6">
        <div className={`border ${themeStyles.border} ${themeStyles.cardBg} p-8 max-w-md space-y-4 shadow-2xl`}>
          <BookOpen className="w-12 h-12 text-[#FF3D00] mx-auto" />
          <h2 className="text-lg font-black uppercase tracking-tight text-current font-sans">No Novels Added Yet</h2>
          <p className={`text-xs font-mono leading-relaxed ${themeStyles.accentText}`}>
            The manuscript database is currently empty. Please access the Admin Dashboard to seed or upload novels.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-10 sm:space-y-12">
      
      {/* 1. PLATFORM TELEMETRY STATS BAR */}
      <div className={`border ${themeStyles.border} ${themeStyles.cardBg} px-4 py-3 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-[10px] font-mono select-none`}>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span className="text-[#FF3D00] font-black">01 //</span>
          <span>ARCHIVES:</span>
          <strong className="text-current font-bold">{novels.length} TITLES</strong>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span className="text-[#FF3D00] font-black">02 //</span>
          <span>CHAPTERS:</span>
          <strong className="text-current font-bold">{totalChapters.toLocaleString()} TRANSLATED</strong>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span className="text-[#FF3D00] font-black">03 //</span>
          <span>GENRES:</span>
          <strong className="text-current font-bold">{popularGenres.length - 1} CATEGORIES</strong>
        </div>
        <div className="flex items-center gap-1.5 text-[#FF3D00] font-bold">
          <span className="w-1.5 h-1.5 bg-[#FF3D00] rounded-full animate-pulse"></span>
          <span>100% FREE ACCESS</span>
        </div>
      </div>

      {/* 2. HERO FEATURED CAROUSEL */}
      <NovelCarousel recommendedNovels={recommendedNovels.length > 0 ? recommendedNovels : novels.slice(0, 3)} />

      {/* 3. DYNAMIC "CONTINUE READING" WITH COVER THUMBNAILS */}
      {history.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono text-[#FF3D00] font-bold">
              <span className="w-2 h-2 bg-[#FF3D00] animate-pulse"></span>
              <span className="tracking-widest uppercase">CONTINUE READING</span>
            </div>
            <button 
              onClick={() => setCurrentPage('library')}
              className="text-[10px] font-mono uppercase text-zinc-400 hover:text-[#FF3D00] transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1"
            >
              <span>View Library</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.slice(0, 2).map((item) => {
              const novel = novels.find(n => n.id === item.novelId);
              const flatChaps = novel ? getFlatChapters(novel) : [];
              const activeChap = flatChaps.find(c => c.id === item.chapterId);
              
              if (!novel || !activeChap) return null;

              const chapIndex = flatChaps.findIndex(c => c.id === item.chapterId);
              const progressPercent = Math.round(((chapIndex + 1) / Math.max(1, flatChaps.length)) * 100);
              
              return (
                <div 
                  key={item.novelId} 
                  onClick={() => handleNavigateToReader(novel, activeChap)}
                  className={`border ${themeStyles.border} ${themeStyles.cardBg} relative overflow-hidden flex flex-col justify-between hover:border-[#FF3D00] hover:shadow-[3px_3px_0px_0px_#FF3D00] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer group`}
                >
                  <div className="p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4">
                    {/* Visual Cover Thumbnail */}
                    <div className={`w-14 h-20 sm:w-16 sm:h-24 border ${themeStyles.border} shrink-0 ${themeStyles.bg} overflow-hidden flex items-center justify-center`}>
                      {renderCover(novel)}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono ${themeStyles.accentText} tracking-widest block uppercase truncate`}>
                          LAST READ: {item.timestamp}
                        </span>
                        <span className="text-[9px] font-mono text-[#FF3D00] font-black bg-[#FF3D00]/10 px-1.5 py-0.2 border border-[#FF3D00]/20 shrink-0">
                          {progressPercent}%
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-current truncate group-hover:text-[#FF3D00] transition-colors">{novel.title}</h4>
                      <p className={`text-xs ${themeStyles.accentText} truncate font-serif`}>
                        {activeChap.title} <span className="font-mono text-[10px]">({chapIndex + 1}/{flatChaps.length})</span>
                      </p>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigateToReader(novel, activeChap);
                      }}
                      className="p-2.5 sm:p-3 bg-[#FF3D00] text-[#0A0A0A] group-hover:bg-white transition-colors cursor-pointer border-none shrink-0"
                      aria-label={`Resume reading ${novel.title}`}
                      title="Resume Reading"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Chapter Reading Progress Bar */}
                  <div className="w-full h-1 bg-current/10 overflow-hidden" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
                    <div 
                      className="h-full bg-[#FF3D00] transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. QUICK GENRE DISCOVERY PILLS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-zinc-400 uppercase font-bold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#FF3D00]" />
            <span>DISCOVER BY GENRE</span>
          </span>
          <button
            onClick={() => navigateToBrowse('ALL')}
            className="text-[#FF3D00] hover:underline uppercase font-bold bg-transparent border-none cursor-pointer"
          >
            All Genres &rarr;
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {popularGenres.map((g) => (
            <button
              key={g}
              onClick={() => navigateToBrowse(g)}
              className={`px-3 py-1.5 border ${themeStyles.border} ${themeStyles.cardBg} hover:border-[#FF3D00] hover:text-[#FF3D00] text-[10px] font-mono font-bold uppercase transition-all shrink-0 cursor-pointer rounded-none active:scale-95`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* 5. SYMMETRICAL DUAL-COLUMN: LATEST RELEASES (LEFT) & TOP TRENDING (RIGHT) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Latest Chapter Releases (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className={`border-b ${themeStyles.border} pb-3 flex justify-between items-center`}>
            <div className="flex items-center space-x-2 text-current">
              <Clock className="w-4 h-4 text-[#FF3D00]" />
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight font-sans">Latest Releases</h3>
            </div>
            <button 
              onClick={() => navigateToBrowse('ALL')}
              className="text-[11px] font-mono text-[#FF3D00] hover:underline uppercase font-bold bg-transparent border-none cursor-pointer"
            >
              View More &rarr;
            </button>
          </div>

          <div className={`divide-y ${themeStyles.border.replace('border-', 'divide-')} border ${themeStyles.border}`}>
            {recentReleases.length === 0 ? (
              <div className={`p-8 ${themeStyles.cardBg} text-center`}>
                <p className={`text-xs font-mono ${themeStyles.accentText}`}>No chapters released yet.</p>
              </div>
            ) : recentReleases.map((rel, index) => {
              const isRead = readChapters.includes(rel.chapter.id);
              return (
                <div 
                  key={index} 
                  className={`p-3.5 sm:p-4 ${themeStyles.cardBg} hover:bg-[#FF3D00]/5 hover:border-l-2 hover:border-l-[#FF3D00] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 cursor-pointer group`}
                  onClick={() => handleNavigateToReader(rel.novel, rel.chapter)}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-[9px] font-mono text-[#FF3D00] font-black uppercase bg-[#FF3D00]/10 px-1.5 py-0.2 shrink-0">
                        {rel.novel.genres[0] || 'NOVEL'}
                      </span>
                      <span className="text-xs font-bold text-current group-hover:text-[#FF3D00] transition-colors truncate">
                        {rel.novel.title}
                      </span>
                      {isRead && (
                        <span className={`text-[9px] font-mono ${themeStyles.accentText} uppercase tracking-wider ${themeStyles.cardBg} px-1.5 py-0.2 border ${themeStyles.border} shrink-0`}>✓ Read</span>
                      )}
                    </div>
                    <p className={`text-xs sm:text-sm font-extrabold truncate ${isRead ? `${themeStyles.accentText} line-through` : 'text-current'}`}>
                      {rel.chapter.title}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-current/10">
                    <span className={`text-[11px] font-mono ${themeStyles.accentText} flex items-center gap-1`}>
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {getRelativeTime(rel.chapter.publishDate)}
                    </span>
                    <span className="text-xs font-mono text-[#FF3D00] font-black uppercase flex items-center group-hover:translate-x-0.5 transition-transform">
                      {isRead ? 'RE-READ' : 'READ'} <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Top Trending Leaderboard (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className={`border-b ${themeStyles.border} pb-3 flex justify-between items-center`}>
            <div className="flex items-center space-x-2 text-current">
              <Flame className="w-4 h-4 text-[#FF3D00]" />
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight font-sans">Top Trending</h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">BY POPULARITY</span>
          </div>

          <div className={`divide-y ${themeStyles.border.replace('border-', 'divide-')} border ${themeStyles.border}`}>
            {topTrendingNovels.map((novel, rankIdx) => {
              const rank = rankIdx + 1;
              const rankBadge = rank === 1
                ? 'bg-[#FF3D00] text-[#0A0A0A]'
                : rank <= 3
                ? 'bg-amber-400 text-[#0A0A0A]'
                : 'bg-zinc-800 text-zinc-300';

              return (
                <div
                  key={novel.id}
                  onClick={() => handleNovelClick(novel)}
                  className={`p-3 ${themeStyles.cardBg} hover:bg-[#FF3D00]/5 transition-all flex items-center gap-3 cursor-pointer group`}
                >
                  {/* Rank Indicator */}
                  <div className={`w-7 h-7 ${rankBadge} font-mono font-black text-xs flex items-center justify-center shrink-0`}>
                    #{rank}
                  </div>

                  {/* Novel Cover */}
                  <div className={`w-10 h-14 border ${themeStyles.border} shrink-0 ${themeStyles.bg} overflow-hidden flex items-center justify-center`}>
                    {renderCover(novel)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-current group-hover:text-[#FF3D00] transition-colors truncate uppercase">
                      {novel.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                      <span className="truncate">{novel.author}</span>
                      <span>&bull;</span>
                      <span className="text-amber-400 font-bold shrink-0">★ {novel.rating}</span>
                    </div>
                    <div className="text-[9px] font-mono text-zinc-500">
                      {parseNum(novel.views).toLocaleString()} views &bull; {novel.volumes.length} vol(s)
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#FF3D00] group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              );
            })}
          </div>
        </div>

      </section>

      {/* 6. RECENTLY ADDED SNAP SLIDER */}
      <section className="space-y-4 relative">
        <div className={`border-b ${themeStyles.border} pb-3 flex justify-between items-center text-current`}>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-[#FF3D00]" />
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight font-sans">Recently Added Manuscripts</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => scrollSlider('left')} 
              className="p-1.5 border border-current text-current hover:text-[#FF3D00] hover:border-[#FF3D00] active:scale-95 transition-all cursor-pointer bg-transparent"
              aria-label="Slide Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => scrollSlider('right')} 
              className="p-1.5 border border-current text-current hover:text-[#FF3D00] hover:border-[#FF3D00] active:scale-95 transition-all cursor-pointer bg-transparent"
              aria-label="Slide Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Snap Horizontal Container */}
        <div 
          ref={sliderRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {newestAddedNovels.length === 0 ? (
            <div className="w-full py-12 text-center">
              <p className={`text-xs font-mono ${themeStyles.accentText}`}>No novels added yet.</p>
            </div>
          ) : newestAddedNovels.map((novel) => (
            <div key={novel.id} className="snap-start shrink-0">
              <NovelCard novel={novel} variant="slider" />
            </div>
          ))}
        </div>
      </section>

      {/* 7. CURATED DIRECTORY PREVIEW */}
      <section className={`space-y-6 pt-6 border-t ${themeStyles.border}`}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-tight text-current font-sans">Translation Directory</h3>
            <p className={`text-xs font-mono ${themeStyles.accentText}`}>Actively maintained light novel archives and serialized releases.</p>
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
            className="inline-flex items-center space-x-2 border-2 border-[#FF3D00] text-[#FF3D00] font-mono text-xs font-black py-3.5 px-8 uppercase hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-all cursor-pointer bg-transparent active:scale-95"
          >
            <span>Explore Complete Catalog ({novels.length} Novels)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

    </main>
  );
};

export default DashboardPage;
