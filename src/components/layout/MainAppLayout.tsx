"use client";

import React, { useState, useEffect } from 'react';
import { useNovelStore } from '../../features/novels/store/novelStore';
import { useReaderStore } from '../../features/reader/store/readerStore';
import { useAuthStore } from '../../features/auth/store/authStore';
import { getThemeStyles } from '../../features/reader/utils/theme';

// Layout Blocks
import Header from './Header';
import AnnouncementBanner from './AnnouncementBanner';
import MobileMenu from './MobileMenu';
import MobileBottomNav from './MobileBottomNav';
import AuthModal from '../../features/auth/components/AuthModal';
import NotificationModal from '../modals/NotificationModal';
import ToastContainer from '../ui/ToastContainer';
import { CoinWalletModal } from '../../features/coins/components/CoinWalletModal';

// Pages
import DashboardPage from '../../features/novels/components/DashboardPage';
import BrowsePage from '../../features/novels/components/BrowsePage';
import LibraryPage from '../../features/library/components/LibraryPage';
import DetailPage from '../../features/novels/components/DetailPage';
import ReaderPage from '../../features/reader/components/ReaderPage';
import AdminDashboard from '../../features/admin/components/AdminDashboard';
import SettingsPage from '../../features/settings/components/SettingsPage';
import ProfilePage from '../../features/profile/components/ProfilePage';
import DmcaPage from '../../features/legal/components/DmcaPage';
import ContactPage from '../../features/legal/components/ContactPage';
import { CONFIG } from '../../config';
import { isAdmin } from '../../types/auth';

import { novelRepository } from '../../repositories';

