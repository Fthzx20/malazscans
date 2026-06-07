/**
 * API Route: GET/POST /api/admin/novels/:id/volumes
 * Admin-only: List volumes or create a new volume for a novel.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { createServerSupabaseClient } from '../../../../../../lib/supabase/server';

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
  const { id: novelId } = await params;

  try {
    const volumes = await prisma.volume.findMany({
      where: { novelId },
      include: { _count: { select: { chapters: true } } },
      orderBy: { volumeNumber: 'asc' },
    });

    return NextResponse.json(volumes.map(v => ({
      id: v.id,
      volumeNumber: v.volumeNumber,
      title: v.title,
      chapterCount: v._count.chapters,
    })));
  } catch (error) {
    console.error('Failed to fetch volumes:', error);
    return NextResponse.json({ error: 'Failed to fetch volumes' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: novelId } = await params;

  try {
    const body = await request.json();
    const { title } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Volume title is required' }, { status: 400 });
    }

    // Get next volume number
    const lastVolume = await prisma.volume.findFirst({
      where: { novelId },
      orderBy: { volumeNumber: 'desc' },
    });
    const nextNumber = (lastVolume?.volumeNumber || 0) + 1;

    const volume = await prisma.volume.create({
      data: {
        novelId,
        volumeNumber: nextNumber,
        title: title.trim(),
      },
    });

    return NextResponse.json({
      id: volume.id,
      volumeNumber: volume.volumeNumber,
      title: volume.title,
      chapterCount: 0,
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create volume:', error);
    return NextResponse.json({ error: 'Failed to create volume' }, { status: 500 });
  }
}
