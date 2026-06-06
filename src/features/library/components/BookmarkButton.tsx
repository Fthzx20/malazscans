import React from 'react';
import { useBookmarks } from '../hooks/useBookmarks';

interface BookmarkButtonProps {
  novelId: string;
  className?: string;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({ novelId, className }) => {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(novelId);

  return (
    <button 
      onClick={() => toggleBookmark(novelId)}
      className={className || `w-full font-mono text-xs font-bold py-3 mt-4 uppercase border cursor-pointer transition-colors ${
        bookmarked
          ? 'bg-[#FF3D00] text-[#0A0A0A] border-[#FF3D00]' 
          : 'border-[#262626] text-[#FAFAFA] bg-transparent hover:border-[#FF3D00]'
      }`}
    >
      {bookmarked ? 'Saved in Shelf' : 'Save to Bookshelf'}
    </button>
  );
};
export default BookmarkButton;
