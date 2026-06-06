import { create } from 'zustand';
import { Chapter, ReaderSettings } from '../../../types';
import { settingsRepository } from '../../../repositories';

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
  readerSettings: settingsRepository.getReaderSettings(),
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
