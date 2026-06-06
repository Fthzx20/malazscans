/**
 * API Route: POST /api/admin/novels
 * Admin-only: Create a new novel.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.role === 'admin';
  } catch {
    return false;
  }
}

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
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    const novel = await prisma.novel.create({
      data: {
        id: body.id,
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
        isRecommended: body.isRecommended || false,
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
    });

    return NextResponse.json({ id: novel.id, title: novel.title }, { status: 201 });
  } catch (error) {
    console.error('Failed to create novel:', error);
    return NextResponse.json({ error: 'Failed to create novel' }, { status: 500 });
  }
}
