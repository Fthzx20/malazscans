import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useNovelStore } from '../store/novelStore';
import { NovelMentionPreviewCard } from './NovelMentionPreviewCard';
import { MobileNovelMentionSheet } from './MobileNovelMentionSheet';

interface NovelMentionRendererProps {
  novelId: string;
  title: string;
}

export const NovelMentionRenderer: React.FC<NovelMentionRendererProps> = ({
  novelId,
  title,
}) => {
  const novels = useNovelStore((state) => state.novels);
  const setSelectedNovel = useNovelStore((state) => state.setSelectedNovel);
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);

  const [hovered, setHovered] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (isMobile) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    // Slight delay to prevent flickering when moving cursor
    hoverTimeoutRef.current = setTimeout(() => {
      setHovered(false);
    }, 150);
  };

  // Perform SPA routing and set Zustand state
  const handleNavigation = async () => {
    let novel = novels.find((n) => n.id === novelId);
    if (!novel) {
      // Fallback: fetch from API if not loaded in store yet
      try {
        const res = await fetch(`/api/novels/${novelId}`);
        if (res.ok) {
          novel = await res.json();
        }
      } catch (err) {
        console.error('Failed to resolve novel for navigation:', err);
      }
    }

    if (novel) {
      setSelectedNovel(novel);
      setCurrentPage('detail');
    }
    setSheetOpen(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      setSheetOpen(true);
    } else {
      // On desktop, intercept navigation to ensure correct SPA store transitions
      e.preventDefault();
      handleNavigation();
    }
  };

  return (
    <>
      <span
        className="relative inline-block group/mention"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Link
          href={`/novels/${novelId}`}
          onClick={handleClick}
          prefetch={true}
          className="text-[#FF3D00] hover:text-white underline font-bold transition-colors font-mono cursor-pointer inline"
        >
          {title}
        </Link>

        {hovered && (
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-[999] hidden group-hover/mention:block"
          >
            <NovelMentionPreviewCard novelId={novelId} />
          </div>
        )}
      </span>

      <MobileNovelMentionSheet
        novelId={novelId}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onNavigate={handleNavigation}
      />
    </>
  );
};
