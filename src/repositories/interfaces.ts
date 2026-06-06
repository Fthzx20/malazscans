/**
 * Repository interfaces — abstract data access layer.
 * 
 * Current implementation: localStorage (see ./localStorage/)
 * Target implementation: Supabase (see ./supabase/ — to be created during migration)
 * 
 * All stores and hooks consume these interfaces, not the implementation directly.
 * Swapping localStorage → Supabase requires only changing the factory export.
 */

import { Novel, Chapter, Volume, Comment, ReadingHistory, ReaderSettings, Recommendation, Notification } from '../types';
import { AuthUser, AuthResult, LoginCredentials, RegisterCredentials } from '../types/auth';

// ============================================================
// AUTH REPOSITORY
// ============================================================
export interface IAuthRepository {
  login(credentials: LoginCredentials): AuthResult;
  register(credentials: RegisterCredentials): AuthResult;
  logout(): void;
  getSession(): AuthUser | null;
  saveSession(user: AuthUser | null): void;
}

// ============================================================
// NOVEL REPOSITORY
// ============================================================
export interface INovelRepository {
  getAll(): Novel[];
  getById(id: string): Novel | null;
  save(novels: Novel[]): void;
  create(novel: Novel): void;
  update(id: string, data: Partial<Novel>): void;
  delete(id: string): void;
}

// ============================================================
// CHAPTER REPOSITORY
// ============================================================
export interface IChapterRepository {
  getByNovelId(novelId: string): Chapter[];
  getById(chapterId: string): Chapter | null;
  create(novelId: string, volumeNumber: number, chapter: Chapter): boolean;
  update(chapterId: string, data: Partial<Chapter>): void;
  delete(chapterId: string): void;
}

// ============================================================
// COMMENT REPOSITORY
// ============================================================
export interface ICommentRepository {
  getByChapterId(chapterId: string): Comment[];
  getAll(): Record<string, Comment[]>;
  add(chapterId: string, comment: Comment): void;
  update(commentId: number, data: Partial<Comment>): void;
  delete(commentId: number, chapterId: string): void;
  saveAll(comments: Record<string, Comment[]>): void;
}

// ============================================================
// LIBRARY REPOSITORY (bookmarks, history, read chapters)
// ============================================================
export interface ILibraryRepository {
  getBookmarks(): string[];
  saveBookmarks(bookmarks: string[]): void;
  getHistory(): ReadingHistory[];
  saveHistory(history: ReadingHistory[]): void;
  getReadChapters(): string[];
  saveReadChapters(chapters: string[]): void;
}

// ============================================================
// SETTINGS REPOSITORY
// ============================================================
export interface ISettingsRepository {
  getReaderSettings(): ReaderSettings;
  saveReaderSettings(settings: ReaderSettings): void;
}

// ============================================================
// RECOMMENDATION REPOSITORY
// ============================================================
export interface IRecommendationRepository {
  getAll(): Recommendation[];
  save(recommendations: Recommendation[]): void;
}

// ============================================================
// NOTIFICATION REPOSITORY
// ============================================================
export interface INotificationRepository {
  getAll(): Notification[];
  save(notifications: Notification[]): void;
}
