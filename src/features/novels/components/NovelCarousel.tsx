import React from 'react';
import { Compass, BookOpen } from 'lucide-react';
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
  const { carouselIndex, selectIndex } = useCarousel(recommendedNovels);
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
      return <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-contain" />;
    }
    return COVERS[novel.id] || COVERS['red-sunset'];
  };

  return (
    <section className={`border border-[#FF3D00] ${themeStyles.cardBg} relative overflow-hidden transition-all duration-700`}>
      <div className="absolute top-0 left-0 bg-[#FF3D00] text-[#0A0A0A] font-mono text-[9px] tracking-widest px-3 py-1.5 font-extrabold uppercase z-10 flex items-center gap-1.5">
        <Compass className="w-3.5 h-3.5 animate-spin" />
        Recommendation &bull; Rotates Every 5s
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
            {/* Visual Cover on left */}
            <div className={`lg:col-span-4 h-72 lg:h-[420px] border-b lg:border-b-0 lg:border-r ${themeStyles.border} relative overflow-hidden ${themeStyles.bg} p-4 flex items-center justify-center`}>
              <div className="w-full h-full flex items-center justify-center">
                {renderCover(novel)}
              </div>
            </div>

            {/* Info and action description */}
            <div className="lg:col-span-8 p-6 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4 pt-4 sm:pt-0">
                <div className="flex items-center space-x-2 text-[10px] font-mono text-[#FF3D00] font-bold">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>TRANSLATED LIGHT NOVEL &bull; RATING {novel.rating} ★</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tighter text-current leading-none uppercase">
                  {novel.title}
                </h2>
                <p className={`text-xs sm:text-sm font-serif ${themeStyles.accentText} italic`}>
                  {novel.alternativeTitle}
                </p>
                <p className={`text-sm ${themeStyles.accentText} font-serif leading-relaxed line-clamp-3`}>
                  {novel.synopsis}
                </p>
              </div>

              <div className={`flex flex-wrap items-center gap-4 pt-4 border-t ${themeStyles.border}/60`}>
                <button 
                  onClick={() => handleStartReading(novel)}
                  className="bg-[#FF3D00] text-[#0A0A0A] text-xs font-mono font-bold py-3.5 px-6 uppercase hover:bg-white transition-colors cursor-pointer border-none"
                >
                  Read Now
                </button>
                <button 
                  onClick={() => toggleBookmark(novel.id)}
                  className={`border ${themeStyles.border} hover:border-[#FAFAFA] text-xs font-mono py-3.5 px-5 uppercase transition-colors cursor-pointer bg-transparent text-current`}
                >
                  {bookmarks.includes(novel.id) ? "Saved to Shelf" : "Save to Shelf"}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Slider Indicators (Dots) */}
      <div className="absolute bottom-4 right-6 flex space-x-2 z-10">
        {recommendedNovels.map((_, dotIdx) => (
          <button 
            key={dotIdx}
            onClick={() => selectIndex(dotIdx)}
            className={`h-2 transition-all cursor-pointer border-none ${dotIdx === carouselIndex ? 'w-8 bg-[#FF3D00]' : `w-2 ${themeStyles.accentText === 'text-[#737373]' ? 'bg-[#737373]' : 'bg-current/30'}`}`}
            title={`Slide ${dotIdx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default NovelCarousel;

