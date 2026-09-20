/**
 * Native OAuth 2.0 Engine for Google and GitHub
 * Directly connects to Google/GitHub APIs and saves users into Neon PostgreSQL.
 * No Supabase needed!
 */

import crypto from 'crypto';

export type OAuthProvider = 'google' | 'github';

export interface OAuthUserProfile {
  providerId: string;
  provider: OAuthProvider;
  email: string;
  username: string;
  avatar?: string;
}

/**
 * Resolves the application origin safely across Localhost, Proxies, and Vercel/Production.
 * Strips trailing slashes to prevent malformed redirect URIs.
 */
export function getAppOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const forwardedProto = request.headers.get('x-forwarded-proto');

  // 1. If running locally (localhost or 127.0.0.1)
  if (forwardedHost && (forwardedHost.includes('localhost') || forwardedHost.includes('127.0.0.1'))) {
    return `http://${forwardedHost}`.replace(/\/+$/, '');
  }

  // 2. If NEXT_PUBLIC_APP_URL is explicitly set and we're not on localhost
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/+$/, '');
  if (appUrl && (!forwardedHost || (!forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')))) {
    return appUrl;
  }

  // 3. Reverse proxy / Vercel host & proto headers
  if (forwardedHost) {
    const protocol = forwardedProto || 'https';
    return `${protocol}://${forwardedHost}`.replace(/\/+$/, '');
  }

  // 4. Fallback to request.url
  const url = new URL(request.url);
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  return `${isLocal ? 'http' : 'https'}://${url.host}`.replace(/\/+$/, '');
}

/**
 * Generate a random cryptographic state token to prevent CSRF attacks in OAuth.
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get OAuth authorization URL for Google or GitHub.
 */
export function getOAuthAuthorizationUrl(
  provider: OAuthProvider,
  state: string,
  origin: string
): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const redirectUri = `${cleanOrigin}/api/auth/callback/${provider}`;

  if (provider === 'google') {
    const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  if (provider === 'github') {
    const clientId = (process.env.GITHUB_CLIENT_ID || '').trim();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  throw new Error(`Unsupported OAuth provider: ${provider}`);
}

/**
 * Exchange authorization code for user profile from Google.
 */
export async function exchangeGoogleCode(
  code: string,
  origin: string
): Promise<OAuthUserProfile> {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const cleanOrigin = origin.replace(/\/+$/, '');
  const redirectUri = `${cleanOrigin}/api/auth/callback/google`;

  // 1. Exchange code for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${errText}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // 2. Fetch user profile
  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userRes.ok) {
    throw new Error('Failed to fetch Google user profile.');
  }

  const userData = await userRes.json();

  return {
    providerId: userData.sub,
    provider: 'google',
    email: userData.email,
    username: userData.name || userData.email.split('@')[0],
    avatar: userData.picture,
  };
}

/**
 * Exchange authorization code for user profile from GitHub.
 */
export async function exchangeGitHubCode(
  code: string,
  origin: string
): Promise<OAuthUserProfile> {
  const clientId = (process.env.GITHUB_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GITHUB_CLIENT_SECRET || '').trim();
  const cleanOrigin = origin.replace(/\/+$/, '');
  const redirectUri = `${cleanOrigin}/api/auth/callback/github`;

  // 1. Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error('GitHub token exchange failed.');
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    throw new Error(`GitHub token missing: ${tokenData.error_description || 'Unknown error'}`);
  }

  // 2. Fetch user profile
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'MalazScans-OAuth',
    },
  });

  if (!userRes.ok) {
    throw new Error('Failed to fetch GitHub user profile.');
  }

  const userData = await userRes.json();

  // 3. If email is private on GitHub, fetch user emails list
  let userEmail = userData.email;
  if (!userEmail) {
    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'MalazScans-OAuth',
      },
    });

    if (emailRes.ok) {
      const emails: Array<{ email: string; primary: boolean; verified: boolean }> = await emailRes.json();
      const primary = emails.find((e) => e.primary && e.verified) || emails[0];
      if (primary) userEmail = primary.email;
    }
  }

  if (!userEmail) {
    userEmail = `${userData.login}@users.noreply.github.com`;
  }

  return {
    providerId: String(userData.id),
    provider: 'github',
    email: userEmail,
    username: userData.name || userData.login,
    avatar: userData.avatar_url,
  };
}
