/**
 * API Route: POST /api/admin/novels/:id/chapters
 * Admin-only: Add a chapter to a novel's first volume.
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
    const { id, title, content, volumeId } = body;

    if (!id || !title) {
      return NextResponse.json({ error: 'id and title are required' }, { status: 400 });
    }

    // Find the target volume (use provided volumeId or first volume)
    let targetVolumeId = volumeId;
    if (!targetVolumeId) {
      const firstVolume = await prisma.volume.findFirst({
        where: { novelId },
        orderBy: { volumeNumber: 'asc' },
      });
      if (!firstVolume) {
        return NextResponse.json({ error: 'Novel has no volumes' }, { status: 400 });
      }
      targetVolumeId = firstVolume.id;
    }

    const chapter = await prisma.chapter.create({
      data: {
        id,
        title,
        content: content || '',
        volumeId: targetVolumeId,
      },
    });

    return NextResponse.json({
      id: chapter.id,
      title: chapter.title,
      publishDate: chapter.publishDate.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create chapter:', error);
    return NextResponse.json({ error: 'Failed to create chapter' }, { status: 500 });
  }
}
