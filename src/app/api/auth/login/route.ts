/**
 * API Route: POST /api/auth/login
 * Authenticates user via Supabase Auth.
 */

import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/client';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    const user = data.user;
    const role = user?.user_metadata?.role || 'reader';

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0],
        email: user.email,
        role,
        avatar: user.user_metadata?.avatar,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
