/**
 * Secure HTTP-Only Cookie Session Manager (Neon PostgreSQL Backed)
 * Uses HMAC-SHA256 signed tokens for session integrity.
 */

import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'malaz_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds
const SECRET = process.env.SESSION_SECRET || 'malaz-secure-session-fallback-secret-key-32-chars';

export interface SessionPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  avatar?: string;
  exp: number;
}

/**
 * Sign payload to create a secure session token: `base64(payload).signature`
 */
export function signSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const fullPayload: SessionPayload = { ...payload, exp };
  const encoded = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

/**
 * Verify and decode session token. Returns payload if valid and not expired.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [encoded, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url');

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Get current logged in user from session cookie (Server context).
 */
export async function getSessionUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    return verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Set the HTTP-Only session cookie in the response.
 */
export async function setSessionCookie(payload: Omit<SessionPayload, 'exp'>): Promise<void> {
  const token = signSessionToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Clear the session cookie on logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
