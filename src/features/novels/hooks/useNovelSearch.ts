import { useNovelStore } from '../store/novelStore';
import { useReaderStore } from '../../reader/store/readerStore';

export const useNovelSearch = () => {
  const novels = useNovelStore((state) => state.novels);
  const searchTerm = useNovelStore((state) => state.searchTerm);
  const selectedGenre = useNovelStore((state) => state.selectedGenre);
  const setSearchTerm = useNovelStore((state) => state.setSearchTerm);
  const setSelectedGenre = useNovelStore((state) => state.setSelectedGenre);
  const readerSettings = useReaderStore((state) => state.readerSettings);

  const filteredNovels = novels.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.alternativeTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'ALL' || n.genres.includes(selectedGenre);
    
    // Mature Content Filter
    if (readerSettings.hideMatureContent) {
      const isMature = n.genres.some(g => g.toLowerCase() === 'mature') || 
                       n.tags.some(t => t.toLowerCase() === 'mature');
      if (isMature) return false;
    }
    
    return matchesSearch && matchesGenre;
  });

  return {
    searchTerm,
    selectedGenre,
    setSearchTerm,
    setSelectedGenre,
    filteredNovels,
  };
};
export default useNovelSearch;
