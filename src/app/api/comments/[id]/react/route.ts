/**
 * API Route: POST /api/comments/:id/react
 * Toggle a reaction (like/heart) on a comment.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getSessionUser } from '../../../../../lib/auth/session';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const commentId = parseInt(id);

  if (isNaN(commentId)) {
    return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { type, username: rawUsername } = body;

    if (!type || !rawUsername) {
      return NextResponse.json({ error: 'type and username are required' }, { status: 400 });
    }

    if (!['like', 'heart'].includes(type)) {
      return NextResponse.json({ error: 'type must be "like" or "heart"' }, { status: 400 });
    }

    // Authenticate user identity via session or prevent impersonating registered users
    const session = await getSessionUser();
    let resolvedUsername = String(rawUsername).trim();

    if (session) {
      resolvedUsername = session.username || resolvedUsername;
    } else {
      const existingUser = await prisma.user.findFirst({
        where: { username: { equals: resolvedUsername, mode: 'insensitive' } },
        select: { id: true },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: 'This username belongs to a registered account. Please log in to react.' },
          { status: 403 }
        );
      }
    }

    // Check if reaction already exists (toggle)
    const existing = await prisma.reaction.findFirst({
      where: { commentId, type, username: resolvedUsername },
    });

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: 'removed', type, username: resolvedUsername });
    } else {
      await prisma.reaction.create({
        data: { commentId, type, username: resolvedUsername },
      });
      return NextResponse.json({ action: 'added', type, username: resolvedUsername });
    }
  } catch (error) {
    console.error('Failed to toggle reaction:', error);
    return NextResponse.json({ error: 'Failed to toggle reaction' }, { status: 500 });
  }
}
