/**
 * API Route: PATCH /api/admin/users/:id/role
 * Admin-only: Change a user's role.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { createServerSupabaseClient } from '../../../../../../lib/supabase/server';

const VALID_ROLES = ['user', 'moderator', 'editor', 'translator', 'admin'];

async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.role === 'admin';
  } catch {
    return false;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
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

    // Also update Supabase Auth user_metadata to keep in sync
    try {
      const { createAdminClient } = await import('../../../../../../lib/supabase/admin');
      const adminSupabase = createAdminClient();
      await adminSupabase.auth.admin.updateUserById(id, {
        user_metadata: { role },
      });
    } catch {
      // Non-fatal: Supabase Auth user may not exist for this DB user
    }

    return NextResponse.json({ id: updated.id, role: updated.role });
  } catch (error) {
    console.error('Failed to update role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
