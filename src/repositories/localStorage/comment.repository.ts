/**
 * localStorage implementation of ICommentRepository.
 * TRANSITIONAL — will be replaced by Supabase queries.
 */

import { ICommentRepository } from '../interfaces';
import { Comment } from '../../types';

const isClient = () => typeof window !== 'undefined';
const STORAGE_KEY = 'kult_comments_prod';

function sanitizeComment(c: unknown): Comment {
  const obj = c && typeof c === 'object' ? (c as Record<string, unknown>) : {};
  const reactions = obj.reactions && typeof obj.reactions === 'object' ? (obj.reactions as Record<string, unknown>) : {};
  return {
    id: typeof obj.id === 'number' ? obj.id : 0,
    parentId: typeof obj.parentId === 'number' ? obj.parentId : undefined,
    chapterId: typeof obj.chapterId === 'string' ? obj.chapterId : '',
    user: typeof obj.user === 'string' ? obj.user : 'Anonymous',
    text: typeof obj.text === 'string' ? obj.text : '',
    date: typeof obj.date === 'string' ? obj.date : '',
    isUserRegistered: !!obj.isUserRegistered,
    reactions: {
      likes: Array.isArray(reactions.likes) ? (reactions.likes as string[]) : [],
      hearts: Array.isArray(reactions.hearts) ? (reactions.hearts as string[]) : []
    },
    replies: Array.isArray(obj.replies) ? obj.replies.map(sanitizeComment) : []
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
