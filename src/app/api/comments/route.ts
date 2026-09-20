/**
 * API Route: GET/POST /api/comments?chapterId=xxx
 * GET: Returns comments for a chapter
 * POST: Adds a new comment
 */

import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getSessionUser } from '../../../lib/auth/session';

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
        user: {
          select: { avatar: true, provider: true, role: true },
        },
        reactions: true,
        mentions: true,
        replies: {
          include: {
            user: {
              select: { avatar: true, provider: true, role: true },
            },
            reactions: true,
            mentions: true,
            replies: {
              include: {
                user: {
                  select: { avatar: true, provider: true, role: true },
                },
                reactions: true,
                mentions: true,
              },
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
    const { chapterId, username: rawUsername, text, parentId } = body;

    if (!chapterId || !rawUsername || !text) {
      return NextResponse.json({ error: 'chapterId, username, and text are required' }, { status: 400 });
    }

    // Authenticate commenter via Neon session
    const session = await getSessionUser();

    let resolvedUsername = String(rawUsername).trim();
    let resolvedUserId: string | null = null;
    let resolvedIsRegistered = false;

    if (session) {
      // Authenticated user: enforce server-verified identity
      resolvedUserId = session.userId;
      resolvedIsRegistered = true;
      resolvedUsername = session.username || resolvedUsername;
    } else {
      // Guest commenter: prevent impersonating existing registered user
      resolvedIsRegistered = false;
      resolvedUserId = null;
      const existingUser = await prisma.user.findFirst({
        where: { username: { equals: resolvedUsername, mode: 'insensitive' } },
        select: { id: true },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: 'This username is reserved by a registered user. Please log in or choose a different name.' },
          { status: 403 }
        );
      }
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

    // 3. Create comment in the database with verified identity
    const comment = await prisma.comment.create({
      data: {
        chapterId,
        username: resolvedUsername,
        text: textToStore,
        isUserRegistered: resolvedIsRegistered,
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

interface PrismaCommentReaction {
  type: string;
  username: string;
}

interface PrismaComment {
  id: number;
  parentId: number | null;
  chapterId: string;
  username: string;
  text: string;
  date: Date;
  isUserRegistered: boolean;
  user?: {
    avatar: string | null;
    provider: string | null;
    role: string | null;
  } | null;
  reactions?: PrismaCommentReaction[];
  replies?: PrismaComment[];
}

interface MappedComment {
  id: number;
  parentId: number | null;
  chapterId: string;
  user: string;
  userAvatar?: string | null;
  provider?: 'google' | 'github' | null;
  role?: string | null;
  text: string;
  date: string;
  isUserRegistered: boolean;
  reactions: {
    likes: string[];
    hearts: string[];
  };
  replies: MappedComment[];
}

function mapComment(c: PrismaComment): MappedComment {
  return {
    id: c.id,
    parentId: c.parentId,
    chapterId: c.chapterId,
    user: c.username,
    userAvatar: c.user?.avatar || null,
    provider: (c.user?.provider as 'google' | 'github' | null) || null,
    role: c.user?.role || null,
    text: c.text,
    date: c.date?.toISOString?.() || new Date().toISOString(),
    isUserRegistered: c.isUserRegistered,
    reactions: {
      likes: (c.reactions || []).filter((r) => r.type === 'like').map((r) => r.username),
      hearts: (c.reactions || []).filter((r) => r.type === 'heart').map((r) => r.username),
    },
    replies: (c.replies || []).map(mapComment),
  };
}
