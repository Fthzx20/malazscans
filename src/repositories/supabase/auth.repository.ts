/**
 * Supabase implementation of IAuthRepository.
 * Uses Supabase Auth for authentication with role stored in user metadata.
 * 
 * NOTE: This is a CLIENT-SIDE implementation.
 * Server-side auth validation should use the server client.
 */

import { IAuthRepository } from '../interfaces';
import { AuthUser, AuthResult, LoginCredentials, RegisterCredentials, UserRole } from '../../types/auth';
import { createClient } from '../../lib/supabase/client';

function mapSupabaseUser(supabaseUser: any): AuthUser {
  const role: UserRole = supabaseUser.user_metadata?.role || 'reader';
  return {
    id: supabaseUser.id,
    username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'User',
    email: supabaseUser.email || '',
    role,
    avatar: supabaseUser.user_metadata?.avatar,
    createdAt: supabaseUser.created_at,
  };
}

export class SupabaseAuthRepository implements IAuthRepository {
  private supabase = createClient();

  async loginAsync(credentials: LoginCredentials): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Login failed.' };
    }

    return { success: true, user: mapSupabaseUser(data.user) };
  }

  async registerAsync(credentials: RegisterCredentials): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          username: credentials.username,
          role: 'reader',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      return { success: true, user: mapSupabaseUser(data.user) };
    }

    return { success: true }; // email confirmation pending
  }

  async logoutAsync(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  async getSessionAsync(): Promise<AuthUser | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;
    return mapSupabaseUser(user);
  }

  // ============================================================
  // SYNC INTERFACE IMPLEMENTATIONS (IAuthRepository contract)
  // These wrap async calls for backward compatibility with the
  // synchronous store pattern. Use the async variants in new code.
  // ============================================================

  login(credentials: LoginCredentials): AuthResult {
    // Synchronous fallback — triggers async login, returns optimistic result.
    // The store should migrate to async patterns.
    this.loginAsync(credentials);
    return { success: true };
  }

  register(credentials: RegisterCredentials): AuthResult {
    this.registerAsync(credentials);
    return { success: true };
  }

  logout(): void {
    this.logoutAsync();
  }

  getSession(): AuthUser | null {
    // Cannot resolve async in sync context — return null.
    // Store initialization should use getSessionAsync().
    return null;
  }

  saveSession(_user: AuthUser | null): void {
    // Supabase manages sessions via cookies/localStorage internally.
    // No manual save needed.
  }
}
