import React from 'react';
import { Compass, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Novel } from '../../../types';
import { COVERS } from '../../../assets/covers';
import { useNovelStore } from '../store/novelStore';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';
import { useCarousel } from '../hooks/useCarousel';
import { useBookmarks } from '../../library/hooks/useBookmarks';

interface NovelCarouselProps {
  recommendedNovels: Novel[];
}

export const NovelCarousel: React.FC<NovelCarouselProps> = ({ recommendedNovels }) => {
  const setSelectedNovel = useNovelStore((state) => state.setSelectedNovel);
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const { carouselIndex, selectIndex, pause, resume } = useCarousel(recommendedNovels);
  const { bookmarks, toggleBookmark } = useBookmarks();

  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  if (recommendedNovels.length === 0) {
    return (
      <section className={`border border-[#262626] ${themeStyles.cardBg} p-8 text-center`}>
        <p className={`text-xs font-mono ${themeStyles.accentText}`}>No recommendations yet. Add novels and set them as recommended in the Admin Dashboard.</p>
      </section>
    );
  }

  const handleStartReading = (novel: Novel) => {
    setSelectedNovel(novel);
    setCurrentPage('detail');
  };

  const renderCover = (novel: Novel) => {
    if (novel.coverImage) {
      return (
        <img 
          src={novel.coverImage} 
          alt={novel.title} 
          decoding="async"
          className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]" 
        />
      );
    }
    return (
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {COVERS[novel.id] || COVERS['red-sunset']}
      </div>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      selectIndex((carouselIndex - 1 + recommendedNovels.length) % recommendedNovels.length);
    } else if (e.key === 'ArrowRight') {
      selectIndex((carouselIndex + 1) % recommendedNovels.length);
    }
  };

  return (
    <section 
      onMouseEnter={pause}
      onMouseLeave={resume}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Featured Novels Carousel"
      className={`border border-[#FF3D00] ${themeStyles.cardBg} relative overflow-hidden transition-all duration-700 outline-none focus:ring-1 focus:ring-[#FF3D00]`}
    >
      <div className="absolute top-0 left-0 bg-[#FF3D00] text-[#0A0A0A] font-mono text-[9px] tracking-widest px-3 py-1 font-extrabold uppercase z-10 flex items-center gap-1.5 shadow-md">
        <Compass className="w-3 h-3 text-black" />
        FEATURED RELEASE
      </div>

      {recommendedNovels.map((novel, idx) => {
        const isActive = idx === carouselIndex;
        return (
          <div 
            key={novel.id} 
            className={`grid grid-cols-1 lg:grid-cols-12 transition-all duration-700 ease-in-out ${
              isActive ? 'opacity-100 relative translate-x-0' : 'opacity-0 absolute inset-0 -translate-x-12 pointer-events-none'
            }`}
          >
            {/* Visual Cover on left with Ambient Cyberpunk Glow */}
            <div className={`lg:col-span-4 h-64 sm:h-80 lg:h-[420px] border-b lg:border-b-0 lg:border-r ${themeStyles.border} relative overflow-hidden ${themeStyles.bg} p-4 flex items-center justify-center`}>
              {/* Ambient Glow Backdrop */}
              <div 
                className="absolute inset-0 bg-[#FF3D00]/20 blur-3xl pointer-events-none scale-90"
                aria-hidden="true"
              />

              <div className="w-full h-full flex items-center justify-center relative">
                {renderCover(novel)}
              </div>
            </div>

            {/* Info and action description */}
            <div className="lg:col-span-8 p-5 sm:p-8 lg:p-10 flex flex-col justify-between space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-0">
                <div className="flex items-center space-x-2 text-[10px] font-mono text-[#FF3D00] font-bold">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>★ {novel.rating} &bull; {novel.genres?.[0] || 'LIGHT NOVEL'}</span>
                </div>
                <h2 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tighter text-current leading-tight sm:leading-none uppercase">
                  {novel.title}
                </h2>
                <p className={`text-xs sm:text-sm font-serif ${themeStyles.accentText} italic line-clamp-1`}>
                  {novel.alternativeTitle}
                </p>
                <p className={`text-xs sm:text-sm ${themeStyles.accentText} font-serif leading-relaxed line-clamp-3`}>
                  {novel.synopsis}
                </p>
              </div>

              <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 pt-4 border-t ${themeStyles.border}/60 pb-8 sm:pb-0`}>
                <button 
                  onClick={() => handleStartReading(novel)}
                  className="w-full sm:w-auto bg-[#FF3D00] text-[#0A0A0A] text-xs font-mono font-bold py-3 sm:py-3.5 px-6 uppercase hover:bg-white transition-colors cursor-pointer border-none active:scale-95 text-center"
                >
                  Read Now
                </button>
                <button 
                  onClick={() => toggleBookmark(novel.id)}
                  className={`w-full sm:w-auto border ${themeStyles.border} hover:border-[#FAFAFA] text-xs font-mono py-3 sm:py-3.5 px-5 uppercase transition-colors cursor-pointer bg-transparent text-current active:scale-95 text-center`}
                >
                  {bookmarks.includes(novel.id) ? "Bookmarked" : "Bookmark"}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Slider Controls & Indicators */}
      <div className="absolute bottom-4 right-6 flex items-center space-x-3 z-10">
        <button
          onClick={() => selectIndex((carouselIndex - 1 + recommendedNovels.length) % recommendedNovels.length)}
          className={`p-1 border border-current/20 hover:border-[#FF3D00] hover:text-[#FF3D00] text-current/70 transition-colors cursor-pointer bg-transparent`}
          aria-label="Previous Featured Novel"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex space-x-1.5">
          {recommendedNovels.map((_, dotIdx) => (
            <button 
              key={dotIdx}
              onClick={() => selectIndex(dotIdx)}
              className={`h-2 transition-all cursor-pointer border-none ${dotIdx === carouselIndex ? 'w-6 bg-[#FF3D00]' : `w-2 ${themeStyles.accentText === 'text-[#737373]' ? 'bg-[#737373]' : 'bg-current/30'}`}`}
              title={`Slide ${dotIdx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => selectIndex((carouselIndex + 1) % recommendedNovels.length)}
          className={`p-1 border border-current/20 hover:border-[#FF3D00] hover:text-[#FF3D00] text-current/70 transition-colors cursor-pointer bg-transparent`}
          aria-label="Next Featured Novel"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};

export default NovelCarousel;

