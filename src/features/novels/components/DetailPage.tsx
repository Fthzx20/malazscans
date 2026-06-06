import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNovelStore } from '../store/novelStore';
import { useAuthStore } from '../../auth/store/authStore';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';
import { COVERS } from '../../../assets/covers';
import { BookmarkButton } from '../../library/components/BookmarkButton';
import { ChapterList } from './ChapterList';

export const DetailPage: React.FC = () => {
  const selectedNovel = useNovelStore((state) => state.selectedNovel);
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const updateNovelRating = useNovelStore((state) => state.updateNovelRating);
  const triggerToast = useNovelStore((state) => state.triggerToast);
  
  const currentUser = useAuthStore((state) => state.currentUser);
  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedNovel) return;
    const rated = localStorage.getItem(`rated_novel_${selectedNovel.id}`);
    const timer = setTimeout(() => {
      if (rated) {
        setUserRating(Number(rated));
      } else {
        setUserRating(null);
      }
    }, 0);

    // Track view (fire-and-forget, once per session per novel)
    const viewKey = `viewed_${selectedNovel.id}`;
    if (!sessionStorage.getItem(viewKey)) {
      fetch(`/api/novels/${selectedNovel.id}/view`, { method: 'POST' }).catch(() => {});
      sessionStorage.setItem(viewKey, '1');
    }

    return () => clearTimeout(timer);
  }, [selectedNovel?.id]);

  if (!selectedNovel) {
    return (
      <main className={`max-w-5xl mx-auto px-4 py-12 text-center text-xs font-mono ${themeStyles.accentText}`}>
        No novel selected.
      </main>
    );
  }

  const handleRate = async (ratingValue: number) => {
    if (userRating !== null) {
      triggerToast("You have already rated this novel!");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/novels/${selectedNovel.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: ratingValue,
          userId: currentUser?.email || null,
          username: currentUser?.username || 'Guest',
        }),
      });

      if (!res.ok) {
        throw new Error('Rating failed');
      }

      const data = await res.json();
      if (data.success) {
        setUserRating(ratingValue);
        localStorage.setItem(`rated_novel_${selectedNovel.id}`, String(ratingValue));
        updateNovelRating(selectedNovel.id, data.rating, data.ratingCount);
        triggerToast(`Thank you for rating! New average rating: ${data.rating} ★`);
      } else {
        triggerToast("Failed to submit rating.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error submitting rating.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCover = () => {
    if (selectedNovel.coverImage) {
      return <img src={selectedNovel.coverImage} alt={selectedNovel.title} className="w-full h-full object-cover" />;
    }
    return COVERS[selectedNovel.id] || COVERS['red-sunset'];
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <button 
        onClick={() => setCurrentPage('dashboard')}
        className={`inline-flex items-center space-x-2 text-xs font-mono ${themeStyles.accentText} hover:text-[#FF3D00] bg-transparent border-none cursor-pointer`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK TO HOME</span>
      </button>

      {/* Master Detail Section */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Book Cover */}
        <div className={`md:col-span-4 border ${themeStyles.border} p-4 ${themeStyles.cardBg} relative`}>
          <div className={`h-80 border ${themeStyles.border} relative ${themeStyles.bg} overflow-hidden flex items-center justify-center`}>
            {renderCover()}
          </div>
          <BookmarkButton novelId={selectedNovel.id} />
        </div>

        {/* Metadata info */}
        <div className="md:col-span-8 space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {selectedNovel.genres.map(g => (
                <span key={g} className={`${themeStyles.cardBg} border ${themeStyles.border} ${themeStyles.accentText} text-[9px] font-mono px-2.5 py-1 uppercase`}>{g}</span>
              ))}
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-current uppercase">{selectedNovel.title}</h2>
            <h4 className={`text-sm font-mono ${themeStyles.accentText}`}>{selectedNovel.alternativeTitle}</h4>
            <div className={`flex gap-4 text-[10px] ${themeStyles.accentText} font-mono`}>
              {selectedNovel.originalTitle && <span>Original: {selectedNovel.originalTitle}</span>}
              {selectedNovel.publisher && <span>Publisher: {selectedNovel.publisher}</span>}
            </div>
          </div>

          {/* Grid Metadata */}
          <div className={`grid grid-cols-2 gap-4 border-y ${themeStyles.border} py-4 font-mono text-xs ${themeStyles.accentText}`}>
            <div>
              <span>AUTHOR:</span>
              <span className="block font-bold text-current">{selectedNovel.author}</span>
            </div>
            <div>
              <span>ILLUSTRATOR:</span>
              <span className="block font-bold text-current">{selectedNovel.illustrator || 'N/A'}</span>
            </div>
            <div>
              <span>TRANSLATOR:</span>
              <span className="block font-bold text-[#FF3D00]">{selectedNovel.translator}</span>
            </div>
            <div>
              <span>RELEASE STATUS:</span>
              <span className="block font-bold text-current">{selectedNovel.status}</span>
            </div>
            <div>
              <span>UPDATE SCHEDULE:</span>
              <span className="block font-bold text-current">{selectedNovel.releaseSchedule}</span>
            </div>
            <div className="space-y-1">
              <span>RATING:</span>
              <div className="flex items-center gap-1.5">
                <span className="block font-bold text-current">★ {selectedNovel.rating} / 5.0</span>
                <span className="text-[10px]">({selectedNovel.ratingCount || 0} votes)</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isGold = (hoverRating !== null ? star <= hoverRating : false) || (hoverRating === null && userRating !== null ? star <= userRating : false);
                  return (
                    <button
                      key={star}
                      type="button"
                      disabled={userRating !== null || isSubmitting}
                      onMouseEnter={() => userRating === null && setHoverRating(star)}
                      onMouseLeave={() => userRating === null && setHoverRating(null)}
                      onClick={() => handleRate(star)}
                      className={`text-lg transition-all border-none bg-transparent p-0 cursor-pointer ${
                        userRating !== null ? 'cursor-default' : 'hover:scale-125'
                      } ${isGold ? 'text-amber-500' : 'text-neutral-500'}`}
                      title={userRating !== null ? `You rated this ${userRating} stars` : `Rate ${star} stars`}
                    >
                      ★
                    </button>
                  );
                })}
                {userRating !== null && (
                  <span className="text-[9px] font-mono text-green-500 uppercase font-bold ml-1">Rated</span>
                )}
              </div>
            </div>
          </div>

          {/* Synopsis */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-[#FF3D00] font-bold block">SYNOPSIS:</span>
            <p className="font-serif text-current/90 text-sm leading-relaxed whitespace-pre-line text-justify">
              {selectedNovel.synopsis}
            </p>
          </div>
        </div>
      </section>

      {/* Chapter Listing */}
      <ChapterList novel={selectedNovel} />

    </main>
  );
};

export default DetailPage;

