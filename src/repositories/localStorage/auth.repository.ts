/**
 * localStorage implementation of IAuthRepository.
 * TRANSITIONAL — will be replaced by Supabase Auth.
 */

import { IAuthRepository } from '../interfaces';
import { AuthUser, AuthResult, LoginCredentials, RegisterCredentials, UserRole } from '../../types/auth';
import { User } from '../../types';

const isClient = () => typeof window !== 'undefined';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';

function resolveRole(email: string): UserRole {
  if (email === ADMIN_EMAIL) return 'admin';
  return 'reader';
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.email, // email as pseudo-ID until Supabase provides UUID
    username: user.username,
    email: user.email,
    role: resolveRole(user.email),
    avatar: user.avatar,
  };
}

export class LocalStorageAuthRepository implements IAuthRepository {
  private readonly ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || '';

  login(credentials: LoginCredentials): AuthResult {
    // Admin login (transitional — will be replaced by Supabase Auth)
    if (credentials.email === ADMIN_EMAIL && credentials.password === this.ADMIN_PASSWORD) {
      const user: AuthUser = {
        id: 'admin',
        username: 'Admin Kult',
        email: ADMIN_EMAIL,
        role: 'admin',
      };
      this.saveSession(user);
      return { success: true, user };
    }

    // Regular user login
    const users = this.getRegisteredUsers();
    const found = users.find((u) => u.email === credentials.email && u.password === credentials.password);

    if (found) {
      const authUser = toAuthUser(found);
      this.saveSession(authUser);
      return { success: true, user: authUser };
    }

    return { success: false, error: 'Invalid credentials.' };
  }

  register(credentials: RegisterCredentials): AuthResult {
    const users = this.getRegisteredUsers();

    if (users.find((u) => u.email === credentials.email)) {
      return { success: false, error: 'This email is already registered.' };
    }

    const newUser: User = {
      username: credentials.username,
      email: credentials.email,
      password: credentials.password,
    };
    users.push(newUser);
    this.saveRegisteredUsers(users);

    return { success: true };
  }

  logout(): void {
    this.saveSession(null);
  }

  getSession(): AuthUser | null {
    if (!isClient()) return null;
    const data = localStorage.getItem('kult_active_user');
    if (!data) return null;
    try {
      const parsed = JSON.parse(data);
      return toAuthUser(parsed);
    } catch {
      return null;
    }
  }

  saveSession(user: AuthUser | null): void {
    if (!isClient()) return;
    if (user) {
      localStorage.setItem('kult_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('kult_active_user');
    }
  }

  // Internal helpers (not part of interface — localStorage-specific)
  private getRegisteredUsers(): User[] {
    if (!isClient()) return [];
    const data = localStorage.getItem('kult_registered_users');
    return data ? JSON.parse(data) : [];
  }

  private saveRegisteredUsers(users: User[]): void {
    if (!isClient()) return;
    localStorage.setItem('kult_registered_users', JSON.stringify(users));
  }
}
