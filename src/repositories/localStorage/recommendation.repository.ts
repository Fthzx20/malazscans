/**
 * localStorage implementation of IRecommendationRepository.
 * TRANSITIONAL — acts as client-side cache only.
 */

import { IRecommendationRepository } from '../interfaces';
import { Recommendation } from '../../types';

const isClient = () => typeof window !== 'undefined';
const STORAGE_KEY = 'kult_recommendations';

export class LocalStorageRecommendationRepository implements IRecommendationRepository {
  getAll(): Recommendation[] {
    if (!isClient()) return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  save(recommendations: Recommendation[]): void {
    if (!isClient()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recommendations));
  }
}
