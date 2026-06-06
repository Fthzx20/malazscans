/**
 * localStorage implementation of ISettingsRepository.
 * Reader settings will REMAIN in localStorage even after Supabase migration
 * (user preference data, no security concern).
 */

import { ISettingsRepository } from '../interfaces';
import { ReaderSettings } from '../../types';

const isClient = () => typeof window !== 'undefined';
const STORAGE_KEY = 'kult_reader_settings';

const DEFAULT_READER_SETTINGS: ReaderSettings = {
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

export class LocalStorageSettingsRepository implements ISettingsRepository {
  getReaderSettings(): ReaderSettings {
    if (!isClient()) return DEFAULT_READER_SETTINGS;
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_READER_SETTINGS));
      return DEFAULT_READER_SETTINGS;
    }
    return { ...DEFAULT_READER_SETTINGS, ...JSON.parse(data) };
  }

  saveReaderSettings(settings: ReaderSettings): void {
    if (!isClient()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}
