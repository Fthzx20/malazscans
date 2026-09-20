/**
 * Turso Database Client (libSQL / SQLite Edge Database)
 * Dedicated for Content: Novels, Volumes, Chapters, Illustrations, Announcements.
 * 
 * Includes graceful fallback: if TURSO_DATABASE_URL is not configured,
 * it returns fallback mock/catalog data so the app continues running without errors.
 */

import { createClient, Client } from '@libsql/client';
import { Novel, Chapter, Volume } from '@/types';
import { INITIAL_NOVELS_DATA } from '@/data/novels';

let tursoClientInstance: Client | null = null;

export function getTursoClient(): Client | null {
  if (tursoClientInstance) return tursoClientInstance;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || (!url.startsWith('libsql://') && !url.startsWith('https://') && !url.startsWith('http://'))) {
    return null;
  }

  try {
    tursoClientInstance = createClient({ url, authToken });
    return tursoClientInstance;
  } catch (err) {
    console.warn('Failed to initialize Turso client, falling back to local mode:', err);
    return null;
  }
}

/**
 * Fetch all novels with their volumes and chapters from Turso.
 */
export async function getTursoNovels(): Promise<Novel[]> {
  const client = getTursoClient();
  if (!client) {
    return INITIAL_NOVELS_DATA;
  }

  try {
    const novelRows = await client.execute('SELECT * FROM novels ORDER BY addedDate DESC');
    const volumeRows = await client.execute('SELECT * FROM volumes ORDER BY volumeNumber ASC');
    const chapterRows = await client.execute('SELECT * FROM chapters ORDER BY publishDate ASC');

    const novels: Novel[] = novelRows.rows.map((row: any) => {
      const novelId = String(row.id);

      const novelVolumes: Volume[] = volumeRows.rows
        .filter((v: any) => String(v.novelId) === novelId)
        .map((v: any) => {
          const volId = String(v.id);
          const volChapters: Chapter[] = chapterRows.rows
            .filter((c: any) => String(c.volumeId) === volId)
            .map((c: any) => ({
              id: String(c.id),
              title: String(c.title),
              publishDate: String(c.publishDate),
              content: String(c.content || ''),
              volumeTitle: String(v.title),
              isLocked: Boolean(c.isLocked),
              coinPrice: Number(c.coinPrice || 5),
            }));

          return {
            volumeNumber: Number(v.volumeNumber),
            title: String(v.title),
            chapters: volChapters,
          };
        });

      return {
        id: novelId,
        title: String(row.title),
        alternativeTitle: String(row.alternativeTitle || ''),
        originalTitle: String(row.originalTitle || ''),
        japaneseTitle: String(row.japaneseTitle || ''),
        romajiTitle: String(row.romajiTitle || ''),
        author: String(row.author),
        illustrator: String(row.illustrator || ''),
        translator: String(row.translator || ''),
        publisher: String(row.publisher || ''),
        synopsis: String(row.synopsis || ''),
        status: String(row.status || 'ONGOING'),
        releaseSchedule: String(row.releaseSchedule || ''),
        addedDate: String(row.addedDate || new Date().toISOString()),
        rating: String(row.rating || '0'),
        ratingCount: Number(row.ratingCount || 0),
        views: String(row.views || '0'),
        genres: typeof row.genres === 'string' ? JSON.parse(row.genres) : [],
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : [],
        coverImage: row.coverImage ? String(row.coverImage) : undefined,
        isRecommended: Boolean(row.isRecommended),
        volumes: novelVolumes,
      };
    });

    return novels.length > 0 ? novels : INITIAL_NOVELS_DATA;
  } catch (error) {
    console.error('Error fetching novels from Turso, using fallback:', error);
    return INITIAL_NOVELS_DATA;
  }
}

/**
 * Fetch a single novel by ID from Turso.
 */
