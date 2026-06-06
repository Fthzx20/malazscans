/**
 * localStorage implementation of ICommentRepository.
 * TRANSITIONAL — will be replaced by Supabase queries.
 */

import { ICommentRepository } from '../interfaces';
import { Comment } from '../../types';

const isClient = () => typeof window !== 'undefined';
const STORAGE_KEY = 'kult_comments_prod';

function sanitizeComment(c: any): Comment {
  return {
    id: c.id,
    parentId: c.parentId,
    chapterId: c.chapterId || '',
    user: c.user || 'Anonymous',
    text: c.text || '',
    date: c.date || '',
    isUserRegistered: !!c.isUserRegistered,
    reactions: {
      likes: Array.isArray(c.reactions?.likes) ? c.reactions.likes : [],
      hearts: Array.isArray(c.reactions?.hearts) ? c.reactions.hearts : []
    },
    replies: Array.isArray(c.replies) ? c.replies.map(sanitizeComment) : []
  };
}

export class LocalStorageCommentRepository implements ICommentRepository {
  getAll(): Record<string, Comment[]> {
    if (!isClient()) return {};
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return {};
    try {
      const parsed = JSON.parse(data);
      const sanitized: Record<string, Comment[]> = {};
      Object.keys(parsed).forEach(chapterId => {
        if (Array.isArray(parsed[chapterId])) {
          sanitized[chapterId] = parsed[chapterId].map(sanitizeComment);
        } else {
          sanitized[chapterId] = [];
        }
      });
      return sanitized;
    } catch {
      return {};
    }
  }

  getByChapterId(chapterId: string): Comment[] {
    const all = this.getAll();
    return all[chapterId] || [];
  }

  add(chapterId: string, comment: Comment): void {
    const all = this.getAll();
    if (!all[chapterId]) all[chapterId] = [];
    all[chapterId].unshift(comment);
    this.saveAll(all);
  }

  update(commentId: number, data: Partial<Comment>): void {
    const all = this.getAll();
    for (const chapterId of Object.keys(all)) {
      const idx = all[chapterId].findIndex(c => c.id === commentId);
      if (idx !== -1) {
        all[chapterId][idx] = { ...all[chapterId][idx], ...data };
        this.saveAll(all);
        return;
      }
    }
  }

  delete(commentId: number, chapterId: string): void {
    const all = this.getAll();
    if (all[chapterId]) {
      all[chapterId] = all[chapterId].filter(c => c.id !== commentId);
      this.saveAll(all);
    }
  }

  saveAll(comments: Record<string, Comment[]>): void {
    if (!isClient()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  }
}
