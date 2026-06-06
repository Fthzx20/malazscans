/**
 * API Route: GET /api/link-preview?url=xxx
 * Fetches OpenGraph/meta metadata for a URL and caches it.
 * Returns cached data if available and fresh (< 7 days).
 */

import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Security: blocked protocols and hosts
const BLOCKED_PATTERNS = [
  /^file:/i,
  /^ftp:/i,
  /^javascript:/i,
  /^data:/i,
  /localhost/i,
  /127\.0\.0\./,
  /10\.\d+\.\d+\.\d+/,
  /172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/,
  /192\.168\.\d+\.\d+/,
  /0\.0\.0\.0/,
  /\[::1\]/,
];

function isUrlSafe(url: string): boolean {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(url)) return false;
  }
  return /^https?:\/\//i.test(url);
}

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!url.match(/^https?:\/\//i)) {
    url = 'https://' + url;
  }
  return url;
}

async function extractMetadata(url: string): Promise<{
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  siteName: string | null;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MalazBot/1.0 (Link Preview)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });

    if (!res.ok) return { title: null, description: null, image: null, favicon: null, siteName: null };

    const html = await res.text();
    // Only parse first 50KB to prevent memory issues
    const head = html.substring(0, 50000);

    const getMetaContent = (property: string): string | null => {
      // Match property="..." or name="..."
      const regex = new RegExp(
        `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
        'i'
      );
      const match = head.match(regex);
      return match ? (match[1] || match[2] || null) : null;
    };

    const getTitle = (): string | null => {
      const titleMatch = head.match(/<title[^>]*>([^<]*)<\/title>/i);
      return titleMatch ? titleMatch[1].trim() : null;
    };

    const getFavicon = (): string | null => {
      const iconMatch = head.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']*)["']/i);
      if (iconMatch && iconMatch[1]) {
        const href = iconMatch[1];
        if (href.startsWith('http')) return href;
        if (href.startsWith('//')) return 'https:' + href;
        const urlObj = new URL(url);
        if (href.startsWith('/')) return urlObj.origin + href;
        return urlObj.origin + '/' + href;
      }
      // Fallback to /favicon.ico
      try {
        const urlObj = new URL(url);
        return urlObj.origin + '/favicon.ico';
      } catch {
        return null;
      }
    };

    // Resolve relative image URLs
    const resolveUrl = (src: string | null): string | null => {
      if (!src) return null;
      if (src.startsWith('http')) return src;
      if (src.startsWith('//')) return 'https:' + src;
      try {
        const urlObj = new URL(url);
        if (src.startsWith('/')) return urlObj.origin + src;
        return urlObj.origin + '/' + src;
      } catch {
        return src;
      }
    };

    const title = getMetaContent('og:title') || getMetaContent('twitter:title') || getTitle();
    const description = getMetaContent('og:description') || getMetaContent('twitter:description') || getMetaContent('description');
    const image = resolveUrl(getMetaContent('og:image') || getMetaContent('twitter:image'));
    const siteName = getMetaContent('og:site_name') || getMetaContent('application-name');
    const favicon = getFavicon();

    return { title, description, image, favicon, siteName };
  } catch {
    return { title: null, description: null, image: null, favicon: null, siteName: null };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'url parameter is required' }, { status: 400 });
  }

  const url = normalizeUrl(rawUrl);

  if (!isUrlSafe(url)) {
    return NextResponse.json({ error: 'URL is not allowed' }, { status: 400 });
  }

  try {
    // Check cache
    const cached = await prisma.linkPreviewCache.findUnique({ where: { url } });

    if (cached) {
      const age = Date.now() - cached.updatedAt.getTime();
      if (age < CACHE_TTL_MS) {
        return NextResponse.json({
          url,
          title: cached.title,
          description: cached.description,
          image: cached.image,
          favicon: cached.favicon,
          siteName: cached.siteName,
          cached: true,
        });
      }
    }

    // Fetch fresh metadata
    const metadata = await extractMetadata(url);

    // Upsert cache
    await prisma.linkPreviewCache.upsert({
      where: { url },
      update: {
        title: metadata.title,
        description: metadata.description,
        image: metadata.image,
        favicon: metadata.favicon,
        siteName: metadata.siteName,
      },
      create: {
        url,
        title: metadata.title,
        description: metadata.description,
        image: metadata.image,
        favicon: metadata.favicon,
        siteName: metadata.siteName,
      },
    });

    return NextResponse.json({
      url,
      ...metadata,
      cached: false,
    });
  } catch (error) {
    console.error('Link preview error:', error);
    return NextResponse.json({ error: 'Failed to fetch link preview' }, { status: 500 });
  }
}
