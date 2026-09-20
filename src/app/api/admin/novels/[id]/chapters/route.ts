/**
 * API Route: POST /api/admin/novels/:id/chapters
 * Admin-only: Add a chapter to a novel's first volume.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { requireAdminSession } from '../../../../../../lib/auth/admin';
import { upsertTursoChapter } from '../../../../../../lib/db/turso';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: novelId } = await params;

  try {
    const body = await request.json();
    const { id, title, content, volumeId, isLocked, coinPrice } = body;

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

    const chapter = await prisma.chapter.upsert({
      where: { id },
      update: {
        title,
        content: content || '',
        volumeId: targetVolumeId,
        isLocked: typeof isLocked === 'boolean' ? isLocked : false,
        coinPrice: typeof coinPrice === 'number' ? coinPrice : 5,
      },
      create: {
        id,
        title,
        content: content || '',
        volumeId: targetVolumeId,
        isLocked: typeof isLocked === 'boolean' ? isLocked : false,
        coinPrice: typeof coinPrice === 'number' ? coinPrice : 5,
      },
    });

    // Sync to Turso
    await upsertTursoChapter(chapter, targetVolumeId);

    return NextResponse.json({
      id: chapter.id,
      title: chapter.title,
      isLocked: chapter.isLocked,
      coinPrice: chapter.coinPrice,
      publishDate: chapter.publishDate.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create/upsert chapter:', error);
    return NextResponse.json({ error: 'Failed to create chapter' }, { status: 500 });
  }
}
