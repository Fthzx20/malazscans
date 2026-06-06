/**
 * Supabase/Prisma implementation of INovelRepository.
 * Uses Prisma Client for type-safe queries against Supabase Postgres.
 * 
 * NOTE: This runs SERVER-SIDE only (API routes / server actions).
 * Client components should call API routes that use this repository.
 */

import { INovelRepository } from '../interfaces';
import { Novel } from '../../types';
import prisma from '../../lib/prisma';

/**
 * Maps Prisma Novel (with volumes/chapters) to the app's Novel type.
 */
function mapToNovel(dbNovel: any): Novel {
  return {
    id: dbNovel.id,
    title: dbNovel.title,
    alternativeTitle: dbNovel.alternativeTitle || '',
    originalTitle: dbNovel.originalTitle || '',
    japaneseTitle: dbNovel.japaneseTitle || '',
    romajiTitle: dbNovel.romajiTitle || '',
    author: dbNovel.author,
    illustrator: dbNovel.illustrator || '',
    translator: dbNovel.translator || '',
    publisher: dbNovel.publisher || '',
    synopsis: dbNovel.synopsis || '',
    status: dbNovel.status,
    releaseSchedule: dbNovel.releaseSchedule || '',
    addedDate: dbNovel.addedDate?.toISOString?.() || new Date().toISOString(),
    rating: String(dbNovel.rating || 0),
    ratingCount: dbNovel.ratingCount || 0,
    views: String(dbNovel.views || 0),
    genres: dbNovel.genres || [],
    tags: dbNovel.tags || [],
    coverImage: dbNovel.coverImage || undefined,
    isRecommended: dbNovel.isRecommended || false,
    volumes: (dbNovel.volumes || []).map((vol: any) => ({
      volumeNumber: vol.volumeNumber,
      title: vol.title,
      chapters: (vol.chapters || []).map((ch: any) => ({
        id: ch.id,
        title: ch.title,
        publishDate: ch.publishDate?.toISOString?.() || new Date().toISOString(),
        content: ch.content || '',
      })),
    })),
  };
}

export class SupabaseNovelRepository implements INovelRepository {
  getAll(): Novel[] {
    // Sync stub — server actions should use getAllAsync()
    return [];
  }

  async getAllAsync(): Promise<Novel[]> {
    const novels = await prisma.novel.findMany({
      include: {
        volumes: {
          include: {
            chapters: {
              orderBy: { publishDate: 'asc' },
            },
          },
          orderBy: { volumeNumber: 'asc' },
        },
      },
      orderBy: { addedDate: 'desc' },
    });

    return novels.map(mapToNovel);
  }

  getById(id: string): Novel | null {
    return null; // Use getByIdAsync in server context
  }

  async getByIdAsync(id: string): Promise<Novel | null> {
    const novel = await prisma.novel.findUnique({
      where: { id },
      include: {
        volumes: {
          include: { chapters: { orderBy: { publishDate: 'asc' } } },
          orderBy: { volumeNumber: 'asc' },
        },
      },
    });

    return novel ? mapToNovel(novel) : null;
  }

  save(novels: Novel[]): void {
    // Batch save not typical for Supabase — use individual CRUD
  }

  create(novel: Novel): void {
    this.createAsync(novel);
  }

  async createAsync(novel: Novel): Promise<void> {
    await prisma.novel.create({
      data: {
        id: novel.id,
        title: novel.title,
        alternativeTitle: novel.alternativeTitle,
        originalTitle: novel.originalTitle,
        japaneseTitle: novel.japaneseTitle,
        romajiTitle: novel.romajiTitle,
        author: novel.author,
        illustrator: novel.illustrator,
        translator: novel.translator,
        publisher: novel.publisher,
        synopsis: novel.synopsis,
        status: novel.status,
        releaseSchedule: novel.releaseSchedule,
        addedDate: new Date(novel.addedDate),
        rating: parseFloat(novel.rating) || 0,
        ratingCount: novel.ratingCount || 0,
        views: parseInt(novel.views.replace(/,/g, '')) || 0,
        genres: novel.genres,
        tags: novel.tags,
        coverImage: novel.coverImage || null,
        isRecommended: novel.isRecommended,
        volumes: {
          create: novel.volumes.map((vol) => ({
            volumeNumber: vol.volumeNumber,
            title: vol.title,
            chapters: {
              create: vol.chapters.map((ch) => ({
                id: ch.id,
                title: ch.title,
                publishDate: new Date(ch.publishDate),
                content: ch.content,
              })),
            },
          })),
        },
      },
    });
  }

  update(id: string, data: Partial<Novel>): void {
    this.updateAsync(id, data);
  }

  async updateAsync(id: string, data: Partial<Novel>): Promise<void> {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.synopsis !== undefined) updateData.synopsis = data.synopsis;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.rating !== undefined) updateData.rating = parseFloat(data.rating);
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.isRecommended !== undefined) updateData.isRecommended = data.isRecommended;
    if (data.genres !== undefined) updateData.genres = data.genres;
    if (data.tags !== undefined) updateData.tags = data.tags;

    await prisma.novel.update({ where: { id }, data: updateData });
  }

  delete(id: string): void {
    this.deleteAsync(id);
  }

  async deleteAsync(id: string): Promise<void> {
    await prisma.novel.delete({ where: { id } });
  }
}
