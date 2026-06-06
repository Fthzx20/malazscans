"use client";

import React, { useMemo } from 'react';
import { LinkPreviewCard } from './LinkPreviewCard';

// Regex to detect URLs in text content
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>)"'\]]+/gi;

interface LinkRendererProps {
  /** Raw text content that may contain URLs */
  text: string;
  /** How to display detected links */
  linkSize?: 'badge' | 'medium' | 'large';
  /** Whether to render previews (false = just hyperlink the URLs) */
  showPreviews?: boolean;
  /** Additional className for the wrapper */
  className?: string;
}

/**
 * LinkRenderer — detects URLs in raw text and renders them as rich preview cards.
 * 
 * Usage:
 *   <LinkRenderer text="Check this out: https://github.com/vercel/next.js" />
 * 
 * Works in: Comments, Replies, Translator Notes, Author Notes, Announcements, etc.
 */
export const LinkRenderer: React.FC<LinkRendererProps> = ({
  text,
  linkSize = 'medium',
  showPreviews = true,
  className = '',
}) => {
  const { segments, urls } = useMemo(() => {
    const detectedUrls: string[] = [];
    const parts: Array<{ type: 'text' | 'url'; value: string }> = [];

    let lastIndex = 0;
    const matches = [...text.matchAll(URL_REGEX)];

    for (const match of matches) {
      const url = match[0];
      const startIndex = match.index!;

      // Add text before this URL
      if (startIndex > lastIndex) {
        parts.push({ type: 'text', value: text.slice(lastIndex, startIndex) });
      }

      // Normalize URL
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      parts.push({ type: 'url', value: normalizedUrl });
      detectedUrls.push(normalizedUrl);

      lastIndex = startIndex + url.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', value: text.slice(lastIndex) });
    }

    return { segments: parts, urls: detectedUrls };
  }, [text]);

  // No URLs detected — render plain text
  if (urls.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Render text with inline hyperlinks */}
      <p className="whitespace-pre-wrap break-words">
        {segments.map((segment, idx) => {
          if (segment.type === 'text') {
            return <span key={idx}>{segment.value}</span>;
          }
          return (
            <a
              key={idx}
              href={segment.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF3D00] hover:text-white underline underline-offset-2 transition-colors break-all"
            >
              {segment.value}
            </a>
          );
        })}
      </p>

      {/* Render preview cards for detected URLs */}
      {showPreviews && urls.length > 0 && (
        <div className="space-y-2 mt-2">
          {urls.map((url, idx) => (
            <LinkPreviewCard key={`${url}-${idx}`} url={url} size={linkSize} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LinkRenderer;
