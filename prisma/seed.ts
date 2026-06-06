/**
 * Database seed script.
 * Run with: npx tsx --env-file=.env prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Use direct connection for scripts (not pooler)
const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString: url, max: 2 });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Database status:');
  const novelCount = await prisma.novel.count();
  const userCount = await prisma.user.count();
  console.log(`  Novels: ${novelCount}`);
  console.log(`  Users: ${userCount}`);
  console.log('\nUse the Admin Dashboard to add content.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); });
