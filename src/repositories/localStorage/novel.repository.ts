/**
 * localStorage implementation of INovelRepository.
 * TRANSITIONAL — will be replaced by Supabase queries.
 */

import { INovelRepository } from '../interfaces';
import { Novel } from '../../types';
import { INITIAL_NOVELS_DATA } from '../../data/novels';

const isClient = () => typeof window !== 'undefined';
const STORAGE_KEY = 'kult_novels_prod';

export class LocalStorageNovelRepository implements INovelRepository {
  getAll(): Novel[] {
    if (!isClient()) return INITIAL_NOVELS_DATA;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.save(INITIAL_NOVELS_DATA);
        return INITIAL_NOVELS_DATA;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_NOVELS_DATA;
    }
  }

  getById(id: string): Novel | null {
    const novels = this.getAll();
    return novels.find((n) => n.id === id) || null;
  }

  save(novels: Novel[]): void {
    if (!isClient()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novels));
    } catch {
      // If full novels (including long chapter texts) exceed localStorage quota,
      // save lightweight catalog metadata without heavy manuscript content
      try {
        const lightweightNovels = novels.map((novel) => ({
          ...novel,
          volumes: (novel.volumes || []).map((vol) => ({
            ...vol,
            chapters: (vol.chapters || []).map((ch) => ({
              id: ch.id,
              title: ch.title,
              publishDate: ch.publishDate,
              content: '', // Omit heavy manuscript text from catalog cache
            })),
          })),
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweightNovels));
      } catch (err) {
        console.warn('LocalStorage quota exceeded. Novel catalog cache truncated.', err);
      }
    }
  }

  create(novel: Novel): void {
    const novels = this.getAll();
    novels.unshift(novel);
    this.save(novels);
  }

  update(id: string, data: Partial<Novel>): void {
    const novels = this.getAll();
    const index = novels.findIndex((n) => n.id === id);
    if (index !== -1) {
      novels[index] = { ...novels[index], ...data };
      this.save(novels);
    }
  }

  delete(id: string): void {
    const novels = this.getAll().filter((n) => n.id !== id);
    this.save(novels);
  }
}
