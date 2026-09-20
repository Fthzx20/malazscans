/**
 * API Route: PATCH /api/admin/users/:id/role
 * Admin-only: Change a user's role.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { requireAdminSession } from '../../../../../../lib/auth/admin';

const VALID_ROLES = ['user', 'moderator', 'editor', 'translator', 'admin'];



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
    const { role } = body;

    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
    });

    return NextResponse.json({ id: updated.id, role: updated.role });
  } catch (error) {
    console.error('Failed to update role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
