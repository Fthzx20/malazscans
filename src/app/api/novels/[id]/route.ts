/**
 * API Route: GET /api/novels/:id
 * Returns a single novel by slug ID from Supabase Postgres.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const novel = await prisma.novel.findUnique({
      where: { id },
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
    });

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 });
    }

    const bookmarkCount = await prisma.bookmark.count({
      where: { novelId: id }
    });

    const mapped = {
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
      bookmarkCount,
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
    };

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Failed to fetch novel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch novel' },
      { status: 500 }
    );
  }
}
