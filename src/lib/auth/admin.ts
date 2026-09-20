/**
 * Admin Authorization Helper (Neon Session)
 */

import { getSessionUser, SessionPayload } from './session';

export async function requireAdminSession(): Promise<SessionPayload | null> {
  const session = await getSessionUser();
  if (!session) return null;

  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdminUser =
    session.role === 'admin' ||
    (Boolean(adminEmail) && session.email.toLowerCase() === (adminEmail ?? '').toLowerCase());

  if (!isAdminUser) return null;

  return session;
}
