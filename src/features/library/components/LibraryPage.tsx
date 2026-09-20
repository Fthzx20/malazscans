import React, { useState } from 'react';
import { BookMarked, Clock, BookOpen, Trash2, ArrowRight } from 'lucide-react';
import { useNovelStore } from '../../novels/store/novelStore';
import { Novel } from '../../../types';
import { useBookmarks } from '../hooks/useBookmarks';
import { useHistory } from '../hooks/useHistory';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';
import { getFlatChapters } from '../../novels/utils';
import { COVERS } from '../../../assets/covers';

export const LibraryPage: React.FC = () => {
  const novels = useNovelStore((state) => state.novels);
  const setSelectedNovel = useNovelStore((state) => state.setSelectedNovel);
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const triggerToast = useNovelStore((state) => state.triggerToast);
  
  const { bookmarks, toggleBookmark } = useBookmarks();
  const { history, clearReadChapters } = useHistory();

  const readerSettings = useReaderStore((state) => state.readerSettings);
  const setActiveChapter = useReaderStore((state) => state.setActiveChapter);
  const themeStyles = getThemeStyles(readerSettings.theme);

  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history'>('bookmarks');

  const bookmarkedNovels = novels.filter((n) => bookmarks.includes(n.id));

  const handleRead = (novel: Novel) => {
    setSelectedNovel(novel);
    setCurrentPage('detail');
  };

  const handleContinueReading = (novel: Novel, chapterId: string) => {
    const flatChapters = getFlatChapters(novel);
    const targetChapter = flatChapters.find((c) => c.id === chapterId) || flatChapters[0];
    
    if (!targetChapter) {
      setSelectedNovel(novel);
      setCurrentPage('detail');
      return;
    }

    setSelectedNovel(novel);
    setActiveChapter(targetChapter);
    setCurrentPage('reader');
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear all reading history?")) {
      clearReadChapters();
      triggerToast("Reading history cleared.");
    }
  };

  const renderCover = (novel: Novel) => {
    if (novel.coverImage) {
      return <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover" />;
    }
    return COVERS[novel.id] || COVERS['red-sunset'];
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className={`border-b ${themeStyles.border} pb-6 space-y-1`}>
        <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter text-current font-sans">Library</h1>
        <p className={`text-xs font-mono ${themeStyles.accentText}`}>Your saved light novels collection and reading history.</p>
      </div>

      {/* Segmented Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-current/15 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-mono font-bold cursor-pointer transition-colors border ${
              activeTab === 'bookmarks'
                ? 'border-[#FF3D00] bg-[#FF3D00] text-[#0A0A0A]'
                : `border-current/20 bg-transparent text-current/80 hover:border-[#FF3D00] hover:text-[#FF3D00]`
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>BOOKMARKS</span>
            <span className={`text-[10px] px-1.5 py-0.2 ${
              activeTab === 'bookmarks' ? 'bg-[#0A0A0A] text-[#FF3D00]' : 'bg-current/10 text-current'
            }`}>
              {bookmarkedNovels.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-mono font-bold cursor-pointer transition-colors border ${
              activeTab === 'history'
                ? 'border-[#FF3D00] bg-[#FF3D00] text-[#0A0A0A]'
                : `border-current/20 bg-transparent text-current/80 hover:border-[#FF3D00] hover:text-[#FF3D00]`
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>READING HISTORY</span>
            <span className={`text-[10px] px-1.5 py-0.2 ${
              activeTab === 'history' ? 'bg-[#0A0A0A] text-[#FF3D00]' : 'bg-current/10 text-current'
            }`}>
              {history.length}
            </span>
          </button>
        </div>

        {activeTab === 'history' && history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1 text-[10px] font-mono text-[#737373] hover:text-red-500 bg-transparent border-none cursor-pointer"
            title="Clear reading history"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Clear History</span>
          </button>
        )}
      </div>

      {/* Tab Content: Bookmarks */}
      {activeTab === 'bookmarks' && (
        <>
          {bookmarkedNovels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {bookmarkedNovels.map((novel) => (
                <div 
                  key={novel.id} 
                  className={`border ${themeStyles.border} ${themeStyles.cardBg} p-4 flex flex-col justify-between hover:border-[#FF3D00]/70 transition-colors`}
                >
                  <div className="space-y-3">
                    <div className={`h-48 border ${themeStyles.border} ${themeStyles.bg} overflow-hidden flex items-center justify-center relative`}>
                      {renderCover(novel)}
                      <span className="absolute top-2 right-2 bg-[#FF3D00] text-[#0A0A0A] text-[9px] font-mono font-bold px-2 py-0.5">
                        {novel.status}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-current truncate uppercase">{novel.title}</h3>
                      <p className={`text-xs ${themeStyles.accentText} italic font-serif truncate`}>{novel.alternativeTitle}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-current/60">
                        <span>★ {novel.rating}</span>
                        <span>&bull;</span>
                        <span>{novel.author}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`pt-3 border-t ${themeStyles.border} mt-4 flex justify-between items-center text-xs font-mono`}>
                    <button 
                      onClick={() => handleRead(novel)}
                      className="text-[#FF3D00] font-bold bg-transparent border-none cursor-pointer hover:underline flex items-center gap-1"
                    >
                      <span>NOVEL DETAILS</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => toggleBookmark(novel.id)}
                      className="text-[#737373] hover:text-red-500 bg-transparent border-none cursor-pointer text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`border border-dashed ${themeStyles.border} py-16 px-4 text-center space-y-4`}>
              <BookMarked className={`w-10 h-10 ${themeStyles.accentText} mx-auto`} />
              <p className={`text-xs font-mono ${themeStyles.accentText}`}>Your bookshelf is empty. Discover exciting novels in our catalog.</p>
              <button 
                onClick={() => setCurrentPage('browse')}
                className="bg-[#FF3D00] text-[#0A0A0A] font-mono text-xs font-bold py-2.5 px-6 uppercase cursor-pointer border-none hover:bg-white transition-colors"
              >
                Browse Catalog
              </button>
            </div>
          )}
        </>
      )}

      {/* Tab Content: Reading History */}
      {activeTab === 'history' && (
        <>
          {history.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {history.map((item) => {
                const novel = novels.find((n) => n.id === item.novelId);
                if (!novel) return null;

                const flatChaps = getFlatChapters(novel);
                const chapIdx = flatChaps.findIndex((c) => c.id === item.chapterId);
                const progressPercent = chapIdx >= 0
                  ? Math.round(((chapIdx + 1) / Math.max(1, flatChaps.length)) * 100)
                  : 0;

                return (
                  <div 
                    key={`${item.novelId}-${item.chapterId}`}
                    className={`border ${themeStyles.border} ${themeStyles.cardBg} p-4 flex flex-col justify-between hover:border-[#FF3D00]/70 transition-colors`}
                  >
                    <div className="space-y-3">
                      <div className={`h-44 border ${themeStyles.border} ${themeStyles.bg} overflow-hidden flex items-center justify-center relative`}>
                        {renderCover(novel)}
                        {progressPercent > 0 && (
                          <span className="absolute bottom-2 right-2 bg-[#0A0A0A]/90 border border-[#FF3D00] text-[#FF3D00] text-[9px] font-mono font-bold px-2 py-0.5">
                            {progressPercent}%
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-current/60">
                          <span className="truncate">{item.timestamp}</span>
                        </div>
                        <h3 className="text-sm font-black text-current truncate uppercase">{novel.title}</h3>
                        <p className={`text-xs font-mono text-[#FF3D00] truncate font-bold`}>
                          {item.chapterTitle}
                        </p>
                      </div>
                    </div>

                    <div className={`pt-3 border-t ${themeStyles.border} mt-4 flex justify-between items-center text-xs font-mono`}>
                      <button 
                        onClick={() => handleContinueReading(novel, item.chapterId)}
                        className="w-full py-2 bg-[#FF3D00] hover:bg-white hover:text-black text-black font-black uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>CONTINUE READING</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`border border-dashed ${themeStyles.border} py-16 px-4 text-center space-y-4`}>
              <Clock className={`w-10 h-10 ${themeStyles.accentText} mx-auto`} />
              <p className={`text-xs font-mono ${themeStyles.accentText}`}>No reading history yet. Start reading your favorite novel now!</p>
              <button 
                onClick={() => setCurrentPage('browse')}
                className="bg-[#FF3D00] text-[#0A0A0A] font-mono text-xs font-bold py-2.5 px-6 uppercase cursor-pointer border-none hover:bg-white transition-colors"
              >
                Start Reading
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default LibraryPage;
