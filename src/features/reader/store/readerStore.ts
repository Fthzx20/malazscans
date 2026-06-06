import { create } from 'zustand';
import { Chapter, ReaderSettings } from '../../../types';
import { settingsRepository } from '../../../repositories';

// Default settings used during SSR (no localStorage access)
const SSR_SAFE_DEFAULTS: ReaderSettings = {
  fontSize: 'text-lg',
  lineHeight: 'leading-relaxed',
  paragraphSpacing: 'space-y-6',
  contentWidth: 'max-w-2xl',
  theme: 'dark',
  fontFamily: 'font-serif',
  autoBookmark: true,
  autoSaveProgress: true,
  rememberPosition: true,
  hideMatureContent: false,
  showIllustrations: true,
  showTranslatorNotes: true,
  showAuthorNotes: true,
  newChapterNotify: true,
  announcementNotify: true
};

interface ReaderState {
  activeChapter: Chapter | null;
  isSettingsOpen: boolean;
  showIllustrations: boolean;
  readerSettings: ReaderSettings;
  setActiveChapter: (chapter: Chapter | null) => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  setShowIllustrations: (show: boolean) => void;
  setReaderSettings: (settings: Partial<ReaderSettings>) => void;
  initializeSettings: () => void;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  activeChapter: null,
  isSettingsOpen: false,
  showIllustrations: true,
  readerSettings: SSR_SAFE_DEFAULTS, // Safe for SSR — real values loaded in initializeSettings
  setActiveChapter: (chapter) => set({ activeChapter: chapter }),
  setIsSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  setShowIllustrations: (show) => set({ showIllustrations: show }),
  setReaderSettings: (settings) => {
    const updated = { ...get().readerSettings, ...settings };
    settingsRepository.saveReaderSettings(updated);
    set({ readerSettings: updated });
  },
  initializeSettings: () => {
    const settings = settingsRepository.getReaderSettings();
    set({ readerSettings: settings });
  }
}));

export default useReaderStore;
