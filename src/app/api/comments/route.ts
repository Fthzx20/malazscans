/**
 * API Route: GET/POST /api/comments?chapterId=xxx
 * GET: Returns comments for a chapter
 * POST: Adds a new comment
 */

import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chapterId = searchParams.get('chapterId');

  if (!chapterId) {
    return NextResponse.json({ error: 'chapterId is required' }, { status: 400 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { chapterId, parentId: null },
      include: {
        reactions: true,
        mentions: true,
        replies: {
          include: {
            reactions: true,
            mentions: true,
            replies: {
              include: { reactions: true, mentions: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Map to frontend shape
    const mapped = comments.map(mapComment);
    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chapterId, username, text, isUserRegistered, parentId, userId } = body;

    if (!chapterId || !username || !text) {
      return NextResponse.json({ error: 'chapterId, username, and text are required' }, { status: 400 });
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

    // 3. Resolve userId by username lookup if registered and userId not provided
    let resolvedUserId = userId || null;
    if (!resolvedUserId && isUserRegistered) {
      const dbUser = await prisma.user.findFirst({
        where: { username },
        select: { id: true },
      });
      if (dbUser) {
        resolvedUserId = dbUser.id;
      }
    }

    // 4. Create comment in the database
    const comment = await prisma.comment.create({
      data: {
        chapterId,
        username,
        text: textToStore,
        isUserRegistered: isUserRegistered || false,
        parentId: parentId || null,
        userId: resolvedUserId,
      },
      include: { reactions: true, mentions: true, replies: true },
    });

    // 5. Create CommentMention entries for matched novels
    const mentionsToCreate = Object.values(titleToNovel).map((n) => ({
      commentId: comment.id,
      novelId: n.id,
    }));

    if (mentionsToCreate.length > 0) {
      await prisma.commentMention.createMany({
        data: mentionsToCreate,
      });
    }

    return NextResponse.json(mapComment(comment), { status: 201 });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

function mapComment(c: any): any {
  return {
    id: c.id,
    parentId: c.parentId,
    chapterId: c.chapterId,
    user: c.username,
    text: c.text,
    date: c.date?.toISOString?.() || new Date().toISOString(),
    isUserRegistered: c.isUserRegistered,
    reactions: {
      likes: (c.reactions || []).filter((r: any) => r.type === 'like').map((r: any) => r.username),
      hearts: (c.reactions || []).filter((r: any) => r.type === 'heart').map((r: any) => r.username),
    },
    replies: (c.replies || []).map(mapComment),
  };
}
