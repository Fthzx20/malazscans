/**
 * localStorage implementation of INotificationRepository.
 * TRANSITIONAL — will be replaced by Supabase queries (Announcement table).
 */

import { INotificationRepository } from '../interfaces';
import { Notification } from '../../types';

const isClient = () => typeof window !== 'undefined';
const STORAGE_KEY = 'kult_notifications_prod';

export class LocalStorageNotificationRepository implements INotificationRepository {
  getAll(): Notification[] {
    if (!isClient()) return [];
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const defaultNotification: Notification = {
        id: 'init-notification',
        title: 'Welcome to NOVEL:KULT V3',
        content: 'We have updated our notification system and enhanced platform hydration stability for a smoother reading experience!',
        status: 'published',
        priority: 'high',
        autoClose: true,
        autoCloseSeconds: 10,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const initial = [defaultNotification];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  }

  save(notifications: Notification[]): void {
    if (!isClient()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }
}
