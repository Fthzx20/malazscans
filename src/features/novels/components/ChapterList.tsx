import React from 'react';
import { Novel, Chapter } from '../../../types';
import { useNovelStore } from '../store/novelStore';
import { useReaderStore } from '../../reader/store/readerStore';
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

  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

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
      <h3 className="text-lg font-black uppercase tracking-tight text-current">Available Chapters</h3>
      
      <div className="space-y-4">
        {novel.volumes.map((vol) => (
          <div key={vol.volumeNumber} className={`border ${themeStyles.border} ${themeStyles.cardBg}`}>
            <div className={`border-b ${themeStyles.border} px-4 py-3 bg-current/[0.04] flex justify-between items-center text-xs font-mono font-bold uppercase text-current`}>
              <span>{vol.title}</span>
              <span className={themeStyles.accentText}>{vol.chapters.length} Chapter(s)</span>
            </div>
            <div className={`divide-y divide-current/[0.08]`}>
              {vol.chapters.map((chap) => {
                const isRead = readChapters.includes(chap.id);
                return (
                  <div 
                    key={chap.id}
                    onClick={() => handleChapterClick(chap)}
                    className="px-4 py-3.5 flex justify-between items-center hover:bg-[#FF3D00]/5 cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold transition-colors ${isRead ? `${themeStyles.accentText} line-through` : 'text-current group-hover:text-[#FF3D00]'}`}>
                          {chap.title}
                        </span>
                        {isRead && (
                          <span className="bg-[#FF3D00]/10 text-[#FF3D00] text-[8px] font-mono px-1.5 py-0.5 uppercase tracking-widest font-black border border-[#FF3D00]/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-[#FF3D00] rounded-full animate-pulse"></span> Read
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-mono ${themeStyles.accentText} block mt-0.5`}>Published: {new Date(chap.publishDate).toLocaleDateString('en-US')}</span>
                    </div>
                    <span className="text-xs font-mono text-[#FF3D00] flex items-center">
                      {isRead ? 'READ AGAIN' : 'READ'} &rarr;
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
export default ChapterList;

