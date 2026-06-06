/**
 * Repository Factory — the SINGLE point to swap implementations.
 * 
 * CURRENT: localStorage (client-side persistence)
 * TARGET:  Supabase (server-side, RLS-protected)
 * 
 * To migrate, create src/repositories/supabase/ implementations
 * and change the exports below to instantiate those instead.
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
} from './localStorage';

import { SupabaseAuthRepository } from './supabase';

// ============================================================
// SINGLETON INSTANCES
// Change these instantiations to swap to Supabase.
// ============================================================

export const authRepository: IAuthRepository = new SupabaseAuthRepository();
export const novelRepository: INovelRepository = new LocalStorageNovelRepository();
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
