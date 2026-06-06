"use client";

import React, { useState, useEffect } from 'react';
import { ExternalLink, Globe } from 'lucide-react';

export interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  siteName: string | null;
}

interface LinkPreviewCardProps {
  url: string;
  size?: 'badge' | 'medium' | 'large';
}

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ url, size = 'medium' }) => {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchPreview = async () => {
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPreview();
    return () => { cancelled = true; };
  }, [url]);

  const domain = (() => {
    try { return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', ''); } catch { return url; }
  })();

  // Badge mode — minimal inline display
  if (size === 'badge') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#151515] border border-[#262626] hover:border-[#FF3D00] text-[10px] font-mono text-[#A3A3A3] hover:text-white transition-colors no-underline rounded-none"
        aria-label={`Link to ${domain}`}
      >
        {data?.favicon ? (
          <img src={data.favicon} alt="" className="w-3 h-3 object-contain" loading="lazy" />
        ) : (
          <Globe className="w-3 h-3 text-[#737373]" />
        )}
        <span className="truncate max-w-[180px]">{data?.siteName || domain}</span>
        {data?.title && <span className="text-[#737373] truncate max-w-[120px]">· {data.title}</span>}
        <ExternalLink className="w-2.5 h-2.5 text-[#555] flex-shrink-0" />
      </a>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="border border-[#262626] bg-[#0F0F0F] p-3 animate-pulse my-2" role="status" aria-label="Loading link preview">
        <div className="flex gap-3">
          <div className="w-4 h-4 bg-[#262626] rounded-sm flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[#262626] w-2/3" />
            <div className="h-2 bg-[#1a1a1a] w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error or no data — render simple link
  if (error || !data) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[#FF3D00] hover:text-white text-xs font-mono underline underline-offset-2 transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        {domain}
      </a>
    );
  }

  // Large mode
  if (size === 'large' && data.image) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block border border-[#262626] bg-[#0F0F0F] hover:border-[#FF3D00]/50 transition-colors my-3 no-underline group overflow-hidden"
        aria-label={data.title || domain}
      >
        {data.image && (
          <div className="w-full h-40 overflow-hidden bg-[#0A0A0A]">
            <img
              src={data.image}
              alt=""
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            {data.favicon && <img src={data.favicon} alt="" className="w-4 h-4 object-contain flex-shrink-0" loading="lazy" />}
            <span className="text-[10px] text-[#737373] font-mono uppercase font-bold">{data.siteName || domain}</span>
          </div>
          {data.title && <p className="text-sm font-bold text-white group-hover:text-[#FF3D00] transition-colors line-clamp-2">{data.title}</p>}
          {data.description && <p className="text-[11px] text-[#737373] line-clamp-2 leading-relaxed">{data.description}</p>}
        </div>
      </a>
    );
  }

  // Medium mode (default)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex border border-[#262626] bg-[#0F0F0F] hover:border-[#FF3D00]/50 transition-colors my-2 no-underline group overflow-hidden"
      aria-label={data.title || domain}
    >
      <div className="flex-1 p-3 space-y-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {data.favicon ? (
            <img src={data.favicon} alt="" className="w-3.5 h-3.5 object-contain flex-shrink-0" loading="lazy" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-[#737373] flex-shrink-0" />
          )}
          <span className="text-[9px] text-[#737373] font-mono uppercase font-bold truncate">{data.siteName || domain}</span>
        </div>
        {data.title && (
          <p className="text-xs font-bold text-white group-hover:text-[#FF3D00] transition-colors truncate">{data.title}</p>
        )}
        {data.description && (
          <p className="text-[10px] text-[#737373] line-clamp-2 leading-relaxed">{data.description}</p>
        )}
      </div>
      {data.image && (
        <div className="w-24 h-auto flex-shrink-0 overflow-hidden bg-[#0A0A0A] hidden sm:block">
          <img src={data.image} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
    </a>
  );
};

export default LinkPreviewCard;
