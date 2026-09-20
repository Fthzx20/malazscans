/**
 * API Route: GET /api/auth/:provider
 * Initiates OAuth 2.0 flow for Google or GitHub with CSRF state token.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOAuthAuthorizationUrl, generateOAuthState, OAuthProvider, getAppOrigin } from '../../../../lib/auth/oauth';
import { checkRateLimit, getClientIp } from '../../../../lib/security/rateLimit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`auth_init:${ip}`, 15, 60000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    );
  }

  const { provider } = await params;
  if (provider !== 'google' && provider !== 'github') {
    return NextResponse.json({ error: 'Invalid auth provider' }, { status: 400 });
  }

  // Check if provider credentials are set
  const isConfigured = provider === 'google'
    ? Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    : Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

  const { searchParams } = new URL(request.url);
  const origin = getAppOrigin(request);
  const returnTo = searchParams.get('returnTo') || '/';

  if (!isConfigured) {
    // Return friendly error if not configured yet
    return NextResponse.redirect(
      `${origin}?auth_error=provider_not_configured&provider=${provider}`
    );
  }

  const state = generateOAuthState();
  const authUrl = getOAuthAuthorizationUrl(provider as OAuthProvider, state, origin);

  // Store state and returnTo in secure temporary cookies (10 minutes)
  const cookieStore = await cookies();
  cookieStore.set('malaz_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  cookieStore.set('malaz_oauth_return_to', returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return NextResponse.redirect(authUrl);
}
