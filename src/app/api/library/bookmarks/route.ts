/**
 * API Route: GET/POST /api/library/bookmarks
 * GET: Returns user's bookmarks
 * POST: Toggle a bookmark (add or remove)
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
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      select: { novelId: true },
    });

    return NextResponse.json(bookmarks.map((b) => b.novelId));
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { novelId } = await request.json();

    if (!novelId) {
      return NextResponse.json({ error: 'novelId is required' }, { status: 400 });
    }

    // Toggle: check if exists
    const existing = await prisma.bookmark.findUnique({
      where: { userId_novelId: { userId, novelId } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: 'removed', novelId });
    } else {
      await prisma.bookmark.create({ data: { userId, novelId } });
      return NextResponse.json({ action: 'added', novelId });
    }
  } catch (error) {
    console.error('Failed to toggle bookmark:', error);
    return NextResponse.json({ error: 'Failed to toggle bookmark' }, { status: 500 });
  }
}
