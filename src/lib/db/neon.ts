/**
 * Neon Database Client (PostgreSQL Serverless)
 * Dedicated for: Users, Coins, Orders, Transactions, UnlockedChapters, Bookmarks, ReadingHistory, Comments, Ratings.
 * 
 * Uses Prisma Client with @prisma/adapter-pg.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForNeon = globalThis as unknown as {
  neonPrisma: PrismaClient | undefined;
};

function createNeonClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@ep-pooler.neon.tech/neondb';
  
  try {
    const adapter = new PrismaPg({ connectionString, max: 10 });
    return new PrismaClient({ adapter });
  } catch {
    // Fallback standard client if adapter initialization is unavailable
    return new PrismaClient();
  }
}

export const neonPrisma = globalForNeon.neonPrisma ?? createNeonClient();

if (process.env.NODE_ENV !== 'production') {
  globalForNeon.neonPrisma = neonPrisma;
}

export default neonPrisma;
