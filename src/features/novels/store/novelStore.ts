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
  
  addNovel: (novel: Novel) => void;
  addChapter: (novelId: string, chapter: Chapter) => boolean;
  updateNovelRating: (novelId: string, rating: string, ratingCount: number) => void;
}

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
    set({ toastMessage: message });
    setTimeout(() => {
      if (get().toastMessage === message) {
        set({ toastMessage: '' });
      }
    }, 3000);
  },

  addNovel: (newNovel) => {
    const { novels } = get();
    const updated = [newNovel, ...novels];
    novelRepository.save(updated);
    set({ novels: updated });
  },

  addChapter: (novelId, chapter) => {
    const { novels } = get();
    const updated = [...novels];
    const targetIdx = updated.findIndex((n) => n.id === novelId);
    if (targetIdx === -1) return false;
    
    const targetNovel = updated[targetIdx];
    const targetVolume = targetNovel.volumes[0];
    
    targetVolume.chapters.push(chapter);
    novelRepository.save(updated);
    set({ novels: updated });
    
    // Update selected novel to reflect changes if it is the currently viewed one
    const selected = get().selectedNovel;
    if (selected && selected.id === novelId) {
      set({ selectedNovel: { ...targetNovel } });
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
