/**
 * API Route: GET/PATCH /api/account/profile
 * Authenticated user: Read or update their own profile.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

async function getAuthUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      // User exists in Supabase Auth but not in DB — create profile row
      user = await prisma.user.create({
        data: {
          id: authUser.id,
          username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'User',
          email: authUser.email!,
          password: '',
          avatar: authUser.user_metadata?.avatar || null,
          role: authUser.user_metadata?.role || 'user',
        },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    // Validate username if provided
    if (body.username !== undefined) {
      const trimmed = body.username.trim();
      if (!trimmed || trimmed.length < 2) {
        return NextResponse.json({ error: 'Username must be at least 2 characters.' }, { status: 400 });
      }
      if (trimmed.length > 30) {
        return NextResponse.json({ error: 'Username must be 30 characters or less.' }, { status: 400 });
      }

      // Check uniqueness (skip if same user)
      const existing = await prisma.user.findUnique({ where: { username: trimmed } });
      if (existing && existing.id !== authUser.id) {
        return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 });
      }

      updateData.username = trimmed;
    }

    if (body.avatar !== undefined) {
      updateData.avatar = body.avatar || null;
    }

    // Upsert: if user row doesn't exist yet, create it
    const user = await prisma.user.upsert({
      where: { id: authUser.id },
      update: updateData,
      create: {
        id: authUser.id,
        username: (updateData.username as string) || authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'User',
        email: authUser.email!,
        password: '',
        avatar: (updateData.avatar as string) || null,
        role: authUser.user_metadata?.role || 'user',
      },
    });

    // Sync username and avatar to Supabase Auth metadata
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.updateUser({
        data: {
          username: user.username,
          avatar: user.avatar,
        },
      });
    } catch {
      // Non-fatal — DB is the source of truth
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    });
  } catch (error: any) {
    // Handle Prisma unique constraint violation
    if (error?.code === 'P2002' && error?.meta?.target?.includes('username')) {
      return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 });
    }
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
