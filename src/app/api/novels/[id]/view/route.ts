/**
 * API Route: POST /api/novels/:id/view
 * Increments the view counter for a novel.
 * Called when a user opens a novel detail page or reads a chapter.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.novel.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch {
    // Novel not found or DB error — non-fatal
    return NextResponse.json({ error: 'Failed to track view' }, { status: 404 });
  }
}