export const MainAppLayout: React.FC = () => {
  const currentPage = useNovelStore((state) => state.currentPage);
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const readerSettings = useReaderStore((state) => state.readerSettings);
  const initializeSettings = useReaderStore((state) => state.initializeSettings);
  const currentUser = useAuthStore((state) => state.currentUser);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const initializeNovels = useNovelStore((state) => state.initializeNovels);

  // Selected as stable primitive IDs for useEffect dependency tracking
  const selectedNovelId = useNovelStore((state) => state.selectedNovel?.id);
  const activeChapterId = useReaderStore((state) => state.activeChapter?.id);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Prevents hydration mismatch: server renders neutral shell, client routing activates after mount
  const [mounted, setMounted] = useState(false);

  // Initialize settings on mount (auth, novels, library are handled by Providers.tsx)
  useEffect(() => {
    initializeSettings();
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, [initializeSettings]);

  // Restore state from Browser URL on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentNovels = novelRepository.getAll();
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);

    if (segments.length > 0) {
      const first = segments[0];
      if (first === 'browse') {
        setCurrentPage('browse');
      } else if (first === 'library') {
        setCurrentPage('library');
      } else if (first === 'settings') {
        setCurrentPage('settings');
      } else if (first === 'profile') {
        setCurrentPage('profile');
      } else if (first === 'dmca') {
        setCurrentPage('dmca');
      } else if (first === 'contact') {
        setCurrentPage('contact');
      } else if (first === 'admin') {
        setCurrentPage('admin');
      } else if (first === 'novel' || first === 'novels') {
        const novelId = segments[1];
        const chapterId = segments[2];
        const novel = currentNovels.find(n => n.id === novelId);
        if (novel) {
          useNovelStore.getState().setSelectedNovel(novel);
          if (chapterId) {
            const flatChapters = novel.volumes.flatMap(v => v.chapters);
            const chapter = flatChapters.find(c => c.id === chapterId);
            if (chapter) {
              useReaderStore.getState().setActiveChapter(chapter);
              setCurrentPage('reader');
              return;
            }
          }
          setCurrentPage('detail');
        } else {
          setCurrentPage('dashboard');
        }
      } else {
        setCurrentPage('dashboard');
      }
    }
  }, [setCurrentPage]);

  // Synchronize state changes to Browser URL (History API)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let targetPath = '/';
    const selectedNovel = useNovelStore.getState().selectedNovel;
    const activeChapter = useReaderStore.getState().activeChapter;

    switch (currentPage) {
      case 'dashboard':
        targetPath = '/';
        break;
      case 'browse':
        targetPath = '/browse';
        break;
      case 'library':
        targetPath = '/library';
        break;
      case 'settings':
        targetPath = '/settings';
        break;
      case 'profile':
        targetPath = '/profile';
        break;
      case 'dmca':
        targetPath = '/dmca';
        break;
      case 'contact':
        targetPath = '/contact';
        break;
      case 'admin':
        targetPath = '/admin';
        break;
      case 'detail':
        if (selectedNovel) {
          targetPath = `/novel/${selectedNovel.id}`;
        }
        break;
      case 'reader':
        if (selectedNovel && activeChapter) {
          targetPath = `/novel/${selectedNovel.id}/${activeChapter.id}`;
        }
        break;
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({ page: currentPage }, '', targetPath);
    }
  }, [currentPage, selectedNovelId, activeChapterId]);

  // Listen to popstate event (Browser Back/Forward navigation)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const currentNovels = novelRepository.getAll();
      const path = window.location.pathname;
      const segments = path.split('/').filter(Boolean);

      if (segments.length === 0) {
        setCurrentPage('dashboard');
        return;
      }

      const first = segments[0];
      if (first === 'browse') {
        setCurrentPage('browse');
      } else if (first === 'library') {
        setCurrentPage('library');
      } else if (first === 'settings') {
        setCurrentPage('settings');
      } else if (first === 'profile') {
        setCurrentPage('profile');
      } else if (first === 'dmca') {
        setCurrentPage('dmca');
      } else if (first === 'contact') {
        setCurrentPage('contact');
      } else if (first === 'admin') {
        setCurrentPage('admin');
      } else if (first === 'novel' || first === 'novels') {
        const novelId = segments[1];
        const chapterId = segments[2];
        const novel = currentNovels.find(n => n.id === novelId);
        if (novel) {
          useNovelStore.getState().setSelectedNovel(novel);
          if (chapterId) {
            const flatChapters = novel.volumes.flatMap(v => v.chapters);
            const chapter = flatChapters.find(c => c.id === chapterId);
            if (chapter) {
              useReaderStore.getState().setActiveChapter(chapter);
              setCurrentPage('reader');
              return;
            }
          }
          setCurrentPage('detail');
        } else {
          setCurrentPage('dashboard');
        }
      } else {
        setCurrentPage('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setCurrentPage]);

  const themeStyles = getThemeStyles(readerSettings.theme);

  const renderActivePage = () => {
    // Before client mount, render nothing to match server output (prevents hydration mismatch)
    if (!mounted) return null;

    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'browse':
        return <BrowsePage />;
      case 'library':
        return <LibraryPage />;
      case 'detail':
        return <DetailPage />;
      case 'reader':
        return <ReaderPage />;
      case 'settings':
        return <SettingsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'dmca':
        return <DmcaPage />;
      case 'contact':
        return <ContactPage />;
      case 'admin':
        if (isAdmin(currentUser)) {
          return <AdminDashboard />;
        }
        return <DashboardPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div 
      className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${themeStyles.bg} ${themeStyles.text} ${currentPage !== 'reader' ? 'pb-16 md:pb-0' : ''}`}
    >
      <div>
        {/* Global Notifications Modal */}
        <NotificationModal />

        {/* Global Login / Register Modal */}
        <AuthModal />

        {/* Global Coin Wallet Modal */}
        <CoinWalletModal />

        {/* Global Toast Feedback */}
        <ToastContainer />

        {/* Global Header & Announcement Banner (Hidden in reader view to give 100% canvas to reading) */}
        {currentPage !== 'reader' && (
          <>
            <AnnouncementBanner />
            <Header 
              mobileMenuOpen={mobileMenuOpen} 
              setMobileMenuOpen={setMobileMenuOpen} 
            />
            <MobileMenu 
              mobileMenuOpen={mobileMenuOpen} 
              setMobileMenuOpen={setMobileMenuOpen} 
            />
          </>
        )}

        {/* Active Page View */}
        {renderActivePage()}

        {/* Mobile Fixed Bottom Navigation Bar */}
        <MobileBottomNav />
      </div>

      {/* Global Footer */}
      <footer className={`border-t ${themeStyles.border} py-12 ${themeStyles.footerBg} ${themeStyles.accentText} transition-colors duration-200`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <span className="text-xs font-mono block tracking-wider">
            &copy; {new Date().getFullYear()} MALAZ TL &bull; LIGHT NOVEL TRANSLATION.
          </span>
          <nav aria-label="Footer Navigation" className="flex justify-center flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 text-xs font-mono">
            <button 
              onClick={() => setCurrentPage('dashboard')} 
              className="py-1 px-2.5 hover:text-[#FF3D00] transition-colors bg-transparent border-none cursor-pointer font-bold uppercase tracking-wider text-current/80 hover:text-current"
            >
              Catalog
            </button>
            <button 
              onClick={() => setCurrentPage('library')} 
              className="py-1 px-2.5 hover:text-[#FF3D00] transition-colors bg-transparent border-none cursor-pointer font-bold uppercase tracking-wider text-current/80 hover:text-current"
            >
              Bookshelf
            </button>
            <button 
              onClick={() => setCurrentPage('settings')} 
              className="py-1 px-2.5 hover:text-[#FF3D00] transition-colors bg-transparent border-none cursor-pointer font-bold uppercase tracking-wider text-current/80 hover:text-current"
            >
              Settings
            </button>
            <button 
              onClick={() => setCurrentPage('dmca')} 
              className="py-1 px-2.5 hover:text-[#FF3D00] transition-colors bg-transparent border-none cursor-pointer font-bold uppercase tracking-wider text-current/80 hover:text-current"
            >
              DMCA
            </button>
            <button 
              onClick={() => setCurrentPage('contact')} 
              className="py-1 px-2.5 hover:text-[#FF3D00] transition-colors bg-transparent border-none cursor-pointer font-bold uppercase tracking-wider text-current/80 hover:text-current"
            >
              Contact
            </button>
          </nav>
        </div>
      </footer>
    </div>
  );
};
export default MainAppLayout;
