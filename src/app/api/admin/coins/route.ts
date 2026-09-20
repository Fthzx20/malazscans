import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAdminSession } from '../../../../lib/auth/admin';

/**
 * GET /api/admin/coins
 * Returns coin circulation, revenue, transaction ledger, and unlock logs.
 */
export async function GET() {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Aggregate statistics
    const [
      coinsSum,
      revenueSum,
      totalOrders,
      totalUnlocks,
      recentTransactions,
      recentOrders,
      recentUnlocks,
    ] = await Promise.all([
      prisma.user.aggregate({
        _sum: { coins: true },
      }),
      prisma.coinOrder.aggregate({
        where: { status: 'PAID' },
        _sum: { amountIdr: true },
      }),
      prisma.coinOrder.count({
        where: { status: 'PAID' },
      }),
      prisma.unlockedChapter.count(),
      prisma.coinTransaction.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coinOrder.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.unlockedChapter.findMany({
        take: 30,
        orderBy: { unlockedAt: 'desc' },
      }),
    ]);

    // Gather unique user IDs to attach usernames/emails
    const userIds = new Set<string>();
    recentTransactions.forEach((t) => t.userId && userIds.add(t.userId));
    recentOrders.forEach((o) => o.userId && userIds.add(o.userId));
    recentUnlocks.forEach((u) => u.userId && userIds.add(u.userId));

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, username: true, email: true, avatar: true, provider: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedTransactions = recentTransactions.map((t) => ({
      ...t,
      user: t.userId ? userMap.get(t.userId) || null : null,
    }));

    const enrichedOrders = recentOrders.map((o) => ({
      ...o,
      user: o.userId ? userMap.get(o.userId) || null : null,
    }));

    const enrichedUnlocks = recentUnlocks.map((u) => ({
      ...u,
      user: u.userId ? userMap.get(u.userId) || null : null,
    }));

    return NextResponse.json({
      summary: {
        totalCoinsCirculation: coinsSum._sum.coins || 0,
        totalRevenueIdr: revenueSum._sum.amountIdr || 0,
        totalPaidOrders: totalOrders,
        totalUnlocks: totalUnlocks,
      },
      recentTransactions: enrichedTransactions,
      recentOrders: enrichedOrders,
      recentUnlocks: enrichedUnlocks,
    });
  } catch (error) {
    console.error('Failed to fetch admin coin data:', error);
    return NextResponse.json({ error: 'Failed to fetch coin data' }, { status: 500 });
  }
}

/**
 * POST /api/admin/coins
 * Admin manual credit/debit adjustment for user coin balance.
 */
export async function POST(req: NextRequest) {
  try {
    const adminSession = await requireAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, amount, reason } = await req.json();

    if (!userId || typeof amount !== 'number' || amount === 0) {
      return NextResponse.json({ error: 'Invalid userId or amount' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure user coins don't go below 0
    const nextCoins = Math.max(0, targetUser.coins + amount);

    const [updatedUser, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { coins: nextCoins },
        select: { id: true, username: true, email: true, coins: true },
      }),
      prisma.coinTransaction.create({
        data: {
          userId,
          type: amount > 0 ? 'TOPUP' : 'UNLOCK',
          amount,
          description: reason || `Admin adjustment by ${adminSession.username}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      transaction,
    });
  } catch (error) {
    console.error('Failed to adjust user coins:', error);
    return NextResponse.json({ error: 'Failed to adjust user coins' }, { status: 500 });
  }
}
