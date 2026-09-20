/**
 * API Route: GET /api/auth/me
 * Returns current authenticated user and real-time coin balance from Neon.
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '../../../../lib/auth/session';
import prisma from '../../../../lib/prisma';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  // Fetch real-time coin balance, provider, and profile details from Neon
  let coins = 0;
  let provider: 'google' | 'github' | null = null;
  let createdAt: string | undefined = undefined;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { coins: true, role: true, avatar: true, username: true, provider: true, createdAt: true },
    });
    if (dbUser) {
      coins = dbUser.coins || 0;
      provider = (dbUser.provider as 'google' | 'github' | null) || null;
      createdAt = dbUser.createdAt?.toISOString();
    }
  } catch {
    // Running offline
  }

  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      username: session.username,
      role: session.role,
      avatar: session.avatar,
      provider,
      createdAt,
      coins,
    },
  });
}
