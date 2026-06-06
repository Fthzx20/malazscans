/**
 * API Route: GET /api/announcements
 * Returns published announcements that are currently active.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  try {
    const now = new Date();

    const announcements = await prisma.announcement.findMany({
      where: {
        status: 'published',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      status: a.status as 'draft' | 'published',
      priority: a.priority as 'low' | 'medium' | 'high',
      autoClose: a.displayMode === 'modal',
      autoCloseSeconds: a.autoDismissDuration,
      startDate: a.startDate.toISOString().split('T')[0],
      endDate: a.endDate.toISOString().split('T')[0],
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}
