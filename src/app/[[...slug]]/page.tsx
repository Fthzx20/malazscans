import React from 'react';
import type { Metadata } from 'next';
import MainAppLayout from '../../components/layout/MainAppLayout';
import prisma from '../../lib/prisma';
import { getTursoNovelById, isTursoConfigured } from '../../lib/db';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return {
      title: "Malaz Scans — Light Novel Translation",
      description: "Curated light novel translation platform featuring a dark brutalist aesthetic, personal bookshelf, real-time reading history, and distraction-free zen reader.",
    };
  }

  const [section, novelId, chapterId] = slug;

  if (section === 'browse') {
    return {
      title: "Complete Directory & Catalog",
      description: "Explore the complete directory of light novels and web novels actively released on Malaz Scans.",
      openGraph: {
        title: "Complete Directory & Catalog — Malaz Scans",
        description: "Explore the complete directory of light novels and web novels actively released on Malaz Scans.",
      },
    };
  }

  if (section === 'library') {
    return {
      title: "Bookshelf & Reading History",
      description: "Access your saved favorite light novels on your bookshelf and resume reading from where you left off.",
    };
  }

  if (section === 'settings') {
    return {
      title: "Settings & Profile",
      description: "Customize your reading canvas and manage your Malaz Scans account preferences.",
    };
  }

  if (section === 'dmca') {
    return {
      title: "DMCA Notice & Copyright Policy",
      description: "Copyright information and DMCA claim submission procedures for Malaz Scans.",
    };
  }

  if (section === 'contact') {
    return {
      title: "Contact & Support",
      description: "Contact the Malaz Scans translation team for questions, feedback, or inquiries.",
    };
  }

  if (section === 'novel' || section === 'novels') {
    if (!novelId) return {};

    try {
      let novel: any = null;
      if (isTursoConfigured) {
        novel = await getTursoNovelById(novelId);
      }

      if (!novel) {
        novel = await prisma.novel.findUnique({
          where: { id: novelId },
          include: {
            volumes: {
              include: { chapters: true },
            },
          },
        });
      }

      if (!novel) {
        return {
          title: "Novel Not Found",
        };
      }

      // If viewing a specific chapter
      if (chapterId) {
        const flatChapters = (novel.volumes || []).flatMap((v: any) => v.chapters || []);
        const chapter = flatChapters.find((c: any) => c.id === chapterId);

        const chapterTitle = chapter?.title || chapterId;
        const pageTitle = `${chapterTitle} — ${novel.title}`;
        const pageDesc = `Read chapter ${chapterTitle} of ${novel.title} by ${novel.author}. Translated by ${novel.translator}.`;

        return {
          title: pageTitle,
          description: pageDesc,
          openGraph: {
            title: pageTitle,
            description: pageDesc,
            type: 'article',
            images: novel.coverImage ? [{ url: novel.coverImage, alt: novel.title }] : [],
          },
          twitter: {
            card: 'summary_large_image',
            title: pageTitle,
            description: pageDesc,
            images: novel.coverImage ? [novel.coverImage] : [],
          },
        };
      }

      // Viewing novel detail
      const pageTitle = `${novel.title}`;
      const pageDesc = novel.synopsis ? novel.synopsis.slice(0, 160) : `Read ${novel.title} by ${novel.author} on Malaz Scans.`;

      return {
        title: pageTitle,
        description: pageDesc,
        openGraph: {
          title: `${novel.title} — Malaz Scans`,
          description: pageDesc,
          type: 'book',
          images: novel.coverImage ? [{ url: novel.coverImage, alt: novel.title }] : [],
        },
        twitter: {
          card: 'summary_large_image',
          title: `${novel.title} — Malaz Scans`,
          description: pageDesc,
          images: novel.coverImage ? [novel.coverImage] : [],
        },
      };
    } catch {
      return {
        title: "Malaz Scans",
      };
    }
  }

  return {};
}

export default function Page() {
  return <MainAppLayout />;
}
