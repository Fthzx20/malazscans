import React from 'react';
import { BookMarked } from 'lucide-react';
import { useNovelStore } from '../../novels/store/novelStore';
import { Novel } from '../../../types';
import { useBookmarks } from '../hooks/useBookmarks';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';
import { COVERS } from '../../../assets/covers';

export const LibraryPage: React.FC = () => {
  const novels = useNovelStore((state) => state.novels);
  const setSelectedNovel = useNovelStore((state) => state.setSelectedNovel);
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const { bookmarks, toggleBookmark } = useBookmarks();

  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  const bookmarkedNovels = novels.filter((n) => bookmarks.includes(n.id));

  const handleRead = (novel: Novel) => {
    setSelectedNovel(novel);
    setCurrentPage('detail');
  };

  const handleSearch = () => {
    setCurrentPage('dashboard');
  };

  const renderCover = (novel: Novel) => {
    if (novel.coverImage) {
      return <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover" />;
    }
    return COVERS[novel.id] || COVERS['red-sunset'];
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className={`border-b ${themeStyles.border} pb-6 space-y-1`}>
        <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter text-current font-sans">Your Bookshelf</h1>
        <p className={`text-xs font-mono ${themeStyles.accentText}`}>A collection of light novels you&apos;ve saved to read later.</p>
      </div>

      {bookmarkedNovels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bookmarkedNovels.map((novel) => {
            return (
              <div 
                key={novel.id} 
                className={`border ${themeStyles.border} ${themeStyles.cardBg} p-4 flex flex-col justify-between`}
              >
                <div className="space-y-4">
                  <div className={`h-44 border ${themeStyles.border} ${themeStyles.bg} overflow-hidden flex items-center justify-center`}>
                    {renderCover(novel)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-current truncate">{novel.title}</h3>
                    <p className={`text-xs ${themeStyles.accentText} italic font-serif truncate`}>{novel.alternativeTitle}</p>
                  </div>
                </div>
                <div className={`pt-4 border-t ${themeStyles.border} mt-4 flex justify-between items-center text-xs font-mono`}>
                  <button 
                    onClick={() => handleRead(novel)}
                    className="text-[#FF3D00] font-bold bg-transparent border-none cursor-pointer"
                  >
                    READ &rarr;
                  </button>
                  <button 
                    onClick={() => toggleBookmark(novel.id)}
                    className={`text-[#737373] hover:text-red-500 bg-transparent border-none cursor-pointer`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`border border-dashed ${themeStyles.border} py-16 text-center space-y-4`}>
          <BookMarked className={`w-8 h-8 ${themeStyles.accentText} mx-auto`} />
          <p className={`text-xs font-mono ${themeStyles.accentText}`}>Your bookshelf is empty. Find light novels from the directory.</p>
          <button 
            onClick={handleSearch}
            className="bg-[#FF3D00] text-[#0A0A0A] font-mono text-xs font-bold py-2.5 px-6 uppercase cursor-pointer border-none"
          >
            Browse Catalog
          </button>
        </div>
      )}
    </main>
  );
};
export default LibraryPage;

