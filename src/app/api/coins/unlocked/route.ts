/**
 * API Route: GET /api/coins/unlocked
 * Returns all unlocked chapters for the authenticated user from Neon DB.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getSessionUser } from '../../../../lib/auth/session';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const chapters = await prisma.unlockedChapter.findMany({
      where: { userId: session.userId },
      orderBy: { unlockedAt: 'desc' },
      select: {
        id: true,
        novelId: true,
        chapterId: true,
        cost: true,
        unlockedAt: true,
      },
    });

    return NextResponse.json(
      chapters.map((c) => ({
        id: c.id,
        novelId: c.novelId,
        chapterId: c.chapterId,
        cost: c.cost,
        unlockedAt: c.unlockedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Failed to fetch unlocked chapters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unlocked chapters' },
      { status: 500 }
    );
  }
}
