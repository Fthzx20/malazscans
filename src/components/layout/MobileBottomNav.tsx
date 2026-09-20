"use client";

import React from 'react';
import { Home, Compass, Bookmark, Settings, User } from 'lucide-react';
import { useNovelStore } from '../../features/novels/store/novelStore';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useLibraryStore } from '../../features/library/store/libraryStore';
import { useReaderStore } from '../../features/reader/store/readerStore';
import { getThemeStyles } from '../../features/reader/utils/theme';

export const MobileBottomNav: React.FC = () => {
  const currentPage = useNovelStore((state) => state.currentPage);
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const setSelectedGenre = useNovelStore((state) => state.setSelectedGenre);
  const currentUser = useAuthStore((state) => state.currentUser);
  const setShowAuthModal = useAuthStore((state) => state.setShowAuthModal);
  const bookmarks = useLibraryStore((state) => state.bookmarks);
  const readerSettings = useReaderStore((state) => state.readerSettings);

  const themeStyles = getThemeStyles(readerSettings.theme);

  // Do not render bottom nav on reader page to preserve 100% canvas and prevent occlusion
  if (currentPage === 'reader') {
    return null;
  }

  const navItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: Home,
      action: () => {
        setSelectedGenre('ALL');
        setCurrentPage('dashboard');
      },
      isActive: currentPage === 'dashboard',
    },
    {
      id: 'browse',
      label: 'Browse',
      icon: Compass,
      action: () => {
        setSelectedGenre('ALL');
        setCurrentPage('browse');
      },
      isActive: currentPage === 'browse',
    },
    {
      id: 'library',
      label: 'Library',
      icon: Bookmark,
      badge: bookmarks.length > 0 ? bookmarks.length : undefined,
      action: () => setCurrentPage('library'),
      isActive: currentPage === 'library',
    },
    {
      id: 'settings',
      label: currentUser ? 'Profile' : 'Account',
      icon: currentUser ? User : Settings,
      action: () => {
        if (currentUser) {
          setCurrentPage('settings');
        } else {
          setShowAuthModal('login');
        }
      },
      isActive: currentPage === 'settings',
    },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t ${themeStyles.border} ${themeStyles.headerBg} backdrop-blur-md transition-colors duration-200 text-current`}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.25rem)' }}
    >
      <div className="grid grid-cols-4 h-14 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`h-full flex flex-col items-center justify-center gap-0.5 relative transition-colors cursor-pointer bg-transparent border-none ${
                active ? 'text-[#FF3D00]' : 'text-current/60 hover:text-current'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {/* Active top line indicator */}
              {active && (
                <span className="absolute top-0 left-3 right-3 h-[2px] bg-[#FF3D00]" />
              )}
              
              <div className="relative">
                <Icon className={`w-4 h-4 ${active ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#FF3D00] text-[#0A0A0A] text-[9px] font-mono font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
