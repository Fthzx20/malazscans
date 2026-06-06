import React, { useState, useRef, useEffect } from 'react';
import { Bookmark, User, LogIn, LogOut, Menu, X, Settings, Shield } from 'lucide-react';
import { useNovelStore } from '../../features/novels/store/novelStore';
import { useLibraryStore } from '../../features/library/store/libraryStore';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useReaderStore } from '../../features/reader/store/readerStore';
import { getThemeStyles } from '../../features/reader/utils/theme';
import { CONFIG } from '../../config';

interface HeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const currentPage = useNovelStore((state) => state.currentPage);
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const setSelectedGenre = useNovelStore((state) => state.setSelectedGenre);
  const bookmarks = useLibraryStore((state) => state.bookmarks);
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const setShowAuthModal = useAuthStore((state) => state.setShowAuthModal);
  const readerSettings = useReaderStore((state) => state.readerSettings);
  const triggerToast = useNovelStore((state) => state.triggerToast);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themeStyles = getThemeStyles(readerSettings.theme);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    triggerToast("Logged out successfully.");
    if (currentPage === 'admin' || currentPage === 'settings') {
      setCurrentPage('dashboard');
    }
  };

  const navigateToBrowse = (genre = 'ALL') => {
    setSelectedGenre(genre);
    setCurrentPage('browse');
  };

  return (
    <header className={`border-b ${themeStyles.border} ${themeStyles.headerBg} sticky top-0 z-40 backdrop-blur-md transition-colors duration-200 text-current`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between relative">
        
        {/* Level 1: Logo */}
        <button onClick={() => setCurrentPage('dashboard')} className="flex items-baseline space-x-1.5 active:scale-95 transition-transform bg-transparent border-none cursor-pointer text-current">
          <span className="text-lg sm:text-2xl font-black tracking-tighter">
            MALAZ<span className="text-[#FF3D00]"> TL</span>
          </span>
        </button>

        {/* Level 2: Primary Navigation (Simplified to Home, Browse, Library) */}
        <nav className="hidden md:flex items-center space-x-8 font-mono text-xs font-bold uppercase tracking-widest text-current">
          <button 
            onClick={() => { setCurrentPage('dashboard'); setSelectedGenre('ALL'); }} 
            className={`py-2 hover:text-[#FF3D00] transition-colors bg-transparent border-none cursor-pointer ${currentPage === 'dashboard' ? 'text-[#FF3D00] font-black' : ''}`}
          >
            Home
          </button>
          <button 
            onClick={() => navigateToBrowse('ALL')} 
            className={`py-2 hover:text-[#FF3D00] transition-colors bg-transparent border-none cursor-pointer ${currentPage === 'browse' ? 'text-[#FF3D00] font-black' : ''}`}
          >
            Browse
          </button>
          <button 
            onClick={() => setCurrentPage('library')} 
            className={`py-2 hover:text-[#FF3D00] transition-colors bg-transparent border-none cursor-pointer ${currentPage === 'library' ? 'text-[#FF3D00] font-black' : ''}`}
          >
            Library
          </button>
        </nav>

        {/* Level 3: User Actions (No duplicates, dropdown-driven) */}
        <div className="flex items-center space-x-3 text-current">
          
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              {/* User Avatar Action Card */}
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center space-x-2 border ${themeStyles.border} h-11 px-3 ${themeStyles.cardBg} text-current hover:border-[#FF3D00] transition-all cursor-pointer rounded-none`}
              >
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className={`w-5 h-5 rounded-full object-cover border ${themeStyles.border}`} />
                ) : (
                  <User className="w-4 h-4 text-[#FF3D00]" />
                )}
                <span className="text-xs font-mono font-bold max-w-[80px] truncate">{currentUser.username}</span>
              </button>

              {/* Popover Dropdown Menu */}
              {dropdownOpen && (
                <div className={`absolute right-0 mt-2 w-56 border ${themeStyles.border} ${themeStyles.cardBg} text-current font-mono text-xs shadow-2xl divide-y divide-current/10 z-50`}>
                  <div className="p-3 space-y-1">
                    <span className={`text-[9px] ${themeStyles.accentText} uppercase font-bold block`}>Logged In As</span>
                    <span className="font-bold text-current block truncate">{currentUser.username}</span>
                    <span className={`text-[10px] ${themeStyles.accentText} block truncate`}>{currentUser.email}</span>
                  </div>
                  
                  <div className="py-1">
                    <button 
                      onClick={() => { setCurrentPage('settings'); setDropdownOpen(false); }}
                      className="w-full px-4 py-2.5 text-left hover:bg-[#FF3D00] hover:text-[#0A0A0A] flex items-center gap-2 transition-colors bg-transparent border-none cursor-pointer text-current"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings & Profile</span>
                    </button>
                    
                    {currentUser.email === CONFIG.ADMIN_EMAIL && (
                      <button 
                        onClick={() => { setCurrentPage('admin'); setDropdownOpen(false); }}
                        className="w-full px-4 py-2.5 text-left hover:bg-[#FF3D00] hover:text-[#0A0A0A] flex items-center gap-2 transition-colors bg-transparent border-none cursor-pointer text-[#FF3D00]"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </button>
                    )}
                  </div>

                  <div className="py-1">
                    <button 
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left hover:bg-red-600 hover:text-white flex items-center gap-2 transition-colors bg-transparent border-none cursor-pointer text-red-500"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal('login')}
              className="h-11 px-5 flex items-center justify-center space-x-1.5 border border-[#FF3D00] text-xs font-mono font-black uppercase text-[#FF3D00] bg-[#FF3D00]/5 hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-all cursor-pointer rounded-none"
            >
              <LogIn className="w-4 h-4 flex-shrink-0" />
              <span>Log In</span>
            </button>
          )}

          {/* Hamburger Menu Icon for Mobile */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden h-11 w-11 flex items-center justify-center border border-current hover:bg-[#FF3D00] hover:text-[#0A0A0A] hover:border-[#FF3D00] transition-all cursor-pointer bg-transparent text-current"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

        </div>
      </div>
    </header>
  );
};

export default Header;
