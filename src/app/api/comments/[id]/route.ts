/**
 * API Route: PATCH/DELETE /api/comments/:id
 * PATCH: Edit a comment
 * DELETE: Delete a comment
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function PATCH(
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
    const { text } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    // 1. Detect [[Novel Name]] in text
    const mentionRegex = /\[\[(.+?)\]\]/g;
    const matches = Array.from(text.matchAll(mentionRegex));
    const uniqueTitles = Array.from(new Set(matches.map((m: any) => m[1].trim())));

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

    // 2. Parse text into segment blocks
    const blocks: any[] = [];
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
  const { id } = await params;
  const commentId = parseInt(id);

  if (isNaN(commentId)) {
    return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
  }

  try {
    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
