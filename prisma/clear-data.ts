import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  console.log('Starting database clear...');

  // Delete all rows in child and related tables
  await prisma.commentMention.deleteMany({});
  await prisma.readingHistory.deleteMany({});
  await prisma.translatorNote.deleteMany({});
  await prisma.authorNote.deleteMany({});
  await prisma.recommendation.deleteMany({});
  await prisma.bookmark.deleteMany({});
  await prisma.novelRating.deleteMany({});
  
  // Comments will be deleted, which also deletes child reactions via cascade
  await prisma.comment.deleteMany({});
  
  // Finally, delete novels, which cascades to volumes, chapters, and illustrations
  const deletedNovels = await prisma.novel.deleteMany({});
  
  console.log(`Cleared database. Deleted ${deletedNovels.count} novels.`);
}

main()
  .catch((e) => {
    console.error('Error clearing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
