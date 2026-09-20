import { create } from 'zustand';
import { Novel, Chapter } from '../../../types';
import { novelRepository } from '../../../repositories';

interface NovelState {
  novels: Novel[];
  selectedNovel: Novel | null;
  currentPage: string;
  selectedGenre: string;
  searchTerm: string;
  carouselIndex: number;
  newestAddedIndex: number;
  toastMessage: string;
  isLoading: boolean;
  
  initializeNovels: () => void;
  setNovels: (novels: Novel[]) => void;
  setSelectedNovel: (novel: Novel | null) => void;
  setCurrentPage: (page: string) => void;
  setSelectedGenre: (genre: string) => void;
  setSearchTerm: (term: string) => void;
  setCarouselIndex: (index: number | ((prev: number) => number)) => void;
  setNewestAddedIndex: (index: number | ((prev: number) => number)) => void;
  triggerToast: (message: string) => void;
  clearToast: () => void;
  
  addNovel: (novel: Novel) => void;
  addChapter: (novelId: string, chapter: Chapter, targetVolumeNumber?: number) => boolean;
  updateNovelRating: (novelId: string, rating: string, ratingCount: number) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useNovelStore = create<NovelState>((set, get) => ({
  novels: [],
  selectedNovel: null,
  currentPage: 'dashboard',
  selectedGenre: 'ALL',
  searchTerm: '',
  carouselIndex: 0,
  newestAddedIndex: 0,
  toastMessage: '',
  isLoading: false,

  initializeNovels: () => {
    // Immediately show cached localStorage data (instant paint)
    const cached = novelRepository.getAll();
    if (cached.length > 0) {
      set({
        novels: cached,
        selectedNovel: cached[0],
      });
    }

    // Then fetch fresh data from Supabase API in background
    set({ isLoading: true });
    fetch('/api/novels')
      .then((res) => {
        if (!res.ok) throw new Error('API fetch failed');
        return res.json();
      })
      .then((freshNovels: Novel[]) => {
        // Update localStorage cache for next instant paint
        novelRepository.save(freshNovels);
        set({
          novels: freshNovels,
          selectedNovel: freshNovels.length > 0 ? freshNovels[0] : null,
          isLoading: false,
        });
      })
      .catch(() => {
        // API failed — continue using cached localStorage data
        set({ isLoading: false });
      });
  },
  
  setNovels: (novels) => {
    novelRepository.save(novels);
    set({ novels });
  },
  
  setSelectedNovel: (novel) => set({ selectedNovel: novel }),
  
  setCurrentPage: (page) => {
    set({ currentPage: page });
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  },
  
  setSelectedGenre: (genre) => set({ selectedGenre: genre }),
  
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  setCarouselIndex: (index) => {
    if (typeof index === 'function') {
      set((state) => ({ carouselIndex: index(state.carouselIndex) }));
    } else {
      set({ carouselIndex: index });
    }
  },
  
  setNewestAddedIndex: (index) => {
    if (typeof index === 'function') {
      set((state) => ({ newestAddedIndex: index(state.newestAddedIndex) }));
    } else {
      set({ newestAddedIndex: index });
    }
  },
  
  triggerToast: (message) => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    set({ toastMessage: message });
    toastTimer = setTimeout(() => {
      set({ toastMessage: '' });
      toastTimer = null;
    }, 3500);
  },

  clearToast: () => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    set({ toastMessage: '' });
  },

  addNovel: (newNovel) => {
    const { novels } = get();
    const updated = [newNovel, ...novels];
    novelRepository.save(updated);
    set({ novels: updated });
  },

  addChapter: (novelId, chapter, targetVolumeNumber) => {
    const { novels } = get();
    const targetIdx = novels.findIndex((n) => n.id === novelId);
    if (targetIdx === -1) return false;

    const updated = novels.map((n) => {
      if (n.id !== novelId) return n;
      
      const existingVolumes = n.volumes && n.volumes.length > 0
        ? n.volumes
        : [{ volumeNumber: 1, title: 'Volume 1', chapters: [] }];

      const targetVolNum = targetVolumeNumber ?? existingVolumes[0]?.volumeNumber ?? 1;
      const hasTargetVol = existingVolumes.some((v) => v.volumeNumber === targetVolNum);

      let volumes = existingVolumes;
      if (!hasTargetVol) {
        volumes = [...existingVolumes, { volumeNumber: targetVolNum, title: `Volume ${targetVolNum}`, chapters: [] }]
          .sort((a, b) => a.volumeNumber - b.volumeNumber);
      }

      const updatedVolumes = volumes.map((vol) => {
        if (vol.volumeNumber === targetVolNum) {
          const existingIdx = vol.chapters.findIndex((c) => c.id === chapter.id);
          const chapters = existingIdx >= 0
            ? vol.chapters.map((c, i) => (i === existingIdx ? chapter : c))
            : [...vol.chapters, chapter];
          return { ...vol, chapters };
        }
        return vol;
      });

      return { ...n, volumes: updatedVolumes };
    });

    novelRepository.save(updated);
    set({ novels: updated });

    // Update selected novel to reflect changes if it is the currently viewed one
    const selected = get().selectedNovel;
    if (selected && selected.id === novelId) {
      const updatedNovel = updated.find((n) => n.id === novelId) || null;
      set({ selectedNovel: updatedNovel });
    }

    return true;
  },

  updateNovelRating: (novelId, rating, ratingCount) => {
    const { novels, selectedNovel } = get();
    const updated = novels.map((n) => 
      n.id === novelId ? { ...n, rating, ratingCount } : n
    );
    novelRepository.save(updated);
    set({ novels: updated });

    if (selectedNovel && selectedNovel.id === novelId) {
      set({ selectedNovel: { ...selectedNovel, rating, ratingCount } });
    }
  }
}));
export default useNovelStore;
