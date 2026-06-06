/**
 * Database seed script — imports the existing hardcoded novel data
 * from src/data/novels.ts into the Supabase Postgres database.
 * 
 * Run with: npx tsx prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Import the hardcoded data directly (relative path from prisma/)
async function main() {
  // Dynamic import to handle the TypeScript module
  const { INITIAL_NOVELS_DATA } = await import('../src/data/novels');

  console.log(`Seeding ${INITIAL_NOVELS_DATA.length} novels...`);

  for (const novel of INITIAL_NOVELS_DATA) {
    // Check if novel already exists
    const existing = await prisma.novel.findUnique({ where: { id: novel.id } });
    if (existing) {
      console.log(`  Skipping "${novel.title}" (already exists)`);
      continue;
    }

    await prisma.novel.create({
      data: {
        id: novel.id,
        title: novel.title,
        alternativeTitle: novel.alternativeTitle || '',
        originalTitle: novel.originalTitle || '',
        japaneseTitle: novel.japaneseTitle || '',
        romajiTitle: novel.romajiTitle || '',
        author: novel.author,
        illustrator: novel.illustrator || '',
        translator: novel.translator || '',
        publisher: novel.publisher || '',
        synopsis: novel.synopsis || '',
        status: novel.status,
        releaseSchedule: novel.releaseSchedule || '',
        addedDate: new Date(novel.addedDate),
        rating: parseFloat(novel.rating) || 0,
        views: parseInt(novel.views.replace(/,/g, '')) || 0,
        genres: novel.genres,
        tags: novel.tags,
        coverImage: novel.coverImage || null,
        isRecommended: novel.isRecommended,
        volumes: {
          create: novel.volumes.map((vol) => ({
            volumeNumber: vol.volumeNumber,
            title: vol.title,
            chapters: {
              create: vol.chapters.map((ch) => ({
                id: ch.id,
                title: ch.title,
                publishDate: new Date(ch.publishDate),
                content: ch.content,
              })),
            },
          })),
        },
      },
    });

    console.log(`  ✓ Seeded "${novel.title}"`);
  }

  // Seed default recommendations
  const recCount = await prisma.recommendation.count();
  if (recCount === 0) {
    await prisma.recommendation.createMany({
      data: [
        {
          novelId: "red-sunset",
          order: 1,
          isPinned: true,
          isFeatured: true,
        },
        {
          novelId: "midnight-cafe",
          order: 2,
          isPinned: false,
          isFeatured: false,
        },
      ],
    });
    console.log(`  ✓ Seeded recommendations`);
  }

  console.log('Done!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
