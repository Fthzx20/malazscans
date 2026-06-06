import React, { useState, useEffect } from 'react';
import { Star, Bookmark, BookOpen } from 'lucide-react';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';

interface PreviewCardProps {
  novelId: string;
}

interface NovelDetail {
  id: string;
  title: string;
  alternativeTitle: string;
  synopsis: string;
  status: string;
  rating: string;
  ratingCount: number;
  bookmarkCount: number;
  genres: string[];
  coverImage: string;
  volumes: {
    chapters: unknown[];
  }[];
}

export const NovelMentionPreviewCard: React.FC<PreviewCardProps> = ({ novelId }) => {
  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  const [data, setData] = useState<NovelDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [prevNovelId, setPrevNovelId] = useState(novelId);
  if (novelId !== prevNovelId) {
    setPrevNovelId(novelId);
    setLoading(true);
    setData(null);
  }

  useEffect(() => {
    let active = true;

    fetch(`/api/novels/${novelId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json) {
          setData(json);
        }
      })
      .catch((err) => console.error('Failed to load preview details:', err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [novelId]);

  return (
    <div
      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-4 border shadow-2xl z-[999] rounded-none font-mono text-xs text-justify select-none animate-fadeIn ${themeStyles.cardBg} ${themeStyles.border} ${themeStyles.text}`}
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      {loading ? (
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className={`w-16 h-24 bg-current/10 animate-pulse border ${themeStyles.border}`} />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-current/10 animate-pulse w-3/4" />
              <div className="h-2.5 bg-current/10 animate-pulse w-1/2" />
              <div className="h-2.5 bg-current/10 animate-pulse w-2/3" />
            </div>
          </div>
          <div className="space-y-1.5 pt-2">
            <div className="h-2 bg-current/10 animate-pulse w-full" />
            <div className="h-2 bg-current/10 animate-pulse w-full" />
            <div className="h-2 bg-current/10 animate-pulse w-4/5" />
          </div>
        </div>
      ) : !data ? (
        <div className="text-center py-4 text-red-500 font-bold uppercase">
          Failed to load novel details.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Main Info Header */}
          <div className="flex gap-3">
            {/* Cover image */}
            <div className={`flex-shrink-0 w-16 h-24 border bg-[#0A0A0A] overflow-hidden ${themeStyles.border}`}>
              {data.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.coverImage}
                  alt={data.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] font-black uppercase text-center text-[#737373]">
                  No Cover
                </div>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="font-black text-xs uppercase leading-tight truncate text-[#FF3D00]">
                {data.title}
              </h3>
              {data.alternativeTitle && (
                <p className={`text-[9px] truncate font-bold uppercase ${themeStyles.accentText}`}>
                  {data.alternativeTitle}
                </p>
              )}
              <p className="text-[9px] font-extrabold uppercase">
                {data.genres.slice(0, 2).join(' • ')}
              </p>
              <span className={`inline-block text-[8px] px-1.5 py-0.5 border font-extrabold uppercase ${
                data.status === 'COMPLETED'
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
              }`}>
                {data.status}
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className={`grid grid-cols-3 gap-1 py-1.5 border-y text-center ${themeStyles.border}`}>
            <div className="space-y-0.5">
              <span className={`text-[8px] uppercase font-bold block ${themeStyles.accentText}`}>Rating</span>
              <div className="flex items-center justify-center gap-0.5">
                <Star className="w-3 h-3 text-[#FF3D00] fill-[#FF3D00]" />
                <span className="font-extrabold">{parseFloat(data.rating).toFixed(1)}</span>
              </div>
            </div>
            <div className="space-y-0.5 border-x px-1 select-none ${themeStyles.border}">
              <span className={`text-[8px] uppercase font-bold block ${themeStyles.accentText}`}>Chapters</span>
              <div className="flex items-center justify-center gap-1">
                <BookOpen className="w-3 h-3 text-[#FF3D00]" />
                <span className="font-extrabold">
                  {data.volumes?.reduce((acc, vol) => acc + (vol.chapters?.length || 0), 0) || 0}
                </span>
              </div>
            </div>
            <div className="space-y-0.5">
              <span className={`text-[8px] uppercase font-bold block ${themeStyles.accentText}`}>Bookmarks</span>
              <div className="flex items-center justify-center gap-1">
                <Bookmark className="w-3 h-3 text-[#FF3D00]" />
                <span className="font-extrabold">{data.bookmarkCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Synopsis */}
          <p className={`text-[10px] leading-relaxed line-clamp-3 ${themeStyles.accentText}`}>
            {data.synopsis || 'No synopsis available.'}
          </p>
        </div>
      )}
      {/* Visual arrow indicator */}
      <div className={`absolute top-full left-1/2 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-current ${themeStyles.cardBg.replace('bg-', 'text-')}`} />
    </div>
  );
};
