/**
 * API Route: GET /api/auth/callback/:provider
 * Handles OAuth 2.0 callback from Google or GitHub.
 * Validates CSRF state, fetches user profile, upserts user in Neon, and sets session cookie.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../../lib/prisma';
import { exchangeGoogleCode, exchangeGitHubCode, OAuthProvider } from '../../../../../lib/auth/oauth';
import { setSessionCookie } from '../../../../../lib/auth/session';
import { checkRateLimit, getClientIp } from '../../../../../lib/security/rateLimit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`oauth_callback:${ip}`, 20, 60000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const cookieStore = await cookies();
  const savedState = cookieStore.get('malaz_oauth_state')?.value;
  const returnToRaw = cookieStore.get('malaz_oauth_return_to')?.value || '/';

  // Clean up temporary cookies
  cookieStore.delete('malaz_oauth_state');
  cookieStore.delete('malaz_oauth_return_to');

  // Prevent Open-Redirect: Only allow relative internal paths
  const returnTo = returnToRaw.startsWith('/') && !returnToRaw.startsWith('//') ? returnToRaw : '/';

  if (error || !code) {
    console.error(`OAuth error from ${provider}:`, error);
    return NextResponse.redirect(`${origin}?auth_error=cancelled`);
  }

  // CSRF State validation
  if (!state || !savedState || state !== savedState) {
    console.error('OAuth CSRF state mismatch.');
    return NextResponse.redirect(`${origin}?auth_error=csrf_detected`);
  }

  try {
    let profile;
    if (provider === 'google') {
      profile = await exchangeGoogleCode(code, origin);
    } else if (provider === 'github') {
      profile = await exchangeGitHubCode(code, origin);
    } else {
      return NextResponse.redirect(`${origin}?auth_error=unsupported_provider`);
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const isUserAdmin = adminEmail && profile.email.toLowerCase() === adminEmail.toLowerCase();
    const assignedRole = isUserAdmin ? 'admin' : 'user';

    // Upsert user into Neon PostgreSQL
    // Notice: New users start with 0 coins!
    let dbUser;
    try {
      dbUser = await prisma.user.upsert({
        where: { email: profile.email },
        update: {
          username: profile.username,
          avatar: profile.avatar || undefined,
          provider,
          role: isUserAdmin ? 'admin' : undefined,
          lastLoginAt: new Date(),
        },
        create: {
          email: profile.email,
          username: profile.username,
          avatar: profile.avatar,
          provider,
          role: assignedRole,
          coins: 0, // 0 coins on registration (anti-exploitation)
          password: '',
        },
      });
    } catch (dbErr) {
      console.warn('Neon database user upsert skipped/failed (offline/fallback mode):', dbErr);
      // Fallback virtual user for development
      dbUser = {
        id: `usr_${Date.now()}`,
        email: profile.email,
        username: profile.username,
        role: assignedRole,
        avatar: profile.avatar,
        coins: 0,
      };
    }

    // Set HTTP-Only Session Cookie
    await setSessionCookie({
      userId: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      role: dbUser.role || 'user',
      avatar: dbUser.avatar || undefined,
    });

    return NextResponse.redirect(`${origin}${returnTo}`);
  } catch (err) {
    console.error('Failed to complete OAuth login:', err);
    return NextResponse.redirect(`${origin}?auth_error=oauth_failed`);
  }
}
