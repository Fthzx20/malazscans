/**
 * Turso Database Setup & Seeding Script
 * 
 * Usage:
 *   npx tsx scripts/setup-turso.ts
 * 
 * What it does:
 * 1. Connects to your Turso database.
 * 2. Creates all tables and indexes defined in prisma/schema.turso.sql.
 * 3. Seeds the initial novels, volumes, and chapters from src/data/novels.ts.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@libsql/client';
import { INITIAL_NOVELS_DATA } from '../src/data/novels';

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('❌ Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in your .env or .env.local file.');
    process.exit(1);
  }

  console.log('⚡ Connecting to Turso database at:', url);
  const client = createClient({ url, authToken });

  // 1. Read and execute DDL
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.turso.sql');
  const ddl = fs.readFileSync(schemaPath, 'utf8');

  // Split DDL statements by semicolon
  const statements = ddl
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`📋 Executing ${statements.length} schema statements...`);
  for (const statement of statements) {
    await client.execute(statement);
  }
  console.log('✅ Turso schema tables and indexes created successfully.');

  // 2. Seed initial novels data
  console.log(`🌱 Seeding ${INITIAL_NOVELS_DATA.length} initial novels into Turso...`);

  for (const novel of INITIAL_NOVELS_DATA) {
    console.log(`  -> Seeding novel: "${novel.title}" (${novel.id})`);

    await client.execute({
      sql: `
        INSERT INTO novels (
          id, title, alternativeTitle, originalTitle, japaneseTitle, romajiTitle,
          author, illustrator, translator, publisher, synopsis, status,
          releaseSchedule, addedDate, rating, ratingCount, views, genres, tags,
          coverImage, isRecommended
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          synopsis = excluded.synopsis
      `,
      args: [
        novel.id,
        novel.title,
        novel.alternativeTitle || '',
        novel.originalTitle || '',
        novel.japaneseTitle || '',
        novel.romajiTitle || '',
        novel.author,
        novel.illustrator || '',
        novel.translator || '',
        novel.publisher || '',
        novel.synopsis || '',
        novel.status || 'ONGOING',
        novel.releaseSchedule || '',
        novel.addedDate || new Date().toISOString(),
        Number(novel.rating || 0),
        novel.ratingCount || 0,
        Number(novel.views || 0),
        JSON.stringify(novel.genres || []),
        JSON.stringify(novel.tags || []),
        novel.coverImage || null,
        novel.isRecommended ? 1 : 0,
      ],
    });

    // Seed volumes and chapters
    for (const vol of novel.volumes || []) {
      const volId = `${novel.id}-vol-${vol.volumeNumber}`;
      await client.execute({
        sql: `
          INSERT INTO volumes (id, volumeNumber, title, novelId)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET title = excluded.title
        `,
        args: [volId, vol.volumeNumber, vol.title, novel.id],
      });

      for (const chap of vol.chapters || []) {
        await client.execute({
          sql: `
            INSERT INTO chapters (id, title, publishDate, content, isLocked, coinPrice, volumeId)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              title = excluded.title,
              content = excluded.content
          `,
          args: [
            chap.id,
            chap.title,
            chap.publishDate || new Date().toISOString(),
            chap.content || '',
            chap.isLocked ? 1 : 0,
            chap.coinPrice || 5,
            volId,
          ],
        });
      }
    }
  }

  console.log('🎉 Turso setup and seeding completed successfully!');
}

main().catch((err) => {
  console.error('❌ Failed to setup Turso:', err);
  process.exit(1);
});
