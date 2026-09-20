/**
 * API Route: PATCH /api/admin/users/:id/status
 * Admin-only: Change a user's status (active/suspended/banned).
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { requireAdminSession } from '../../../../../../lib/auth/admin';

const VALID_STATUSES = ['active', 'suspended', 'banned'];



export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (error) {
    console.error('Failed to update status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
