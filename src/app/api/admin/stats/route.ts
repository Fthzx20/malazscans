/**
 * API Route: GET /api/admin/stats
 * Returns real-time statistics from Supabase Postgres.
 * Admin-only.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Content metrics
    const [
      totalNovels,
      totalVolumes,
      totalChapters,
      totalIllustrations,
      totalComments,
      totalReactions,
      totalBookmarks,
      totalReadingHistory,
      totalRecommendations,
      activeAnnouncements,
      totalUsers,
    ] = await Promise.all([
      prisma.novel.count(),
      prisma.volume.count(),
      prisma.chapter.count(),
      prisma.illustration.count(),
      prisma.comment.count(),
      prisma.reaction.count(),
      prisma.bookmark.count(),
      prisma.readingHistory.count(),
      prisma.recommendation.count(),
      prisma.announcement.count({ where: { status: 'published', startDate: { lte: now }, endDate: { gte: now } } }),
      prisma.user.count(),
    ]);

    // Activity metrics (time-based)
    const [
      commentsLast24h,
      commentsLast7d,
      commentsLast30d,
      bookmarksLast24h,
      bookmarksLast7d,
      bookmarksLast30d,
      readingLast24h,
      readingLast7d,
      readingLast30d,
    ] = await Promise.all([
      prisma.comment.count({ where: { date: { gte: oneDayAgo } } }),
      prisma.comment.count({ where: { date: { gte: sevenDaysAgo } } }),
      prisma.comment.count({ where: { date: { gte: thirtyDaysAgo } } }),
      prisma.bookmark.count({ where: { id: { not: undefined } } }), // bookmarks don't have timestamp yet
      prisma.bookmark.count(),
      prisma.bookmark.count(),
      prisma.readingHistory.count({ where: { timestamp: { gte: oneDayAgo } } }),
      prisma.readingHistory.count({ where: { timestamp: { gte: sevenDaysAgo } } }),
      prisma.readingHistory.count({ where: { timestamp: { gte: thirtyDaysAgo } } }),
    ]);

    // Novel performance — most viewed
    const topNovelByViews = await prisma.novel.findFirst({ orderBy: { views: 'desc' }, select: { id: true, title: true, views: true } });
    const topNovelByRating = await prisma.novel.findFirst({ orderBy: { rating: 'desc' }, select: { id: true, title: true, rating: true } });

    // Aggregated mentions count
    const topMentions = await prisma.commentMention.groupBy({
      by: ['novelId'],
      _count: {
        novelId: true
      },
      orderBy: {
        _count: {
          novelId: 'desc'
        }
      },
      take: 10
    });

    const topMentionedNovels = await Promise.all(
      topMentions.map(async (m) => {
        const novel = await prisma.novel.findUnique({
          where: { id: m.novelId },
          select: { title: true }
        });
        return {
          title: novel?.title || m.novelId,
          count: m._count.novelId
        };
      })
    );

    // Average rating
    const ratingAgg = await prisma.novel.aggregate({ _avg: { rating: true } });

    // Total word count (approximate from chapter content length)
    const chapters = await prisma.chapter.findMany({ select: { content: true } });
    let totalWords = 0;
    chapters.forEach((ch) => {
      const raw = ch.content.replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, '');
      totalWords += raw.trim().split(/\s+/).filter((w) => w.length > 0).length;
    });

    return NextResponse.json({
      content: {
        totalNovels,
        totalVolumes,
        totalChapters,
        totalIllustrations,
        totalWords,
        avgRating: ratingAgg._avg?.rating?.toFixed(2) || '0.00',
      },
      community: {
        totalUsers,
        totalComments,
        totalReactions,
        totalBookmarks,
        totalReadingHistory,
        totalRecommendations,
        activeAnnouncements,
      },
      activity: {
        last24h: { comments: commentsLast24h, bookmarks: bookmarksLast24h, readingSessions: readingLast24h },
        last7d: { comments: commentsLast7d, bookmarks: bookmarksLast7d, readingSessions: readingLast7d },
        last30d: { comments: commentsLast30d, bookmarks: bookmarksLast30d, readingSessions: readingLast30d },
      },
      topPerformers: {
        mostViewed: topNovelByViews ? { title: topNovelByViews.title, views: topNovelByViews.views } : null,
        highestRated: topNovelByRating ? { title: topNovelByRating.title, rating: topNovelByRating.rating } : null,
        mostMentioned: topMentionedNovels,
      },
    });
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
