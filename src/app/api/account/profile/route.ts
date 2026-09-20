/**
 * API Route: GET/PATCH /api/account/profile
 * Authenticated user: Read or update their own profile via Neon Session.
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
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        coins: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    // Validate username if provided
    if (body.username !== undefined) {
      const trimmed = body.username.trim();
      if (!trimmed || trimmed.length < 2) {
        return NextResponse.json({ error: 'Username must be at least 2 characters.' }, { status: 400 });
      }
      if (trimmed.length > 30) {
        return NextResponse.json({ error: 'Username must be 30 characters or less.' }, { status: 400 });
      }

      // Check uniqueness (skip if same user)
      const existing = await prisma.user.findUnique({ where: { username: trimmed } });
      if (existing && existing.id !== session.userId) {
        return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 });
      }

      updateData.username = trimmed;
    }

    if (body.avatar !== undefined) {
      updateData.avatar = body.avatar || null;
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        coins: true,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    if (error?.code === 'P2002' && error?.meta?.target?.includes('username')) {
      return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 });
    }
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
