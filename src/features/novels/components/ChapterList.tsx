import React, { useState, useMemo } from 'react';
import { Search, X, Lock, Unlock, ArrowUpDown, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { Novel, Chapter } from '../../../types';
import { useNovelStore } from '../store/novelStore';
import { useReaderStore } from '../../reader/store/readerStore';
import { useCoinStore } from '../../coins/store/coinStore';
import { getThemeStyles } from '../../reader/utils/theme';
import { useHistory } from '../../library/hooks/useHistory';

interface ChapterListProps {
  novel: Novel;
}

export const ChapterList: React.FC<ChapterListProps> = ({ novel }) => {
  const setSelectedNovel = useNovelStore((state) => state.setSelectedNovel);
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const setActiveChapter = useReaderStore((state) => state.setActiveChapter);
  const { readChapters, logReadingProgress, markChapterAsRead } = useHistory();
  const isChapterUnlocked = useCoinStore((state) => state.isChapterUnlocked);

  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [collapsedVolumes, setCollapsedVolumes] = useState<Record<number, boolean>>({});

  const query = searchQuery.trim().toLowerCase();

  const totalChapters = useMemo(() => {
    return novel.volumes.reduce((acc, vol) => acc + (vol.chapters?.length || 0), 0);
  }, [novel.volumes]);

  const processedVolumes = useMemo(() => {
    let vols = novel.volumes;

    if (query) {
      vols = vols
        .map((vol) => ({
          ...vol,
          chapters: (vol.chapters || []).filter(
            (c) => c.title.toLowerCase().includes(query) || String(c.id).toLowerCase().includes(query)
          ),
        }))
        .filter((vol) => vol.chapters.length > 0);
    }

    if (sortOrder === 'desc') {
      return [...vols].reverse().map((vol) => ({
        ...vol,
        chapters: [...vol.chapters].reverse(),
      }));
    }

    return vols;
  }, [novel.volumes, query, sortOrder]);

  const totalFilteredChapters = useMemo(() => {
    return processedVolumes.reduce((acc, vol) => acc + vol.chapters.length, 0);
  }, [processedVolumes]);

  const toggleVolume = (volumeNumber: number) => {
    setCollapsedVolumes((prev) => ({
      ...prev,
      [volumeNumber]: !prev[volumeNumber],
    }));
  };

  const toggleAllVolumes = () => {
    const anyOpen = processedVolumes.some((v) => !collapsedVolumes[v.volumeNumber]);
    const next: Record<number, boolean> = {};
    processedVolumes.forEach((v) => {
      next[v.volumeNumber] = anyOpen;
    });
    setCollapsedVolumes(next);
  };

  const handleChapterClick = (chapter: Chapter) => {
    setSelectedNovel(novel);
    setActiveChapter(chapter);
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

  return (
    <section className={`space-y-4 pt-8 border-t ${themeStyles.border}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h3 className="text-lg font-black uppercase tracking-tight text-current">Available Chapters</h3>
          <span className={`text-xs font-mono ${themeStyles.accentText} font-bold`}>
            ({totalFilteredChapters}{query ? ` of ${totalChapters}` : ''})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Chapter Search Bar */}
          <div className="relative flex-1 sm:w-64 min-w-[180px]">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-3 ${themeStyles.accentText} pointer-events-none`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chapter..."
              className={`w-full ${themeStyles.cardBg} border ${themeStyles.border} py-2 pl-9 pr-8 text-xs font-mono text-current focus:border-[#FF3D00] focus:outline-none rounded-none`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-2.5 top-2.5 ${themeStyles.accentText} hover:text-[#FF3D00] bg-transparent border-none cursor-pointer p-0`}
                aria-label="Clear chapter search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Order Toggle (ASC/DESC) */}
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className={`flex items-center gap-1.5 px-3 py-2 border ${themeStyles.border} ${themeStyles.cardBg} hover:border-[#FF3D00] hover:text-[#FF3D00] text-xs font-mono font-bold uppercase transition-colors cursor-pointer rounded-none`}
            title={`Sort order: currently ${sortOrder === 'asc' ? 'Oldest first (Ch 1 → N)' : 'Newest first (Ch N → 1)'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#FF3D00]" />
            <span>{sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}</span>
          </button>

          {/* Expand/Collapse All (if multi-volume) */}
          {processedVolumes.length > 1 && (
            <button
              onClick={toggleAllVolumes}
              className={`flex items-center gap-1.5 px-3 py-2 border ${themeStyles.border} ${themeStyles.cardBg} hover:border-white text-xs font-mono text-current/80 hover:text-white transition-colors cursor-pointer rounded-none`}
              title="Toggle all volumes"
            >
              <Layers className="w-3.5 h-3.5 text-[#FF3D00]" />
              <span className="hidden sm:inline">
                {processedVolumes.some((v) => !collapsedVolumes[v.volumeNumber]) ? 'Collapse All' : 'Expand All'}
              </span>
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {processedVolumes.length === 0 ? (
          <div className={`border ${themeStyles.border} ${themeStyles.cardBg} p-8 text-center space-y-2`}>
            <p className={`text-xs font-mono ${themeStyles.accentText}`}>
              No chapters found matching <span className="text-[#FF3D00] font-bold">&quot;{searchQuery}&quot;</span>
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-mono text-[#FF3D00] hover:underline font-bold bg-transparent border-none cursor-pointer uppercase"
            >
              Clear Filter
            </button>
          </div>
        ) : (
          processedVolumes.map((vol) => {
            const isCollapsed = Boolean(collapsedVolumes[vol.volumeNumber]);
            return (
              <div key={vol.volumeNumber} className={`border ${themeStyles.border} ${themeStyles.cardBg}`}>
                <div 
                  onClick={() => toggleVolume(vol.volumeNumber)}
                  className={`border-b ${themeStyles.border} px-4 py-3 bg-current/[0.04] flex justify-between items-center text-xs font-mono font-bold uppercase text-current cursor-pointer select-none hover:bg-current/[0.07] transition-colors`}
                  title="Click to collapse/expand volume"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-[#FF3D00] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#FF3D00] shrink-0" />
                    )}
                    <span>{vol.title}</span>
                  </div>
                  <span className={themeStyles.accentText}>{vol.chapters.length} Chapter(s)</span>
                </div>
                
                {!isCollapsed && (
                  <div className="divide-y divide-current/[0.08]">
                    {vol.chapters.map((chap) => {
                      const isRead = readChapters.includes(chap.id);
                      const isUnlocked = isChapterUnlocked(chap.id);
                      const isLocked = chap.isLocked && !isUnlocked;
                      return (
                        <div 
                          key={chap.id}
                          onClick={() => handleChapterClick(chap)}
                          className="px-3 sm:px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 hover:bg-[#FF3D00]/5 cursor-pointer group transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs sm:text-sm font-bold transition-colors ${isRead ? `${themeStyles.accentText} line-through` : 'text-current group-hover:text-[#FF3D00]'}`}>
                                {chap.title}
                              </span>
                              {chap.isLocked && (
                                isUnlocked ? (
                                  <span className="bg-emerald-500/10 text-emerald-400 text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 uppercase tracking-wider font-bold border border-emerald-500/30 flex items-center gap-1">
                                    <Unlock className="w-3 h-3" /> Unlocked
                                  </span>
                                ) : (
                                  <span className="bg-amber-500/10 text-amber-400 text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 uppercase tracking-wider font-bold border border-amber-500/30 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> {chap.coinPrice || 5} Coins
                                  </span>
                                )
                              )}
                              {isRead && (
                                <span className="bg-[#FF3D00]/10 text-[#FF3D00] text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 uppercase tracking-widest font-black border border-[#FF3D00]/20 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-[#FF3D00] rounded-full animate-pulse"></span> Read
                                </span>
                              )}
                            </div>
                            <span className={`text-[10px] sm:text-xs font-mono ${themeStyles.accentText} block mt-0.5`}>
                              Released: {new Date(chap.publishDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-current/10">
                            <span className={`text-[11px] sm:text-xs font-mono flex items-center gap-1 font-bold ${isLocked ? 'text-amber-400' : 'text-[#FF3D00]'}`}>
                              {isLocked ? (
                                <>
                                  <Lock className="w-3 h-3" /> UNLOCK ({chap.coinPrice || 5} Coins) &rarr;
                                </>
                              ) : isRead ? (
                                'RE-READ &rarr;'
                              ) : (
                                'READ &rarr;'
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
export default ChapterList;

