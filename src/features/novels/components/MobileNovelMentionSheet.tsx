import React, { useState, useEffect } from 'react';
import { Star, Bookmark, BookOpen, X } from 'lucide-react';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';

interface MobileNovelMentionSheetProps {
  novelId: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: () => void;
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

export const MobileNovelMentionSheet: React.FC<MobileNovelMentionSheetProps> = ({
  novelId,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  const [data, setData] = useState<NovelDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [prevNovelId, setPrevNovelId] = useState(novelId);
  const [prevOpen, setPrevOpen] = useState(isOpen);

  if (novelId !== prevNovelId || isOpen !== prevOpen) {
    setPrevNovelId(novelId);
    setPrevOpen(isOpen);
    if (isOpen) {
      setLoading(true);
      setData(null);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    fetch(`/api/novels/${novelId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json) {
          setData(json);
        }
      })
      .catch((err) => console.error('Failed to load mobile sheet details:', err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [novelId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center font-mono">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-Up Bottom Sheet Container */}
      <div
        className={`relative w-full max-w-lg p-6 border-t-2 shadow-2xl rounded-t-2xl z-[1001] transition-transform duration-300 transform translate-y-0 ${themeStyles.cardBg} ${themeStyles.border} ${themeStyles.text}`}
      >
        {/* Top Notch for Drag Visual */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1 bg-current/20 rounded-full" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-none hover:bg-current/10 border-none bg-transparent cursor-pointer"
          aria-label="Close sheet"
        >
          <X className="w-5 h-5 text-current" />
        </button>

        {loading ? (
          <div className="space-y-4 py-8">
            <div className="flex gap-4">
              <div className="w-20 h-28 bg-current/10 animate-pulse" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-current/10 animate-pulse w-3/4" />
                <div className="h-3 bg-current/10 animate-pulse w-1/2" />
                <div className="h-3 bg-current/10 animate-pulse w-2/3" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2.5 bg-current/10 animate-pulse w-full" />
              <div className="h-2.5 bg-current/10 animate-pulse w-full" />
              <div className="h-2.5 bg-current/10 animate-pulse w-5/6" />
            </div>
          </div>
        ) : !data ? (
          <div className="text-center py-8 text-red-500 font-bold uppercase">
            Failed to load novel details.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header Content */}
            <div className="flex gap-4">
              {/* Cover */}
              <div className={`w-20 h-28 border bg-[#0A0A0A] overflow-hidden flex-shrink-0 ${themeStyles.border}`}>
                {data.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.coverImage}
                    alt={data.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] font-black uppercase text-center text-[#737373]">
                    No Cover
                  </div>
                )}
              </div>

              {/* Text Meta */}
              <div className="flex-1 min-w-0 space-y-1 py-1">
                <h3 className="font-black text-sm uppercase leading-tight text-[#FF3D00] break-words">
                  {data.title}
                </h3>
                {data.alternativeTitle && (
                  <p className={`text-[10px] font-bold uppercase truncate ${themeStyles.accentText}`}>
                    {data.alternativeTitle}
                  </p>
                )}
                <p className="text-[10px] font-bold uppercase">
                  {data.genres.join(' • ')}
                </p>
                <div className="pt-1">
                  <span className={`inline-block text-[9px] px-2 py-0.5 border font-extrabold uppercase ${
                    data.status === 'COMPLETED'
                      ? 'border-green-500/30 bg-green-500/10 text-green-400'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  }`}>
                    {data.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics grid */}
            <div className={`grid grid-cols-3 gap-2 py-2 border-y text-center ${themeStyles.border}`}>
              <div>
                <span className={`text-[9px] uppercase font-bold block ${themeStyles.accentText}`}>Rating</span>
                <div className="flex items-center justify-center gap-0.5">
                  <Star className="w-3.5 h-3.5 text-[#FF3D00] fill-[#FF3D00]" />
                  <span className="font-extrabold text-xs">{parseFloat(data.rating).toFixed(1)}</span>
                </div>
              </div>
              <div className={`border-x px-1 ${themeStyles.border}`}>
                <span className={`text-[9px] uppercase font-bold block ${themeStyles.accentText}`}>Chapters</span>
                <div className="flex items-center justify-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#FF3D00]" />
                  <span className="font-extrabold text-xs">
                    {data.volumes?.reduce((acc, vol) => acc + (vol.chapters?.length || 0), 0) || 0}
                  </span>
                </div>
              </div>
              <div>
                <span className={`text-[9px] uppercase font-bold block ${themeStyles.accentText}`}>Bookmarks</span>
                <div className="flex items-center justify-center gap-1">
                  <Bookmark className="w-3.5 h-3.5 text-[#FF3D00]" />
                  <span className="font-extrabold text-xs">{data.bookmarkCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Synopsis info */}
            <div className="space-y-1.5">
              <span className={`text-[9px] uppercase font-bold tracking-wider block ${themeStyles.accentText}`}>
                Synopsis
              </span>
              <p className="text-[11px] leading-relaxed max-h-24 overflow-y-auto pr-1">
                {data.synopsis || 'No synopsis available.'}
              </p>
            </div>

            {/* Action button */}
            <button
              onClick={onNavigate}
              className="w-full bg-[#FF3D00] text-[#0A0A0A] hover:bg-white text-xs font-black uppercase py-3.5 transition-colors cursor-pointer border-none block text-center"
            >
              Open Novel Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
