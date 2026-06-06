/**
 * localStorage implementation of ILibraryRepository.
 * TRANSITIONAL — will be replaced by Supabase per-user data.
 */

import { ILibraryRepository } from '../interfaces';
import { ReadingHistory } from '../../types';

const isClient = () => typeof window !== 'undefined';

export class LocalStorageLibraryRepository implements ILibraryRepository {
  getBookmarks(): string[] {
    if (!isClient()) return [];
    const data = localStorage.getItem('kult_bookmarks_prod');
    return data ? JSON.parse(data) : [];
  }

  saveBookmarks(bookmarks: string[]): void {
    if (!isClient()) return;
    localStorage.setItem('kult_bookmarks_prod', JSON.stringify(bookmarks));
  }

  getHistory(): ReadingHistory[] {
    if (!isClient()) return [];
    const data = localStorage.getItem('kult_history_prod');
    return data ? JSON.parse(data) : [];
  }

  saveHistory(history: ReadingHistory[]): void {
    if (!isClient()) return;
    localStorage.setItem('kult_history_prod', JSON.stringify(history));
  }

  getReadChapters(): string[] {
    if (!isClient()) return [];
    const data = localStorage.getItem('kult_read_chapters_prod');
    return data ? JSON.parse(data) : [];
  }

  saveReadChapters(chapters: string[]): void {
    if (!isClient()) return;
    localStorage.setItem('kult_read_chapters_prod', JSON.stringify(chapters));
  }
}
