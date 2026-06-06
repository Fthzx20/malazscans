import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: novelId } = await params;
  try {
    const body = await request.json();
    const { rating, userId, username } = body;

    if (rating === undefined || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Check if novel exists
    const novel = await prisma.novel.findUnique({ where: { id: novelId } });
    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 });
    }

    // Save rating
    if (userId) {
      // Upsert if registered user
      await prisma.novelRating.upsert({
        where: {
          novelId_userId: {
            novelId,
            userId,
          },
        },
        update: {
          rating: Number(rating),
          username: username || 'User',
        },
        create: {
          novelId,
          userId,
          rating: Number(rating),
          username: username || 'User',
        },
      });
    } else {
      // Just create for guests
      await prisma.novelRating.create({
        data: {
          novelId,
          rating: Number(rating),
          username: username || 'Guest',
        },
      });
    }

    // Calculate new average
    const aggregate = await prisma.novelRating.aggregate({
      where: { novelId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = aggregate._avg.rating || 0;
    const ratingCount = aggregate._count.rating || 0;

    // Update novel rating in db
    const updatedNovel = await prisma.novel.update({
      where: { id: novelId },
      data: { 
        rating: parseFloat(averageRating.toFixed(1)),
        ratingCount,
      },
    });

    return NextResponse.json({
      success: true,
      rating: String(updatedNovel.rating),
      ratingCount: updatedNovel.ratingCount,
    });
  } catch (error) {
    console.error('Failed to rate novel:', error);
    return NextResponse.json({ error: 'Failed to rate novel' }, { status: 500 });
  }
}
