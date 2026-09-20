import React from 'react';
import { Home, Compass, Bookmark, Settings, LogOut, LogIn, Shield, X, User, FileText, Mail, Coins } from 'lucide-react';
import { useNovelStore } from '../../features/novels/store/novelStore';
import { useLibraryStore } from '../../features/library/store/libraryStore';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useReaderStore } from '../../features/reader/store/readerStore';
import { useCoinStore } from '../../features/coins/store/coinStore';
import { getThemeStyles } from '../../features/reader/utils/theme';
import { isAdmin } from '../../types/auth';

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
  const userCoins = useCoinStore((state) => state.userCoins);
  const openWallet = useCoinStore((state) => state.openWallet);

  const themeStyles = getThemeStyles(readerSettings.theme);
  const drawerRef = React.useRef<HTMLElement>(null);

  // Lock scroll, trap focus, and handle Escape key
  React.useEffect(() => {
    if (!mobileMenuOpen) return;

    document.body.style.overflow = 'hidden';

    const drawerEl = drawerRef.current;
    if (drawerEl) {
      const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusableElements = drawerEl.querySelectorAll<HTMLElement>(focusableSelector);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      firstElement?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMobileMenuOpen(false);
        } else if (e.key === 'Tab') {
          if (focusableElements.length === 0) return;
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement?.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement?.focus();
              e.preventDefault();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, setMobileMenuOpen]);

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
        aria-hidden="true"
      />

      {/* Sliding Drawer Container */}
      <aside 
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
        aria-hidden={!mobileMenuOpen}
        tabIndex={-1}
        className={`fixed top-0 right-0 h-full w-72 max-w-full border-l ${themeStyles.border} ${themeStyles.cardBg} text-current z-50 transform transition-all duration-300 ease-in-out md:hidden flex flex-col justify-between shadow-2xl focus:outline-none ${
          mobileMenuOpen ? 'translate-x-0 opacity-100 visible pointer-events-auto' : 'translate-x-full opacity-0 invisible pointer-events-none'
        }`}
      >
        <div>
          {/* Drawer Header Close Button */}
          <div className={`flex justify-end p-4 border-b ${themeStyles.border}`}>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className={`${themeStyles.accentText} hover:text-[#FF3D00] bg-transparent border-none cursor-pointer p-1`}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section 1: User Profile Header */}
          <div className={`p-5 border-b ${themeStyles.border} ${themeStyles.bg} text-current`}>
            {currentUser ? (
              <div 
                onClick={() => navigateTo('profile')}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className={`w-12 h-12 border ${themeStyles.border} ${themeStyles.cardBg} overflow-hidden flex items-center justify-center`}>
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.username ? `${currentUser.username}'s avatar` : 'User avatar'} className="w-full h-full object-cover" />
                  ) : (
                    <User className={`w-5 h-5 ${themeStyles.accentText}`} />
                  )}
                </div>
                <div className="space-y-0.5 font-mono truncate max-w-[170px]">
                  <span className={`text-[10px] ${themeStyles.accentText} uppercase font-bold block flex items-center gap-1`}>
                    Reader Pass →
                  </span>
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
            <button 
              onClick={() => { openWallet(); setMobileMenuOpen(false); }}
              className="w-full text-left py-3 px-4 flex items-center justify-between hover:bg-amber-400 hover:text-black transition-colors rounded-none bg-transparent border-none cursor-pointer text-amber-400"
            >
              <div className="flex items-center gap-3">
                <Coins className="w-4 h-4" />
                <span>Coin Wallet</span>
              </div>
              <span className="font-mono font-bold text-xs">{userCoins.toLocaleString()}</span>
            </button>
          </nav>

          {/* Section 3: Account & Reader Preferences */}
          <div className="p-4 space-y-1 font-mono text-xs font-bold uppercase tracking-wider">
            {currentUser && (
              <button 
                onClick={() => navigateTo('profile')}
                className="w-full text-left py-3 px-4 flex items-center gap-3 hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-colors rounded-none bg-transparent border-none cursor-pointer text-current"
              >
                <User className="w-4 h-4 text-[#FF3D00]" />
                <span>Reader Profile</span>
              </button>
            )}
            <button 
              onClick={() => navigateTo('settings')}
              className="w-full text-left py-3 px-4 flex items-center gap-3 hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-colors rounded-none bg-transparent border-none cursor-pointer text-current"
            >
              <Settings className="w-4 h-4 text-[#FF3D00]" />
              <span>Reading Settings</span>
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
          {isAdmin(currentUser) && (
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
