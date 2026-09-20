import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft, ChevronDown, RotateCcw } from 'lucide-react';
import { useNovelSearch } from '../hooks/useNovelSearch';
import { useNovelStore } from '../store/novelStore';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';
import { NovelGrid } from './NovelGrid';

const PRESET_GENRES = [
  'Action', 'Fantasy', 'Isekai', 'Romance', 'Sci-Fi',
  'Xianxia', 'Comedy', 'Supernatural', 'Drama', 'Mystery', 'Slice of Life'
];

export const BrowsePage: React.FC = () => {
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const novels = useNovelStore((state) => state.novels);
  const {
    searchTerm,
    selectedGenre,
    setSearchTerm,
    setSelectedGenre,
    filteredNovels
  } = useNovelSearch();

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('LATEST');

  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  const handleBack = () => {
    setCurrentPage('dashboard');
  };

  // Combine loaded novel genres with preset list
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    novels.forEach((n) => {
      n.genres?.forEach((g) => {
        if (g && g.trim()) genreSet.add(g.trim());
      });
    });
    PRESET_GENRES.forEach((p) => genreSet.add(p));
    return ['ALL', ...Array.from(genreSet)];
  }, [novels]);

  // Status and sorting pipeline
  const displayedNovels = filteredNovels
    .filter((novel) => {
      if (selectedStatus === 'ALL') return true;
      return novel.status?.toUpperCase() === selectedStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'RATING') return parseFloat(b.rating || '0') - parseFloat(a.rating || '0');
      if (sortBy === 'VIEWS') {
        const viewsB = Number(String(b.views || 0).replace(/,/g, '')) || 0;
        const viewsA = Number(String(a.views || 0).replace(/,/g, '')) || 0;
        return viewsB - viewsA;
      }
      if (sortBy === 'TITLE') return a.title.localeCompare(b.title);
      // LATEST by default
      return new Date(b.addedDate || 0).getTime() - new Date(a.addedDate || 0).getTime();
    });

  const hasActiveFilters = searchTerm.trim() !== '' || selectedGenre !== 'ALL' || selectedStatus !== 'ALL' || sortBy !== 'LATEST';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedGenre('ALL');
    setSelectedStatus('ALL');
    setSortBy('LATEST');
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header & Back Navigation */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b ${themeStyles.border} pb-5`}>
        <div className="space-y-1">
          <button 
            onClick={handleBack}
            className={`inline-flex items-center space-x-1.5 text-xs font-mono ${themeStyles.accentText} hover:text-[#FF3D00] mb-2 bg-transparent border-none cursor-pointer`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO HOME</span>
          </button>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter text-current font-sans">Complete Directory</h1>
          <p className={`text-xs font-mono ${themeStyles.accentText}`}>Explore, search, and filter our entire light novel catalog.</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[10px] font-mono text-[#737373] hover:text-[#FF3D00] uppercase font-bold border border-[#262626] px-2.5 py-1 bg-transparent cursor-pointer transition-colors mr-1"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          <span className="text-current/60">Found:</span>
          <span className="font-bold text-[#FF3D00] bg-[#FF3D00]/10 px-2.5 py-1 border border-[#FF3D00]/30">
            {displayedNovels.length} Novels
          </span>
        </div>
      </div>

      {/* Search & Filters Section */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 ${themeStyles.accentText}`} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search novels by title, Romaji, or author..."
            className={`w-full ${themeStyles.cardBg} border ${themeStyles.border} py-3 pl-10 pr-4 text-xs font-mono focus:border-[#FF3D00] focus:outline-none text-current rounded-none`}
          />
        </div>

        {/* Status and Sort Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Segmented Buttons */}
          <div className="flex items-center gap-1 border border-[#262626] p-1 bg-[#111113]">
            {(['ALL', 'ONGOING', 'COMPLETED'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition-colors border-none cursor-pointer rounded-none ${
                  selectedStatus === status
                    ? 'bg-[#FF3D00] text-black font-black'
                    : 'bg-transparent text-[#737373] hover:text-white'
                }`}
              >
                {status === 'ALL' ? 'All Status' : status}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative sm:w-48 w-full">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`w-full ${themeStyles.cardBg} border ${themeStyles.border} py-2 px-3 pr-8 text-xs font-mono text-current focus:border-[#FF3D00] focus:outline-none rounded-none appearance-none cursor-pointer uppercase font-bold`}
              aria-label="Sort Novels"
            >
              <option value="LATEST" className="bg-[#121212] text-white">Newest Added</option>
              <option value="RATING" className="bg-[#121212] text-white">Highest Rating</option>
              <option value="VIEWS" className="bg-[#121212] text-white">Most Popular</option>
              <option value="TITLE" className="bg-[#121212] text-white">Title (A - Z)</option>
            </select>
            <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 ${themeStyles.accentText}`}>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Interactive Genre Pills */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono text-current/60 uppercase font-bold tracking-wider">Filter by Genre</label>
            {selectedGenre !== 'ALL' && (
              <button
                onClick={() => setSelectedGenre('ALL')}
                className="text-[10px] font-mono text-[#FF3D00] hover:underline uppercase font-bold bg-transparent border-none cursor-pointer"
              >
                Clear ({selectedGenre})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableGenres.map((genre) => {
              const isSelected = selectedGenre.toLowerCase() === genre.toLowerCase();
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3 py-1.5 text-[11px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#FF3D00] text-[#0A0A0A] border-[#FF3D00] shadow-[0_0_8px_rgba(255,61,0,0.4)]'
                      : `${themeStyles.cardBg} ${themeStyles.border} text-current/70 hover:border-[#FF3D00] hover:text-[#FF3D00]`
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Browse Grid */}
      <NovelGrid novels={displayedNovels} />
    </main>
  );
};

export default BrowsePage;
