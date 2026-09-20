/**
 * API Route: PUT /api/admin/recommendations
 * Admin-only: Replace all recommendations with new ordering.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAdminSession } from '../../../../lib/auth/admin';



export async function PUT(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const recommendations: Array<{
      novelId: string;
      order: number;
      isPinned: boolean;
      isFeatured: boolean;
    }> = body;

    // Replace all recommendations
    await prisma.recommendation.deleteMany({});
    await prisma.recommendation.createMany({
      data: recommendations.map((rec) => ({
        novelId: rec.novelId,
        order: rec.order,
        isPinned: rec.isPinned,
        isFeatured: rec.isFeatured,
      })),
    });

    return NextResponse.json({ success: true, count: recommendations.length });
  } catch (error) {
    console.error('Failed to update recommendations:', error);
    return NextResponse.json({ error: 'Failed to update recommendations' }, { status: 500 });
  }
}
