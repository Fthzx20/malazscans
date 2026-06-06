import { useLibraryStore } from '../store/libraryStore';
import { useNovelStore } from '../../novels/store/novelStore';

export const useBookmarks = () => {
  const bookmarks = useLibraryStore((state) => state.bookmarks);
  const toggleBookmarkAction = useLibraryStore((state) => state.toggleBookmark);
  const triggerToast = useNovelStore((state) => state.triggerToast);

  const toggleBookmark = (novelId: string) => {
    const isAdded = toggleBookmarkAction(novelId);
    if (isAdded) {
      triggerToast("Novel saved to bookshelf.");
    } else {
      triggerToast("Novel removed from bookshelf.");
    }
  };

  const isBookmarked = (novelId: string) => bookmarks.includes(novelId);

  return {
    bookmarks,
    toggleBookmark,
    isBookmarked,
  };
};
export default useBookmarks;
