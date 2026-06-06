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
    const user = await prisma.user.findUnique({
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
      // User exists in Supabase Auth but not in DB — create profile
      const newUser = await prisma.user.create({
        data: {
          id: authUser.id,
          username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'User',
          email: authUser.email!,
          password: '', // Auth handled by Supabase
          avatar: authUser.user_metadata?.avatar || null,
          role: authUser.user_metadata?.role || 'user',
        },
      });
      return NextResponse.json(newUser);
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
    const data: any = {};

    if (body.username !== undefined) data.username = body.username;
    if (body.avatar !== undefined) data.avatar = body.avatar;

    // Upsert: create if not exists
    const user = await prisma.user.upsert({
      where: { id: authUser.id },
      update: data,
      create: {
        id: authUser.id,
        username: body.username || authUser.user_metadata?.username || 'User',
        email: authUser.email!,
        password: '',
        avatar: body.avatar || null,
        role: authUser.user_metadata?.role || 'user',
      },
    });

    // Also sync avatar to Supabase Auth metadata
    if (body.avatar !== undefined) {
      try {
        const supabase = await createServerSupabaseClient();
        await supabase.auth.updateUser({
          data: { avatar: body.avatar, username: body.username || user.username },
        });
      } catch {
        // Non-fatal
      }
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    });
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
