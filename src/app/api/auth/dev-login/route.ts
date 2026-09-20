/**
 * API Route: POST /api/auth/dev-login
 * Development & testing shortcut when Google/GitHub credentials are not yet set.
 * Creates a valid session with 0 initial coins.
 */

import { NextResponse } from 'next/server';
import { setSessionCookie } from '../../../../lib/auth/session';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const role = body.role === 'admin' ? 'admin' : 'user';

    const testUser = {
      userId: role === 'admin' ? 'dev-admin-id' : 'dev-user-id',
      email: role === 'admin' ? 'admin@malazscans.dev' : 'reader@malazscans.dev',
      username: role === 'admin' ? 'Dev Admin' : 'Dev Reader',
      role,
      avatar: undefined,
    };

    await setSessionCookie(testUser);

    return NextResponse.json({
      success: true,
      user: {
        ...testUser,
        coins: 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed dev login' }, { status: 500 });
  }
}
