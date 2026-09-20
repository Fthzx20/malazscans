import { create } from 'zustand';
import { ReadingHistory } from '../../../types';
import { libraryRepository } from '../../../repositories';

interface LibraryState {
  bookmarks: string[];
  history: ReadingHistory[];
  readChapters: string[];
  initializeLibrary: () => void;
  syncWithCloud: () => Promise<void>;
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
    // Attempt cloud sync in background if session exists
    get().syncWithCloud();
  },
  syncWithCloud: async () => {
    try {
      // Sync bookmarks
      const bRes = await fetch('/api/library/bookmarks');
      if (bRes.ok) {
        const cloudBookmarks: string[] = await bRes.json();
        const local = get().bookmarks;
        const merged = Array.from(new Set([...cloudBookmarks, ...local]));
        libraryRepository.saveBookmarks(merged);
        set({ bookmarks: merged });
      }

      // Sync reading history
      const hRes = await fetch('/api/library/history');
      if (hRes.ok) {
        const cloudHistory: ReadingHistory[] = await hRes.json();
        const localHistory = get().history;
        // Merge cloud & local by novelId (favor most recent)
        const novelMap = new Map<string, ReadingHistory>();
        [...localHistory, ...cloudHistory].forEach((item) => {
          const existing = novelMap.get(item.novelId);
          if (!existing || new Date(item.timestamp) > new Date(existing.timestamp)) {
            novelMap.set(item.novelId, item);
          }
        });
        const mergedHistory = Array.from(novelMap.values());
        libraryRepository.saveHistory(mergedHistory);
        set({ history: mergedHistory });
      }
    } catch {
      // Offline or unauthenticated — keep local
    }
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

    // Sync with Neon DB in background
    fetch('/api/library/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novelId }),
    }).catch(() => {});

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

    // Sync with Neon DB in background
    fetch('/api/library/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novelId, chapterId, chapterTitle }),
    }).catch(() => {});
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
