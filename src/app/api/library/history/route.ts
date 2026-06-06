/**
 * API Route: GET/POST /api/library/history
 * GET: Returns user's reading history
 * POST: Log reading progress
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

async function getAuthUserId(): Promise<string | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const history = await prisma.readingHistory.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    const mapped = history.map((h) => ({
      novelId: h.novelId,
      chapterId: h.chapterId,
      chapterTitle: h.chapterTitle,
      timestamp: h.timestamp.toISOString(),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { novelId, chapterId, chapterTitle } = await request.json();

    if (!novelId || !chapterId || !chapterTitle) {
      return NextResponse.json({ error: 'novelId, chapterId, and chapterTitle are required' }, { status: 400 });
    }

    // Upsert: remove old entry for same novel, add new
    await prisma.readingHistory.deleteMany({
      where: { userId, novelId },
    });

    const entry = await prisma.readingHistory.create({
      data: { userId, novelId, chapterId, chapterTitle },
    });

    return NextResponse.json({
      novelId: entry.novelId,
      chapterId: entry.chapterId,
      chapterTitle: entry.chapterTitle,
      timestamp: entry.timestamp.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to log history:', error);
    return NextResponse.json({ error: 'Failed to log history' }, { status: 500 });
  }
}
