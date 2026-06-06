/**
 * API Route: GET /api/recommendations
 * Returns all recommendations with their novel data from Supabase Postgres.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  try {
    const recommendations = await prisma.recommendation.findMany({
      orderBy: { order: 'asc' },
    });

    const mapped = recommendations.map((rec) => ({
      id: rec.id,
      novelId: rec.novelId,
      order: rec.order,
      isPinned: rec.isPinned,
      isFeatured: rec.isFeatured,
      addedDate: rec.addedDate.toISOString().split('T')[0],
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
