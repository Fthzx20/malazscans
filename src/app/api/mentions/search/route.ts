/**
 * API Route: GET /api/mentions/search?q=...
 * Searches novels matching the query by title, alternative title, romaji, original, or Japanese title.
 * Used for autocompleting novel mentions.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (q.trim().length < 2) {
      return NextResponse.json([]);
    }

    const novels = await prisma.novel.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { alternativeTitle: { contains: q, mode: 'insensitive' } },
          { originalTitle: { contains: q, mode: 'insensitive' } },
          { japaneseTitle: { contains: q, mode: 'insensitive' } },
          { romajiTitle: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        coverImage: true,
        status: true,
        rating: true,
        genres: true,
      },
      take: 10,
    });

    const mapped = novels.map((n) => ({
      id: n.id,
      title: n.title,
      cover: n.coverImage || '',
      status: n.status,
      rating: n.rating,
      genres: n.genres,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Failed to search novel mentions:', error);
    return NextResponse.json({ error: 'Failed to search novel mentions' }, { status: 500 });
  }
}
