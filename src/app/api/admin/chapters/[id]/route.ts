/**
 * API Route: PATCH/DELETE /api/admin/chapters/:id
 * Admin-only: Update or delete a chapter.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { requireAdminSession } from '../../../../../lib/auth/admin';



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
    const data: {
      title?: string;
      content?: string;
      isLocked?: boolean;
      coinPrice?: number;
    } = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.content !== undefined) data.content = body.content;
    if (body.isLocked !== undefined) data.isLocked = Boolean(body.isLocked);
    if (body.coinPrice !== undefined) data.coinPrice = Number(body.coinPrice);

    const updated = await prisma.chapter.update({ where: { id }, data });
    return NextResponse.json({ 
      id: updated.id, 
      title: updated.title,
      isLocked: updated.isLocked,
      coinPrice: updated.coinPrice,
    });
  } catch (error) {
    console.error('Failed to update chapter:', error);
    return NextResponse.json({ error: 'Failed to update chapter' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.chapter.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete chapter:', error);
    return NextResponse.json({ error: 'Failed to delete chapter' }, { status: 500 });
  }
}
