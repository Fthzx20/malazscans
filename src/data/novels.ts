import { Novel } from '../types';

/**
 * Initial novels data — empty for production.
 * Novel content is managed via the Admin Dashboard and stored in Supabase.
 * This file exists only as a fallback for the localStorage cache layer.
 */
export const INITIAL_NOVELS_DATA: Novel[] = [];
