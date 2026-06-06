/**
 * localStorage implementation of IRecommendationRepository.
 * TRANSITIONAL — will be replaced by Supabase queries.
 */

import { IRecommendationRepository } from '../interfaces';
import { Recommendation } from '../../types';

const isClient = () => typeof window !== 'undefined';
const STORAGE_KEY = 'kult_recommendations';

const DEFAULT_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "rec-1",
    novelId: "red-sunset",
    order: 1,
    isPinned: true,
    isFeatured: true,
    addedDate: "2026-06-05"
  },
  {
    id: "rec-2",
    novelId: "midnight-cafe",
    order: 2,
    isPinned: false,
    isFeatured: false,
    addedDate: "2026-06-05"
  }
];

export class LocalStorageRecommendationRepository implements IRecommendationRepository {
  getAll(): Recommendation[] {
    if (!isClient()) return DEFAULT_RECOMMENDATIONS;
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RECOMMENDATIONS));
      return DEFAULT_RECOMMENDATIONS;
    }
    return JSON.parse(data);
  }

  save(recommendations: Recommendation[]): void {
    if (!isClient()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recommendations));
  }
}
