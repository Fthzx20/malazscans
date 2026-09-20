/**
 * API Route: GET/POST /api/admin/announcements
 * Admin-only: List all or create an announcement.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAdminSession } from '../../../../lib/auth/admin';

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const mapped = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      status: a.status,
      priority: a.priority,
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

export async function POST(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    const announcement = await prisma.announcement.create({
      data: {
        title: body.title,
        content: body.content,
        priority: body.priority || 'normal',
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        autoDismissDuration: body.autoCloseSeconds || 10,
        status: body.status || 'draft',
        displayMode: body.autoClose ? 'modal' : 'banner',
      },
    });

    return NextResponse.json({ id: announcement.id, title: announcement.title }, { status: 201 });
  } catch (error) {
    console.error('Failed to create announcement:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}
