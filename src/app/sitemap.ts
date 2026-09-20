import { MetadataRoute } from 'next';
import prisma from '../lib/prisma';
import { getTursoNovels, isTursoConfigured } from '../lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://malazscans.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/library`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/dmca`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  try {
    let novelList: Array<{
      id: string;
      addedDate: string | Date;
      volumes: Array<{
        chapters: Array<{ id: string; publishDate: string | Date }>;
      }>;
    }> = [];

    if (isTursoConfigured) {
      const tursoNovels = await getTursoNovels();
      novelList = tursoNovels.map((n) => ({
        id: n.id,
        addedDate: n.addedDate,
        volumes: n.volumes.map((v) => ({
          chapters: v.chapters.map((c) => ({
            id: c.id,
            publishDate: c.publishDate,
          })),
        })),
      }));
    } else {
      const prismaNovels = await prisma.novel.findMany({
        include: {
          volumes: {
            include: {
              chapters: {
                select: { id: true, publishDate: true },
              },
            },
          },
        },
      });
      novelList = prismaNovels;
    }

    const novelRoutes: MetadataRoute.Sitemap = novelList.map((novel) => ({
      url: `${baseUrl}/novel/${novel.id}`,
      lastModified: new Date(novel.addedDate),
      changeFrequency: 'daily',
      priority: 0.9,
    }));

    const chapterRoutes: MetadataRoute.Sitemap = novelList.flatMap((novel) =>
      novel.volumes.flatMap((volume) =>
        volume.chapters.map((chapter) => ({
          url: `${baseUrl}/novel/${novel.id}/${chapter.id}`,
          lastModified: new Date(chapter.publishDate),
          changeFrequency: 'weekly',
          priority: 0.7,
        }))
      )
    );

    return [...staticRoutes, ...novelRoutes, ...chapterRoutes];
  } catch {
    return staticRoutes;
  }
}
