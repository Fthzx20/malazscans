/**
 * Repository Factory — the unified access layer.
 * Auto-fallbacks between cloud storage (Turso libSQL / Neon PostgreSQL) and localStorage.
 */

import {
  IAuthRepository,
  INovelRepository,
  ICommentRepository,
  ILibraryRepository,
  ISettingsRepository,
  IRecommendationRepository,
  INotificationRepository,
} from './interfaces';

import {
  LocalStorageNovelRepository,
  LocalStorageCommentRepository,
  LocalStorageLibraryRepository,
  LocalStorageSettingsRepository,
  LocalStorageRecommendationRepository,
  LocalStorageNotificationRepository,
  LocalStorageAuthRepository,
} from './localStorage';

import { TursoNovelRepository } from './turso/novel.repository';

// ============================================================
// SINGLETON INSTANCES
// Auto-fallbacks to localStorage if cloud DB env is not configured.
// ============================================================

const isTursoConfigured = Boolean(
  process.env.TURSO_DATABASE_URL &&
  process.env.TURSO_DATABASE_URL.length > 0 &&
  !process.env.TURSO_DATABASE_URL.includes('your-db-name')
);

export const authRepository: IAuthRepository = new LocalStorageAuthRepository();

export const novelRepository: INovelRepository = isTursoConfigured
  ? new TursoNovelRepository()
  : new LocalStorageNovelRepository();
export const commentRepository: ICommentRepository = new LocalStorageCommentRepository();
export const libraryRepository: ILibraryRepository = new LocalStorageLibraryRepository();
export const settingsRepository: ISettingsRepository = new LocalStorageSettingsRepository();
export const recommendationRepository: IRecommendationRepository = new LocalStorageRecommendationRepository();
export const notificationRepository: INotificationRepository = new LocalStorageNotificationRepository();

// Re-export interfaces for consumers
export type {
  IAuthRepository,
  INovelRepository,
  ICommentRepository,
  ILibraryRepository,
  ISettingsRepository,
  IRecommendationRepository,
  INotificationRepository,
} from './interfaces';
