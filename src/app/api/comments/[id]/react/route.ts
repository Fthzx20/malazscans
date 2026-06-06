/**
 * API Route: POST /api/comments/:id/react
 * Toggle a reaction (like/heart) on a comment.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

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
    const { type, username } = body;

    if (!type || !username) {
      return NextResponse.json({ error: 'type and username are required' }, { status: 400 });
    }

    if (!['like', 'heart'].includes(type)) {
      return NextResponse.json({ error: 'type must be "like" or "heart"' }, { status: 400 });
    }

    // Check if reaction already exists (toggle)
    const existing = await prisma.reaction.findFirst({
      where: { commentId, type, username },
    });

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: 'removed', type, username });
    } else {
      await prisma.reaction.create({
        data: { commentId, type, username },
      });
      return NextResponse.json({ action: 'added', type, username });
    }
  } catch (error) {
    console.error('Failed to toggle reaction:', error);
    return NextResponse.json({ error: 'Failed to toggle reaction' }, { status: 500 });
  }
}
