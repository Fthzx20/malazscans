/**
 * Unified Database Layer (Decoupled Dual-DB: Turso + Neon)
 * 
 * 1. contentDb -> Turso (libSQL / SQLite Edge Database)
 *    Stores: Novels, Volumes, Chapters, Illustrations, Announcements
 * 
 * 2. userDb -> Neon (PostgreSQL Serverless)
 *    Stores: Users, Coins, Orders, Transactions, UnlockedChapters, Bookmarks, Comments, Ratings
 */

export * from './turso';
export { default as userDb, neonPrisma } from './neon';

export const isTursoConfigured = Boolean(
  process.env.TURSO_DATABASE_URL &&
  process.env.TURSO_DATABASE_URL.length > 0 &&
  !process.env.TURSO_DATABASE_URL.includes('your-db-name')
);

export const isNeonConfigured = Boolean(
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL.length > 0 &&
  !process.env.DATABASE_URL.includes('placeholder') &&
  !process.env.DATABASE_URL.includes('your-database')
);
