import React from 'react';
import { Search, ArrowLeft, ChevronRight } from 'lucide-react';
import { useNovelSearch } from '../hooks/useNovelSearch';
import { useNovelStore } from '../store/novelStore';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';
import { NovelGrid } from './NovelGrid';

export const BrowsePage: React.FC = () => {
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const {
    searchTerm,
    selectedGenre,
    setSearchTerm,
    setSelectedGenre,
    filteredNovels
  } = useNovelSearch();

  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  const handleBack = () => {
    setCurrentPage('dashboard');
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header & Back Navigation */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b ${themeStyles.border} pb-6`}>
        <div className="space-y-1">
          <button 
            onClick={handleBack}
            className={`inline-flex items-center space-x-1.5 text-xs font-mono ${themeStyles.accentText} hover:text-[#FF3D00] mb-2 bg-transparent border-none cursor-pointer`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO HOME</span>
          </button>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter text-current font-sans">Complete Directory</h1>
          <p className={`text-xs font-mono ${themeStyles.accentText}`}>Explore, search, and filter our entire catalog of light novels.</p>
        </div>
      </div>

      {/* Search Controls & Premium Theme DROPDOWN Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-grow">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${themeStyles.accentText}`} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search novels by title, author, or Romaji..."
            className={`w-full ${themeStyles.cardBg} border ${themeStyles.border} py-3.5 pl-10 pr-4 text-xs font-mono focus:border-[#FF3D00] focus:outline-none text-current`}
          />
        </div>
        
        {/* Dropdown Selector */}
        <div className="relative min-w-[180px]">
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className={`w-full ${themeStyles.cardBg} border ${themeStyles.border} py-3.5 px-4 pr-10 text-xs font-mono text-current focus:border-[#FF3D00] focus:outline-none rounded-none appearance-none cursor-pointer uppercase font-bold`}
          >
            <option value="ALL">ALL GENRES</option>
            <option value="Fantasy">FANTASY</option>
            <option value="Sci-Fi">SCI-FI</option>
            <option value="Mystery">MYSTERY</option>
            <option value="Action">ACTION</option>
            <option value="Drama">DRAMA</option>
          </select>
          <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${themeStyles.accentText}`}>
            <ChevronRight className="w-4 h-4 transform rotate-90" />
          </div>
        </div>
      </div>

      {/* Browse Grid */}
      <NovelGrid novels={filteredNovels} />
    </main>
  );
};
export default BrowsePage;

