/**
 * localStorage implementation of INotificationRepository.
 * TRANSITIONAL — NotificationModal now fetches from /api/announcements.
 * This is only kept as a fallback cache layer.
 */

import { INotificationRepository } from '../interfaces';
import { Notification } from '../../types';

const isClient = () => typeof window !== 'undefined';
const STORAGE_KEY = 'kult_notifications_prod';

export class LocalStorageNotificationRepository implements INotificationRepository {
  getAll(): Notification[] {
    if (!isClient()) return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  save(notifications: Notification[]): void {
    if (!isClient()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }
}
