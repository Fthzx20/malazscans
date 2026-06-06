import { create } from 'zustand';
import { ReadingHistory } from '../../../types';
import { libraryRepository } from '../../../repositories';

interface LibraryState {
  bookmarks: string[];
  history: ReadingHistory[];
  readChapters: string[];
  initializeLibrary: () => void;
  toggleBookmark: (novelId: string) => boolean; // returns true if added, false if removed
  logReadingProgress: (novelId: string, chapterId: string, chapterTitle: string) => void;
  markChapterAsRead: (chapterId: string) => void;
  clearReadChapters: () => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  bookmarks: [],
  history: [],
  readChapters: [],
  initializeLibrary: () => {
    set({
      bookmarks: libraryRepository.getBookmarks(),
      history: libraryRepository.getHistory(),
      readChapters: libraryRepository.getReadChapters(),
    });
  },
  toggleBookmark: (novelId) => {
    const { bookmarks } = get();
    const isBookmarked = bookmarks.includes(novelId);
    let updated: string[];
    if (isBookmarked) {
      updated = bookmarks.filter((id) => id !== novelId);
    } else {
      updated = [...bookmarks, novelId];
    }
    libraryRepository.saveBookmarks(updated);
    set({ bookmarks: updated });
    return !isBookmarked; // returns whether it was added
  },
  logReadingProgress: (novelId, chapterId, chapterTitle) => {
    const { history } = get();
    const entry: ReadingHistory = {
      novelId,
      chapterId,
      chapterTitle,
      timestamp: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    const cleaned = history.filter((h) => h.novelId !== novelId);
    const updated = [entry, ...cleaned];
    libraryRepository.saveHistory(updated);
    set({ history: updated });
  },
  markChapterAsRead: (chapterId) => {
    const { readChapters } = get();
    if (!readChapters.includes(chapterId)) {
      const updated = [...readChapters, chapterId];
      libraryRepository.saveReadChapters(updated);
      set({ readChapters: updated });
    }
  },
  clearReadChapters: () => {
    libraryRepository.saveReadChapters([]);
    set({ readChapters: [] });
  },
}));
export default useLibraryStore;
