/**
 * API Route: GET /api/novels
 * Returns all novels from Supabase Postgres via Prisma.
 * 
 * This is the server-side data source. Client can fetch here
 * instead of localStorage once the swap is complete.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  try {
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

    // Map to frontend-compatible shape
    const mapped = novels.map((novel) => ({
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
      addedDate: novel.addedDate.toISOString(),
      rating: String(novel.rating),
      ratingCount: novel.ratingCount || 0,
      views: novel.views.toLocaleString(),
      genres: novel.genres,
      tags: novel.tags,
      coverImage: novel.coverImage || '',
      isRecommended: novel.isRecommended,
      volumes: novel.volumes.map((vol) => ({
        volumeNumber: vol.volumeNumber,
        title: vol.title,
        chapters: vol.chapters.map((ch) => ({
          id: ch.id,
          title: ch.title,
          publishDate: ch.publishDate.toISOString(),
          content: ch.content,
        })),
      })),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Failed to fetch novels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch novels' },
      { status: 500 }
    );
  }
}
