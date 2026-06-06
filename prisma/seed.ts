/**
 * Database seed script.
 * 
 * Run with: npx tsx --env-file=.env prisma/seed.ts
 * 
 * This script is intentionally empty.
 * Content is created via the Admin Dashboard.
 * The database starts clean — no dummy data.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Database is clean. Use the Admin Dashboard to add content.');
  
  const novelCount = await prisma.novel.count();
  const userCount = await prisma.user.count();
  
  console.log(`  Novels: ${novelCount}`);
  console.log(`  Users: ${userCount}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); });
