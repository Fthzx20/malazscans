import { useLibraryStore } from '../store/libraryStore';

export const useHistory = () => {
  const history = useLibraryStore((state) => state.history);
  const readChapters = useLibraryStore((state) => state.readChapters);
  const logReadingProgress = useLibraryStore((state) => state.logReadingProgress);
  const markChapterAsRead = useLibraryStore((state) => state.markChapterAsRead);
  const clearReadChapters = useLibraryStore((state) => state.clearReadChapters);

  return {
    history,
    readChapters,
    logReadingProgress,
    markChapterAsRead,
    clearReadChapters,
  };
};
export default useHistory;
