/**
 * API Route: PATCH/DELETE /api/admin/novels/:id
 * Admin-only: Update or delete a novel.
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
    const data: {
      title?: string;
      alternativeTitle?: string;
      originalTitle?: string;
      japaneseTitle?: string;
      romajiTitle?: string;
      author?: string;
      illustrator?: string;
      translator?: string;
      publisher?: string;
      synopsis?: string;
      status?: string;
      releaseSchedule?: string;
      rating?: number;
      coverImage?: string;
      isRecommended?: boolean;
      genres?: string[];
      tags?: string[];
    } = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.alternativeTitle !== undefined) data.alternativeTitle = body.alternativeTitle;
    if (body.originalTitle !== undefined) data.originalTitle = body.originalTitle;
    if (body.japaneseTitle !== undefined) data.japaneseTitle = body.japaneseTitle;
    if (body.romajiTitle !== undefined) data.romajiTitle = body.romajiTitle;
    if (body.author !== undefined) data.author = body.author;
    if (body.illustrator !== undefined) data.illustrator = body.illustrator;
    if (body.translator !== undefined) data.translator = body.translator;
    if (body.publisher !== undefined) data.publisher = body.publisher;
    if (body.synopsis !== undefined) data.synopsis = body.synopsis;
    if (body.status !== undefined) data.status = body.status;
    if (body.releaseSchedule !== undefined) data.releaseSchedule = body.releaseSchedule;
    if (body.rating !== undefined) data.rating = parseFloat(body.rating);
    if (body.coverImage !== undefined) data.coverImage = body.coverImage;
    if (body.isRecommended !== undefined) data.isRecommended = body.isRecommended;
    if (body.genres !== undefined) data.genres = body.genres;
    if (body.tags !== undefined) data.tags = body.tags;

    const updated = await prisma.novel.update({ where: { id }, data });
    return NextResponse.json({ id: updated.id, title: updated.title });
  } catch (error) {
    console.error('Failed to update novel:', error);
    return NextResponse.json({ error: 'Failed to update novel' }, { status: 500 });
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
    await prisma.novel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete novel:', error);
    return NextResponse.json({ error: 'Failed to delete novel' }, { status: 500 });
  }
}
