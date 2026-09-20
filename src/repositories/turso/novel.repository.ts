/**
 * Turso implementation of INovelRepository.
 * Uses Turso libSQL client for fast edge reading and updating of content.
 */

import { INovelRepository } from '../interfaces';
import { Novel } from '../../types';
import { getTursoNovels, getTursoNovelById, upsertTursoNovel, getTursoClient } from '../../lib/db/turso';
import { INITIAL_NOVELS_DATA } from '../../data/novels';

export class TursoNovelRepository implements INovelRepository {
  private cache: Novel[] = INITIAL_NOVELS_DATA;

  constructor() {
    // Optimistically pre-fetch on server/runtime initialization
    this.refreshCache();
  }

  private async refreshCache() {
    try {
      const novels = await getTursoNovels();
      if (novels && novels.length > 0) {
        this.cache = novels;
      }
    } catch {
      // Keep cached data
    }
  }

  getAll(): Novel[] {
    return this.cache;
  }

  async getAllAsync(): Promise<Novel[]> {
    const novels = await getTursoNovels();
    this.cache = novels;
    return novels;
  }

  getById(id: string): Novel | null {
    return this.cache.find((n) => n.id === id) || null;
  }

  async getByIdAsync(id: string): Promise<Novel | null> {
    return await getTursoNovelById(id);
  }

  save(novels: Novel[]): void {
    this.cache = novels;
    for (const novel of novels) {
      upsertTursoNovel(novel).catch(console.error);
    }
  }

  create(novel: Novel): void {
    this.cache = [novel, ...this.cache];
    upsertTursoNovel(novel).catch(console.error);
  }

  update(id: string, data: Partial<Novel>): void {
    const index = this.cache.findIndex((n) => n.id === id);
    if (index !== -1) {
      const updated = { ...this.cache[index], ...data };
      this.cache[index] = updated;
      upsertTursoNovel(updated).catch(console.error);
    }
  }

  delete(id: string): void {
    this.cache = this.cache.filter((n) => n.id !== id);
    const client = getTursoClient();
    if (client) {
      client.execute({ sql: 'DELETE FROM novels WHERE id = ?', args: [id] }).catch(console.error);
    }
  }
}
