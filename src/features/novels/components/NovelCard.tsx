import React from 'react';
import { Novel } from '../../../types';
import { COVERS } from '../../../assets/covers';
import { useNovelStore } from '../store/novelStore';
import { useLibraryStore } from '../../library/store/libraryStore';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';
import { getFlatChapters } from '../utils';

interface NovelCardProps {
  novel: Novel;
  variant: 'slider' | 'list' | 'browse';
}

export const NovelCard: React.FC<NovelCardProps> = ({ novel, variant }) => {
  const setSelectedNovel = useNovelStore((state) => state.setSelectedNovel);
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const bookmarks = useLibraryStore((state) => state.bookmarks);

  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  const handleClick = () => {
    setSelectedNovel(novel);
    setCurrentPage('detail');
  };

  const isBookmarked = bookmarks.includes(novel.id);
  const baseBookmarks = Math.floor(parseInt(novel.views.replace(/[^0-9]/g, '')) / 15) || 42;
  const bookmarkCount = baseBookmarks + (isBookmarked ? 1 : 0);

  const flatChaps = getFlatChapters(novel);
  const latestChapter = flatChaps.length > 0 ? flatChaps[flatChaps.length - 1].title : 'No chapters';

  // Cover image rendering (Base64 uploaded cover or fallback SVG)
  const renderCover = () => {
    if (novel.coverImage) {
      return <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover" />;
    }
    return COVERS[novel.id] || COVERS['red-sunset'];
  };

  if (variant === 'slider') {
    return (
      <div 
        onClick={handleClick}
        className={`w-[266px] min-w-[266px] border ${themeStyles.border} ${themeStyles.cardBg} p-4 flex flex-col justify-between hover:border-[#FF3D00] transition-colors cursor-pointer select-none`}
      >
        <div className="space-y-3">
          <div className={`h-44 ${themeStyles.bg} border ${themeStyles.border} relative overflow-hidden flex items-center justify-center`}>
            {renderCover()}
            <div className="absolute top-2 right-2 bg-[#FF3D00] text-[#0A0A0A] text-[9px] font-mono font-bold px-2 py-0.5">
              {novel.status}
            </div>
          </div>
          <div>
            <div className={`flex items-center justify-between text-[9px] ${themeStyles.accentText} font-mono mb-1`}>
              <span>★ {novel.rating}</span>
              <span>{bookmarkCount} bookmarks</span>
            </div>
            <h4 className="text-sm font-extrabold text-current line-clamp-1 uppercase">{novel.title}</h4>
            <p className={`text-xs ${themeStyles.accentText} font-serif italic line-clamp-1`}>{novel.alternativeTitle}</p>
          </div>
          <p className={`text-xs ${themeStyles.accentText} font-serif leading-relaxed line-clamp-3`}>
            {novel.synopsis}
          </p>
        </div>
        <div className={`pt-4 border-t ${themeStyles.border}/60 mt-4 flex flex-col gap-1 text-[10px] font-mono ${themeStyles.accentText}`}>
          <div className="flex justify-between items-center">
            <span>Latest: <strong className="text-current">{latestChapter}</strong></span>
          </div>
          <div className={`flex justify-between items-center text-[9px] mt-1 pt-1 border-t ${themeStyles.border}/20`}>
            <span>{novel.volumes.length} Volume(s)</span>
            <span className="text-[#FF3D00] font-bold">OPEN &rarr;</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div 
        onClick={handleClick}
        className={`border ${themeStyles.border} ${themeStyles.cardBg} p-4 flex gap-4 hover:border-[#FF3D00] transition-colors cursor-pointer`}
      >
        <div className={`w-20 h-28 border ${themeStyles.border} flex-shrink-0 ${themeStyles.bg} overflow-hidden flex items-center justify-center`}>
          {renderCover()}
        </div>
        <div className="space-y-1 flex-grow">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono text-[#FF3D00] tracking-widest block uppercase font-bold">{novel.author}</span>
            <span className={`text-[9px] font-mono ${themeStyles.accentText}`}>★ {novel.rating} ({bookmarkCount} saved)</span>
          </div>
          <h4 className="text-sm font-black text-current line-clamp-1 uppercase">{novel.title}</h4>
          <p className={`text-xs ${themeStyles.accentText} italic font-serif line-clamp-1`}>{novel.alternativeTitle}</p>
          <p className={`text-xs ${themeStyles.accentText} line-clamp-2`}>{novel.synopsis}</p>
          <div className={`pt-1.5 text-[9px] font-mono ${themeStyles.accentText}`}>
            Latest: <span className="text-current font-bold">{latestChapter}</span>
          </div>
        </div>
      </div>
    );
  }

  // variant === 'browse'
  return (
    <div 
      onClick={handleClick}
      className={`border ${themeStyles.border} ${themeStyles.cardBg} p-5 flex gap-4 hover:border-[#FF3D00] transition-colors cursor-pointer`}
    >
      <div className={`w-24 h-32 border ${themeStyles.border} flex-shrink-0 ${themeStyles.bg} overflow-hidden flex items-center justify-center`}>
        {renderCover()}
      </div>
      <div className="space-y-1 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-mono text-[#FF3D00] uppercase font-bold tracking-wider">{novel.genres.join(', ')}</span>
            <span className={`text-[9px] font-mono ${themeStyles.accentText} uppercase`}>{novel.status}</span>
          </div>
          <h4 className="text-base font-black text-current line-clamp-1 uppercase">{novel.title}</h4>
          <p className={`text-xs ${themeStyles.accentText} italic font-serif line-clamp-1`}>{novel.alternativeTitle}</p>
          <p className={`text-xs ${themeStyles.accentText} line-clamp-2 mt-1`}>{novel.synopsis}</p>
        </div>
        <div className={`pt-2 flex justify-between items-center text-[10px] font-mono ${themeStyles.accentText}`}>
          <span>By {novel.author} &bull; ★ {novel.rating} ({bookmarkCount} bookmarks)</span>
          <span className="text-[#FF3D00] font-black uppercase">READ &rarr;</span>
        </div>
      </div>
    </div>
  );
};

export default NovelCard;

