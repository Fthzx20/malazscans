/**
 * API Route: POST /api/coins/unlock
 * Server-verified chapter unlock with Neon PostgreSQL transaction.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getSessionUser } from '../../../../lib/auth/session';
import { isTursoConfigured, getTursoClient } from '../../../../lib/db';

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { novelId, chapterId, chapterTitle } = body;

    if (!novelId || !chapterId) {
      return NextResponse.json(
        { error: 'novelId and chapterId are required' },
        { status: 400 }
      );
    }

    // 1. Fetch chapter lock and price directly from DB (Prisma or Turso) to prevent client spoofing
    let chapterInfo: { title: string; isLocked: boolean; coinPrice: number } | null = null;

    try {
      const dbChapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { title: true, isLocked: true, coinPrice: true },
      });
      if (dbChapter) {
        chapterInfo = {
          title: dbChapter.title,
          isLocked: dbChapter.isLocked,
          coinPrice: dbChapter.coinPrice,
        };
      }
    } catch {
      // Prisma offline or chapter not in Neon
    }

    if (!chapterInfo && isTursoConfigured) {
      try {
        const client = getTursoClient();
        if (client) {
          const res = await client.execute({
            sql: 'SELECT title, isLocked, coinPrice FROM chapters WHERE id = ? LIMIT 1',
            args: [chapterId],
          });
          if (res.rows.length > 0) {
            const row = res.rows[0];
            chapterInfo = {
              title: String(row.title),
              isLocked: Boolean(row.isLocked),
              coinPrice: Number(row.coinPrice ?? 5),
            };
          }
        }
      } catch (tursoErr) {
        console.warn('Failed to query Turso for chapter info:', tursoErr);
      }
    }

    // Determine verified unlock cost
    let unlockCost = 5;
    if (chapterInfo) {
      if (!chapterInfo.isLocked || chapterInfo.coinPrice <= 0) {
        unlockCost = 0;
      } else {
        unlockCost = chapterInfo.coinPrice;
      }
    } else {
      // Fallback: If chapter not found in either DB, validate body cost safely
      const requestedCost = typeof body.cost === 'number' ? body.cost : 5;
      unlockCost = requestedCost > 0 ? requestedCost : 5;
    }

    // 2. Fetch current user balance
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, coins: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Free chapter check
    if (unlockCost === 0) {
      await prisma.unlockedChapter.upsert({
        where: { userId_chapterId: { userId: session.userId, chapterId } },
        update: {},
        create: {
          userId: session.userId,
          novelId,
          chapterId,
          cost: 0,
        },
      });
      return NextResponse.json({ success: true, coins: user.coins });
    }

    // 2. Check if already unlocked
    const existing = await prisma.unlockedChapter.findUnique({
      where: { userId_chapterId: { userId: session.userId, chapterId } },
    });

    if (existing) {
      return NextResponse.json({ success: true, coins: user.coins, alreadyUnlocked: true });
    }

    // 3. Balance verification
    if (user.coins < unlockCost) {
      return NextResponse.json(
        { error: 'Insufficient coins. Please top up your wallet.' },
        { status: 400 }
      );
    }

    // 4. Atomic transaction: Deduct coins, record transaction, record unlocked chapter
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.userId },
        data: { coins: { decrement: unlockCost } },
        select: { coins: true },
      }),
      prisma.coinTransaction.create({
        data: {
          userId: session.userId,
          type: 'UNLOCK',
          amount: -unlockCost,
          description: chapterTitle ? `Unlocked: ${chapterTitle}` : `Unlocked Chapter #${chapterId}`,
          novelId,
          chapterId,
        },
      }),
      prisma.unlockedChapter.create({
        data: {
          userId: session.userId,
          novelId,
          chapterId,
          cost: unlockCost,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      coins: updatedUser.coins,
      chapterId,
      novelId,
    });
  } catch (error) {
    console.error('Failed to unlock chapter:', error);
    return NextResponse.json(
      { error: 'Failed to process chapter unlock' },
      { status: 500 }
    );
  }
}
