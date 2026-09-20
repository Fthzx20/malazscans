/**
 * API Route: POST /api/admin/novels
 * Admin-only: Create a new novel.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAdminSession } from '../../../../lib/auth/admin';
import { syncNovelToTurso } from '../../../../lib/db/turso';

interface InputChapter {
  id: string;
  title: string;
  publishDate?: string;
  content?: string;
}

interface InputVolume {
  volumeNumber: number;
  title: string;
  chapters?: InputChapter[];
}

export async function POST(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (!body.id || !body.title) {
      return NextResponse.json({ error: 'Title and slug ID are required' }, { status: 400 });
    }

    const novelData = {
      title: body.title,
      alternativeTitle: body.alternativeTitle || '',
      originalTitle: body.originalTitle || '',
      japaneseTitle: body.japaneseTitle || '',
      romajiTitle: body.romajiTitle || '',
      author: body.author || '',
      illustrator: body.illustrator || '',
      translator: body.translator || '',
      publisher: body.publisher || '',
      synopsis: body.synopsis || '',
      status: body.status || 'ONGOING',
      releaseSchedule: body.releaseSchedule || '',
      rating: parseFloat(body.rating) || 0,
      views: parseInt(String(body.views).replace(/,/g, '')) || 0,
      genres: body.genres || [],
      tags: body.tags || [],
      coverImage: body.coverImage || null,
      isRecommended: Boolean(body.isRecommended),
    };

    // 1. Upsert into Neon PostgreSQL
    const novel = await prisma.novel.upsert({
      where: { id: body.id },
      update: novelData,
      create: {
        id: body.id,
        ...novelData,
        volumes: {
          create: (body.volumes as InputVolume[] || []).map((vol) => ({
            volumeNumber: vol.volumeNumber,
            title: vol.title,
            chapters: {
              create: (vol.chapters || []).map((ch) => ({
                id: ch.id,
                title: ch.title,
                publishDate: ch.publishDate ? new Date(ch.publishDate) : new Date(),
                content: ch.content || '',
              })),
            },
          })),
        },
      },
      include: {
        volumes: {
          include: {
            chapters: { orderBy: { publishDate: 'asc' } },
          },
          orderBy: { volumeNumber: 'asc' },
        },
      },
    });

    // 2. Synchronize to Turso libSQL
    await syncNovelToTurso({
      ...novel,
      volumes: (novel.volumes || []).map((v) => ({
        id: v.id,
        volumeNumber: v.volumeNumber,
        title: v.title,
        chapters: (v.chapters || []).map((c) => ({
          id: c.id,
          title: c.title,
          publishDate: c.publishDate.toISOString(),
          content: c.content,
          isLocked: c.isLocked,
          coinPrice: c.coinPrice,
        })),
      })),
    });

    return NextResponse.json({ id: novel.id, title: novel.title }, { status: 201 });
  } catch (error) {
    console.error('Failed to create/upsert novel:', error);
    return NextResponse.json({ error: 'Failed to create novel' }, { status: 500 });
  }
}
