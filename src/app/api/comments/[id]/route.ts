/**
 * API Route: PATCH/DELETE /api/comments/:id
 * PATCH: Edit a comment
 * DELETE: Delete a comment
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getSessionUser } from '../../../../lib/auth/session';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  const { id } = await params;
  const commentId = parseInt(id);

  if (isNaN(commentId)) {
    return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
  }

  try {
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, username: true, isUserRegistered: true },
    });

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const isAdmin =
      session.role === 'admin' ||
      (Boolean(process.env.ADMIN_EMAIL) && session.email === process.env.ADMIN_EMAIL) ||
      (Boolean(process.env.NEXT_PUBLIC_ADMIN_EMAIL) && session.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);

    const isOwner =
      (existingComment.userId && existingComment.userId === session.userId) ||
      (existingComment.isUserRegistered && existingComment.username === session.username);

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to edit this comment.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { text } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    // 1. Detect [[Novel Name]] in text
    const mentionRegex = /\[\[(.+?)\]\]/g;
    const matches = Array.from(text.matchAll(mentionRegex));
    const uniqueTitles = Array.from(new Set(matches.map((m) => (m as RegExpExecArray)[1].trim())));

    const titleToNovel: Record<string, { id: string; title: string }> = {};

    if (uniqueTitles.length > 0) {
      const novels = await prisma.novel.findMany({
        where: {
          OR: [
            { title: { in: uniqueTitles, mode: 'insensitive' } },
            { alternativeTitle: { in: uniqueTitles, mode: 'insensitive' } },
            { japaneseTitle: { in: uniqueTitles, mode: 'insensitive' } },
            { romajiTitle: { in: uniqueTitles, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          alternativeTitle: true,
          japaneseTitle: true,
          romajiTitle: true,
        },
      });

      for (const title of uniqueTitles) {
        const found = novels.find(
          (n) =>
            n.title.toLowerCase() === title.toLowerCase() ||
            n.alternativeTitle.toLowerCase() === title.toLowerCase() ||
            n.japaneseTitle.toLowerCase() === title.toLowerCase() ||
            n.romajiTitle.toLowerCase() === title.toLowerCase()
        );
        if (found) {
          titleToNovel[title] = { id: found.id, title: found.title };
        }
      }
    }

    interface CommentBlock {
      type: 'text' | 'novel';
      value?: string;
      novelId?: string;
      title?: string;
    }

    // 2. Parse text into segment blocks
    const blocks: CommentBlock[] = [];
    let lastIndex = 0;
    const blockRegex = /\[\[(.+?)\]\]/g;
    let match;

    while ((match = blockRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      const matchedText = match[0];
      const title = match[1].trim();

      if (matchIndex > lastIndex) {
        blocks.push({
          type: 'text',
          value: text.substring(lastIndex, matchIndex),
        });
      }

      const novel = titleToNovel[title];
      if (novel) {
        blocks.push({
          type: 'novel',
          novelId: novel.id,
          title: novel.title,
        });
      } else {
        blocks.push({
          type: 'text',
          value: matchedText,
        });
      }
      lastIndex = blockRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      blocks.push({
        type: 'text',
        value: text.substring(lastIndex),
      });
    }

    const textToStore = blocks.length > 0 ? JSON.stringify(blocks) : JSON.stringify([{ type: 'text', value: text }]);

    // 3. Update comment and update CommentMention records inside transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Clear old mentions
      await tx.commentMention.deleteMany({
        where: { commentId },
      });

      // Add new mentions
      const mentionsToCreate = Object.values(titleToNovel).map((n) => ({
        commentId,
        novelId: n.id,
      }));

      if (mentionsToCreate.length > 0) {
        await tx.commentMention.createMany({
          data: mentionsToCreate,
        });
      }

      return await tx.comment.update({
        where: { id: commentId },
        data: { text: textToStore },
      });
    });

    return NextResponse.json({ id: updated.id, text: updated.text });
  } catch (error) {
    console.error('Failed to update comment:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  const { id } = await params;
  const commentId = parseInt(id);

  if (isNaN(commentId)) {
    return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
  }

  try {
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, username: true, isUserRegistered: true },
    });

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const isAdmin =
      session.role === 'admin' ||
      (Boolean(process.env.ADMIN_EMAIL) && session.email === process.env.ADMIN_EMAIL) ||
      (Boolean(process.env.NEXT_PUBLIC_ADMIN_EMAIL) && session.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);

    const isOwner =
      (existingComment.userId && existingComment.userId === session.userId) ||
      (existingComment.isUserRegistered && existingComment.username === session.username);

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to delete this comment.' },
        { status: 403 }
      );
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
