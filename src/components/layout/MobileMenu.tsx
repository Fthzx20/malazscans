import React from 'react';
import { Home, Compass, Bookmark, Settings, LogOut, LogIn, Shield, X, User, FileText, Mail } from 'lucide-react';
import { useNovelStore } from '../../features/novels/store/novelStore';
import { useLibraryStore } from '../../features/library/store/libraryStore';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useReaderStore } from '../../features/reader/store/readerStore';
import { getThemeStyles } from '../../features/reader/utils/theme';
import { CONFIG } from '../../config';

interface MobileMenuProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const setSelectedGenre = useNovelStore((state) => state.setSelectedGenre);
  const bookmarks = useLibraryStore((state) => state.bookmarks);
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const setShowAuthModal = useAuthStore((state) => state.setShowAuthModal);
  const readerSettings = useReaderStore((state) => state.readerSettings);
  const triggerToast = useNovelStore((state) => state.triggerToast);

  const themeStyles = getThemeStyles(readerSettings.theme);

  const navigateTo = (page: string) => {
    if (page === 'browse') {
      setSelectedGenre('ALL');
    }
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    triggerToast("Logged out successfully.");
    navigateTo('dashboard');
  };

  const handleLoginClick = () => {
    setMobileMenuOpen(false);
    setShowAuthModal('login');
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 md:hidden ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sliding Drawer Container */}
      <aside 
        className={`fixed top-0 right-0 h-full w-72 max-w-full border-l ${themeStyles.border} ${themeStyles.cardBg} text-current z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col justify-between shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div>
          {/* Drawer Header Close Button */}
          <div className={`flex justify-end p-4 border-b ${themeStyles.border}`}>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className={`${themeStyles.accentText} hover:text-[#FF3D00] bg-transparent border-none cursor-pointer p-1`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section 1: User Profile Header */}
          <div className={`p-5 border-b ${themeStyles.border} ${themeStyles.bg} text-current`}>
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 border ${themeStyles.border} ${themeStyles.cardBg} overflow-hidden flex items-center justify-center`}>
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className={`w-5 h-5 ${themeStyles.accentText}`} />
                  )}
                </div>
                <div className="space-y-0.5 font-mono truncate max-w-[170px]">
                  <span className={`text-xs ${themeStyles.accentText} uppercase font-bold block`}>Active Profile</span>
                  <span className="font-bold text-current block text-sm truncate">{currentUser.username}</span>
                  <span className={`text-[10px] ${themeStyles.accentText} block truncate`}>{currentUser.email}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 font-mono">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 border ${themeStyles.border} ${themeStyles.cardBg} flex items-center justify-center`}>
                    <User className={`w-4 h-4 ${themeStyles.accentText}`} />
                  </div>
                  <span className={`text-xs ${themeStyles.accentText}`}>Not logged in</span>
                </div>
                <button 
                  onClick={handleLoginClick}
                  className="w-full bg-[#FF3D00] text-[#0A0A0A] text-xs font-bold font-mono py-2.5 uppercase transition-colors hover:bg-white cursor-pointer border-none flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In to Account</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Main Navigation Links */}
          <nav className={`p-4 space-y-1 border-b ${themeStyles.border} font-mono text-xs font-bold uppercase tracking-wider`}>
            <button 
              onClick={() => navigateTo('dashboard')}
              className="w-full text-left py-3 px-4 flex items-center gap-3 hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-colors rounded-none bg-transparent border-none cursor-pointer text-current"
            >
              <Home className="w-4 h-4 text-[#FF3D00]" />
              <span>Home</span>
            </button>
            <button 
              onClick={() => navigateTo('browse')}
              className="w-full text-left py-3 px-4 flex items-center gap-3 hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-colors rounded-none bg-transparent border-none cursor-pointer text-current"
            >
              <Compass className="w-4 h-4 text-[#FF3D00]" />
              <span>Browse Directory</span>
            </button>
            <button 
              onClick={() => navigateTo('library')}
              className="w-full text-left py-3 px-4 flex items-center gap-3 hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-colors rounded-none bg-transparent border-none cursor-pointer text-current"
            >
              <Bookmark className="w-4 h-4 text-[#FF3D00]" />
              <span>My Bookshelf ({bookmarks.length})</span>
            </button>
          </nav>

          {/* Section 3: Account & Reader Preferences */}
          <div className="p-4 space-y-1 font-mono text-xs font-bold uppercase tracking-wider">
            <button 
              onClick={() => navigateTo('settings')}
              className="w-full text-left py-3 px-4 flex items-center gap-3 hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-colors rounded-none bg-transparent border-none cursor-pointer text-current"
            >
              <Settings className="w-4 h-4 text-[#FF3D00]" />
              <span>Settings & Profile</span>
            </button>
            <button 
              onClick={() => navigateTo('dmca')}
              className="w-full text-left py-3 px-4 flex items-center gap-3 hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-colors rounded-none bg-transparent border-none cursor-pointer text-current"
            >
              <FileText className="w-4 h-4 text-[#FF3D00]" />
              <span>DMCA Policy</span>
            </button>
            <button 
              onClick={() => navigateTo('contact')}
              className="w-full text-left py-3 px-4 flex items-center gap-3 hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-colors rounded-none bg-transparent border-none cursor-pointer text-current"
            >
              <Mail className="w-4 h-4 text-[#FF3D00]" />
              <span>Contact Us</span>
            </button>
          </div>
        </div>

        {/* Section 4: Administration & Log Out footer */}
        <div className={`p-4 border-t ${themeStyles.border} space-y-2 font-mono text-xs font-bold uppercase`}>
          {currentUser && currentUser.email === CONFIG.ADMIN_EMAIL && (
            <button 
              onClick={() => navigateTo('admin')}
              className="w-full text-left py-3 px-4 flex items-center gap-3 hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-colors rounded-none bg-transparent border-none cursor-pointer text-[#FF3D00]"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </button>
          )}

          {currentUser && (
            <button 
              onClick={handleLogout}
              className="w-full text-left py-3 px-4 flex items-center gap-3 hover:bg-red-600 hover:text-white transition-colors rounded-none bg-transparent border-none cursor-pointer text-red-500"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default MobileMenu;
