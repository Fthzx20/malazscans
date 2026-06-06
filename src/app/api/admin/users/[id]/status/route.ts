/**
 * API Route: PATCH /api/admin/users/:id/status
 * Admin-only: Change a user's status (active/suspended/banned).
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { createServerSupabaseClient } from '../../../../../../lib/supabase/server';

const VALID_STATUSES = ['active', 'suspended', 'banned'];

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

    // If banned/suspended, also ban in Supabase Auth
    try {
      const { createAdminClient } = await import('../../../../../../lib/supabase/admin');
      const adminSupabase = createAdminClient();
      if (status === 'banned') {
        await adminSupabase.auth.admin.updateUserById(id, { ban_duration: '876000h' }); // ~100 years
      } else if (status === 'active') {
        await adminSupabase.auth.admin.updateUserById(id, { ban_duration: 'none' });
      }
    } catch {
      // Non-fatal
    }

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (error) {
    console.error('Failed to update status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
