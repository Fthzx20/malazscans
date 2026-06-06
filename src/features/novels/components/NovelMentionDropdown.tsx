import React from 'react';
import { Star } from 'lucide-react';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';

export interface MentionNovelItem {
  id: string;
  title: string;
  cover?: string;
  status: string;
  rating: number | string;
  genres: string[];
}

interface NovelMentionDropdownProps {
  items: MentionNovelItem[];
  selectedIndex: number;
  onSelect: (item: MentionNovelItem) => void;
  setSelectedIndex: (index: number) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export const NovelMentionDropdown: React.FC<NovelMentionDropdownProps> = ({
  items,
  selectedIndex,
  onSelect,
  setSelectedIndex,
  dropdownRef,
}) => {
  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  if (items.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className={`absolute z-[999] w-72 max-h-72 overflow-y-auto border shadow-2xl rounded-none font-mono text-xs backdrop-blur-md bg-opacity-90 ${themeStyles.cardBg} ${themeStyles.border} ${themeStyles.text}`}
      role="listbox"
      aria-label="Novel mentions"
    >
      <div className={`p-2 text-[9px] uppercase border-b font-bold tracking-wider ${themeStyles.border} ${themeStyles.accentText}`}>
        Mention Novel (Use ↑↓ arrows, Enter to select)
      </div>
      {items.map((item, idx) => {
        const isSelected = idx === selectedIndex;
        const genresDisplay = item.genres?.slice(0, 2).join(' • ') || '';

        return (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            onMouseEnter={() => setSelectedIndex(idx)}
            className={`flex items-start gap-3 p-2.5 cursor-pointer border-b last:border-b-0 transition-colors select-none ${themeStyles.border} ${
              isSelected ? 'bg-[#FF3D00] text-[#0A0A0A] font-bold' : `hover:${themeStyles.bg}`
            }`}
            role="option"
            aria-selected={isSelected}
            id={`mention-option-${idx}`}
          >
            {/* Cover image or fallback */}
            <div className={`flex-shrink-0 w-10 h-14 border ${isSelected ? 'border-[#0A0A0A]/40' : themeStyles.border} bg-[#0A0A0A] overflow-hidden relative`}>
              {item.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.cover}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-[8px] font-black uppercase text-center ${isSelected ? 'text-[#0A0A0A]' : 'text-[#737373]'}`}>
                  Cover
                </div>
              )}
            </div>

            {/* Info details */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <h4 className="font-extrabold text-xs truncate leading-tight uppercase">
                {item.title}
              </h4>
              <p className={`text-[9px] truncate font-bold uppercase ${isSelected ? 'text-[#0A0A0A]/80' : themeStyles.accentText}`}>
                {genresDisplay ? `${genresDisplay} • ` : ''}{item.status}
              </p>
              <div className="flex items-center gap-1">
                <Star className={`w-3 h-3 ${isSelected ? 'fill-[#0A0A0A] text-[#0A0A0A]' : 'fill-[#FF3D00] text-[#FF3D00]'}`} />
                <span className="text-[10px] font-extrabold">
                  {typeof item.rating === 'number' ? item.rating.toFixed(1) : parseFloat(item.rating || '0').toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
