/**
 * API Route: DELETE /api/admin/volumes/:id
 * Admin-only: Delete a volume (and all its chapters).
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { createServerSupabaseClient } from '../../../../../lib/supabase/server';

async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.role === 'admin';
  } catch {
    return false;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.volume.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete volume:', error);
    return NextResponse.json({ error: 'Failed to delete volume' }, { status: 500 });
  }
}
