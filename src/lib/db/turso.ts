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

    if (novels.length === 0) {
      try {
        const prismaModule = await import('../prisma');
        const prisma = prismaModule.default;
        const prismaNovels = await prisma.novel.findMany({
          include: {
            volumes: {
              include: {
                chapters: { orderBy: { publishDate: 'asc' } },
              },
              orderBy: { volumeNumber: 'asc' },
            },
          },
          orderBy: { addedDate: 'desc' },
        });

        if (prismaNovels && prismaNovels.length > 0) {
          for (const pn of prismaNovels) {
            await syncNovelToTurso(pn);
          }
          return prismaNovels.map((pn) => ({
            id: pn.id,
            title: pn.title,
            alternativeTitle: pn.alternativeTitle,
            originalTitle: pn.originalTitle,
            japaneseTitle: pn.japaneseTitle,
            romajiTitle: pn.romajiTitle,
            author: pn.author,
            illustrator: pn.illustrator,
            translator: pn.translator,
            publisher: pn.publisher,
            synopsis: pn.synopsis,
            status: pn.status,
            releaseSchedule: pn.releaseSchedule,
            addedDate: pn.addedDate.toISOString(),
            rating: String(pn.rating),
            ratingCount: pn.ratingCount || 0,
            views: String(pn.views),
            genres: pn.genres,
            tags: pn.tags,
            coverImage: pn.coverImage || undefined,
            isRecommended: pn.isRecommended,
            volumes: pn.volumes.map((v) => ({
              volumeNumber: v.volumeNumber,
              title: v.title,
              chapters: v.chapters.map((c) => ({
                id: c.id,
                title: c.title,
                publishDate: c.publishDate.toISOString(),
                content: c.content,
                isLocked: c.isLocked,
                coinPrice: c.coinPrice,
              })),
            })),
          }));
        }
      } catch (syncErr) {
        console.warn('Auto-sync from Prisma to Turso skipped:', syncErr);
      }
    }

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
 * Upsert volume into Turso.
 */
export async function upsertTursoVolume(
  vol: { id?: string; volumeNumber: number; title: string },
  novelId: string
): Promise<string> {
  const client = getTursoClient();
  if (!client) return vol.id || `${novelId}-vol-${vol.volumeNumber}`;

  const volumeId = vol.id || `${novelId}-vol-${vol.volumeNumber}`;
  await client.execute({
    sql: `
      INSERT INTO volumes (id, volumeNumber, title, novelId)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        volumeNumber = excluded.volumeNumber,
        title = excluded.title
    `,
    args: [volumeId, vol.volumeNumber, vol.title, novelId],
  });

  return volumeId;
}

/**
 * Delete a volume from Turso.
 */
export async function deleteTursoVolume(volumeId: string): Promise<void> {
  const client = getTursoClient();
  if (!client) return;

  await client.execute({
    sql: 'DELETE FROM chapters WHERE volumeId = ?',
    args: [volumeId],
  });

  await client.execute({
    sql: 'DELETE FROM volumes WHERE id = ?',
    args: [volumeId],
  });
}

/**
 * Upsert chapter into Turso.
 */
export async function upsertTursoChapter(
  chapter: { id: string; title: string; publishDate?: string | Date; content?: string; isLocked?: boolean; coinPrice?: number },
  volumeId: string
): Promise<void> {
  const client = getTursoClient();
  if (!client) return;

  const pubDate = chapter.publishDate instanceof Date
    ? chapter.publishDate.toISOString()
    : chapter.publishDate || new Date().toISOString();

  await client.execute({
    sql: `
      INSERT INTO chapters (
        id, title, publishDate, content, isLocked, coinPrice, volumeId
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        publishDate = excluded.publishDate,
        content = excluded.content,
        isLocked = excluded.isLocked,
        coinPrice = excluded.coinPrice,
        volumeId = excluded.volumeId
    `,
    args: [
      chapter.id,
      chapter.title,
      pubDate,
      chapter.content || '',
      chapter.isLocked ? 1 : 0,
      chapter.coinPrice || 5,
      volumeId,
    ],
  });
}

/**
 * Delete chapter from Turso.
 */
export async function deleteTursoChapter(chapterId: string): Promise<void> {
  const client = getTursoClient();
  if (!client) return;

  await client.execute({
    sql: 'DELETE FROM chapters WHERE id = ?',
    args: [chapterId],
  });
}

/**
 * Delete novel and all its related volumes/chapters from Turso.
 */
export async function deleteTursoNovel(novelId: string): Promise<void> {
  const client = getTursoClient();
  if (!client) return;

  try {
    const volRows = await client.execute({
      sql: 'SELECT id FROM volumes WHERE novelId = ?',
      args: [novelId],
    });
    for (const v of volRows.rows) {
      await client.execute({
        sql: 'DELETE FROM chapters WHERE volumeId = ?',
        args: [String(v.id)],
      });
    }
    await client.execute({
      sql: 'DELETE FROM volumes WHERE novelId = ?',
      args: [novelId],
    });
    await client.execute({
      sql: 'DELETE FROM novels WHERE id = ?',
      args: [novelId],
    });
  } catch (err) {
    console.error(`Failed to delete novel ${novelId} from Turso:`, err);
  }
}

/**
 * Full Novel Synchronizer: Upserts a novel, its volumes, and its chapters into Turso.
 */
export async function syncNovelToTurso(novel: any): Promise<void> {
  const client = getTursoClient();
  if (!client) return;

  try {
    await upsertTursoNovel({
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
      status: novel.status || 'ONGOING',
      releaseSchedule: novel.releaseSchedule || '',
      addedDate: novel.addedDate ? new Date(novel.addedDate).toISOString() : new Date().toISOString(),
      rating: String(novel.rating || '0'),
      ratingCount: Number(novel.ratingCount || 0),
      views: String(novel.views || '0'),
      genres: novel.genres || [],
      tags: novel.tags || [],
      coverImage: novel.coverImage || undefined,
      isRecommended: Boolean(novel.isRecommended),
      volumes: [],
    });

    if (Array.isArray(novel.volumes)) {
      for (const vol of novel.volumes) {
        const volumeId = await upsertTursoVolume(vol, novel.id);
        if (Array.isArray(vol.chapters)) {
          for (const chap of vol.chapters) {
            await upsertTursoChapter(chap, volumeId);
          }
        }
      }
    }
  } catch (err) {
    console.error(`Failed to sync novel ${novel.id} to Turso:`, err);
  }
}
