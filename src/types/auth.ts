/**
 * Role-based authentication types.
 * Designed for Supabase Auth migration (RLS-compatible).
 */

export type UserRole = 'admin' | 'reader' | 'guest';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken?: string;
  expiresAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Permission definitions for role-based access control.
 * Maps to Supabase RLS policies once migrated.
 */
export const PERMISSIONS = {
  admin: [
    'manage:novels',
    'manage:chapters',
    'manage:users',
    'manage:comments',
    'manage:announcements',
    'manage:recommendations',
    'view:analytics',
    'view:admin',
  ],
  reader: [
    'read:novels',
    'read:chapters',
    'manage:own-comments',
    'manage:own-bookmarks',
    'manage:own-settings',
  ],
  guest: [
    'read:novels',
    'read:chapters',
  ],
} as const;

export type Permission = typeof PERMISSIONS[UserRole][number];

export function hasPermission(role: UserRole, permission: string): boolean {
  return (PERMISSIONS[role] as readonly string[]).includes(permission);
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin';
}
