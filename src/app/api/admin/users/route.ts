/**
 * API Route: GET /api/admin/users
 * Admin-only: List users with search, filter, pagination.
 * 
 * Query params:
 *   page (default 1)
 *   limit (default 20)
 *   search (username or email)
 *   role (user|moderator|editor|translator|admin)
 *   status (active|suspended|banned)
 *   sort (createdAt|username|email|role|status)
 *   order (asc|desc)
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.role === 'admin';
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'createdAt';
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

  try {
    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          avatar: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              comments: true,
              bookmarks: true,
              readingHistory: true,
            },
          },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Summary stats
    const [totalUsers, activeUsers, suspendedUsers, bannedUsers, roleCounts] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { status: 'suspended' } }),
      prisma.user.count({ where: { status: 'banned' } }),
      prisma.user.groupBy({ by: ['role'], _count: true }),
    ]);

    const roleStats: Record<string, number> = {};
    roleCounts.forEach((r) => { roleStats[r.role] = r._count; });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status,
        avatar: u.avatar,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt?.toISOString() || null,
        commentsCount: u._count.comments,
        bookmarksCount: u._count.bookmarks,
        readingHistoryCount: u._count.readingHistory,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        bannedUsers,
        roleStats,
      },
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
