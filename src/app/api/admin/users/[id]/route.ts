/**
 * API Route: GET/PATCH /api/admin/users/:id
 * Admin-only: Get user details or update user profile.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { createServerSupabaseClient } from '../../../../../lib/supabase/server';

async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.role === 'admin';
  } catch {
    return false;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            comments: true,
            bookmarks: true,
            readingHistory: true,
          },
        },
        readingHistory: {
          orderBy: { timestamp: 'desc' },
          take: 5,
          select: { chapterTitle: true, novelId: true, timestamp: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      commentsCount: user._count.comments,
      bookmarksCount: user._count.bookmarks,
      readingHistoryCount: user._count.readingHistory,
      recentActivity: user.readingHistory.map((h) => ({
        chapterTitle: h.chapterTitle,
        novelId: h.novelId,
        timestamp: h.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data: any = {};

    if (body.username !== undefined) data.username = body.username;
    if (body.avatar !== undefined) data.avatar = body.avatar;

    const updated = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ id: updated.id, username: updated.username });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