export async function getTursoNovelById(id: string): Promise<Novel | null> {
  const client = getTursoClient();
  if (!client) {
    return INITIAL_NOVELS_DATA.find((n) => n.id === id) || null;
  }

  try {
    const novelRes = await client.execute({
      sql: 'SELECT * FROM novels WHERE id = ? LIMIT 1',
      args: [id],
    });

    if (novelRes.rows.length === 0) return null;
    const row = novelRes.rows[0];

    const volumeRows = await client.execute({
      sql: 'SELECT * FROM volumes WHERE novelId = ? ORDER BY volumeNumber ASC',
      args: [id],
    });

    const volumes: Volume[] = [];
    for (const v of volumeRows.rows) {
      const volId = String(v.id);
      const chapterRows = await client.execute({
        sql: 'SELECT * FROM chapters WHERE volumeId = ? ORDER BY publishDate ASC',
        args: [volId],
      });

      volumes.push({
        volumeNumber: Number(v.volumeNumber),
        title: String(v.title),
        chapters: chapterRows.rows.map((c: any) => ({
          id: String(c.id),
          title: String(c.title),
          publishDate: String(c.publishDate),
          content: String(c.content || ''),
          volumeTitle: String(v.title),
          isLocked: Boolean(c.isLocked),
          coinPrice: Number(c.coinPrice || 5),
        })),
      });
    }

    return {
      id: String(row.id),
      title: String(row.title),
      alternativeTitle: String(row.alternativeTitle || ''),
      originalTitle: String(row.originalTitle || ''),
      japaneseTitle: String(row.japaneseTitle || ''),
      romajiTitle: String(row.romajiTitle || ''),
      author: String(row.author),
      illustrator: String(row.illustrator || ''),
      translator: String(row.translator || ''),
      publisher: String(row.publisher || ''),
      synopsis: String(row.synopsis || ''),
      status: String(row.status || 'ONGOING'),
      releaseSchedule: String(row.releaseSchedule || ''),
      addedDate: String(row.addedDate),
      rating: String(row.rating || '0'),
      ratingCount: Number(row.ratingCount || 0),
      views: String(row.views || '0'),
      genres: typeof row.genres === 'string' ? JSON.parse(row.genres) : [],
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : [],
      coverImage: row.coverImage ? String(row.coverImage) : undefined,
      isRecommended: Boolean(row.isRecommended),
      volumes,
    };
  } catch (error) {
    console.error(`Error fetching novel ${id} from Turso:`, error);
    return INITIAL_NOVELS_DATA.find((n) => n.id === id) || null;
  }
}

/**
 * Upsert novel into Turso.
 */
export async function upsertTursoNovel(novel: Novel): Promise<void> {
  const client = getTursoClient();
  if (!client) return;

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
        alternativeTitle = excluded.alternativeTitle,
        originalTitle = excluded.originalTitle,
        japaneseTitle = excluded.japaneseTitle,
        romajiTitle = excluded.romajiTitle,
        author = excluded.author,
        illustrator = excluded.illustrator,
        translator = excluded.translator,
        publisher = excluded.publisher,
        synopsis = excluded.synopsis,
        status = excluded.status,
        releaseSchedule = excluded.releaseSchedule,
        genres = excluded.genres,
        tags = excluded.tags,
        coverImage = excluded.coverImage,
        isRecommended = excluded.isRecommended
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
}

/**
 * Upsert chapter into Turso.
 */
export async function upsertTursoChapter(
  chapter: Chapter,
  volumeId: string
): Promise<void> {
  const client = getTursoClient();
  if (!client) return;

  await client.execute({
    sql: `
      INSERT INTO chapters (
        id, title, publishDate, content, isLocked, coinPrice, volumeId
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        isLocked = excluded.isLocked,
        coinPrice = excluded.coinPrice
    `,
    args: [
      chapter.id,
      chapter.title,
      chapter.publishDate || new Date().toISOString(),
      chapter.content || '',
      chapter.isLocked ? 1 : 0,
      chapter.coinPrice || 5,
      volumeId,
    ],
  });
}
