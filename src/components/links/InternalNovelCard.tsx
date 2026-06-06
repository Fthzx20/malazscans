"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, Star } from 'lucide-react';

interface NovelPreview {
  id: string;
  title: string;
  status: string;
  rating: string;
  coverImage?: string;
  genres: string[];
  volumes: { chapters: unknown[] }[];
}

interface InternalNovelCardProps {
  novelId: string;
}

/**
 * Renders a rich card for an internal novel reference.
 * Shows cover, title, status, rating, and chapter count.
 */
export const InternalNovelCard: React.FC<InternalNovelCardProps> = ({ novelId }) => {
  const [novel, setNovel] = useState<NovelPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/novels/${novelId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (!cancelled && data) setNovel(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [novelId]);

  if (loading) {
    return (
      <div className="border border-[#262626] bg-[#0F0F0F] p-3 animate-pulse my-2">
        <div className="flex gap-3">
          <div className="w-10 h-14 bg-[#262626] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[#262626] w-2/3" />
            <div className="h-2 bg-[#1a1a1a] w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!novel) return null;

  const totalChapters = novel.volumes.reduce((acc, v) => acc + (v.chapters?.length || 0), 0);

  return (
    <div className="border border-[#FF3D00]/20 bg-[#0F0F0F] hover:border-[#FF3D00]/50 transition-colors my-2 p-3 flex gap-3">
      <div className="w-10 h-14 bg-[#151515] border border-[#262626] overflow-hidden flex-shrink-0 flex items-center justify-center">
        {novel.coverImage ? (
          <img src={novel.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <BookOpen className="w-4 h-4 text-[#737373]" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-xs font-bold text-white truncate">{novel.title}</p>
        <div className="flex items-center gap-3 text-[9px] font-mono text-[#737373]">
          <span className={`uppercase font-bold ${novel.status === 'ONGOING' ? 'text-green-500' : 'text-[#FF3D00]'}`}>
            {novel.status}
          </span>
          <span className="flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 text-yellow-500" />
            {novel.rating}
          </span>
          <span>{totalChapters} chapters</span>
        </div>
        {novel.genres.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {novel.genres.slice(0, 3).map(g => (
              <span key={g} className="text-[8px] px-1.5 py-0.5 border border-[#262626] text-[#737373] uppercase font-bold">{g}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InternalNovelCard;
