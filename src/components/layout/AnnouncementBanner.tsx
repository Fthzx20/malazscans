import React, { useState, useEffect, useCallback } from 'react';
import { Bell, ShieldAlert, AlertCircle, X, ChevronRight, Sparkles } from 'lucide-react';
import { Notification } from '../../types';

export const AnnouncementBanner: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [announcement, setAnnouncement] = useState<Notification | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    fetch('/api/announcements')
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Notification[]) => {
        if (!Array.isArray(list) || list.length === 0) return;

        const today = new Date().toISOString().split('T')[0];

        // Find active, published announcements within date range and not dismissed
        const validList = list.filter((n) => {
          if (n.status !== 'published') return false;
          if (n.startDate && n.startDate > today) return false;
          if (n.endDate && n.endDate < today) return false;

          const isDismissed =
            typeof window !== 'undefined' &&
            (localStorage.getItem(`announcement_banner_dismissed_${n.id}_${n.updatedAt}`) === 'true' ||
             sessionStorage.getItem(`announcement_banner_dismissed_${n.id}_${n.updatedAt}`) === 'true');

          return !isDismissed;
        });

        if (validList.length === 0) return;

        // Sort by priority (high > medium > low), then by updatedAt DESC
        const priorityScore: Record<string, number> = { high: 3, medium: 2, low: 1 };
        validList.sort((a, b) => {
          const scoreDiff = (priorityScore[b.priority] || 1) - (priorityScore[a.priority] || 1);
          if (scoreDiff !== 0) return scoreDiff;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        setAnnouncement(validList[0]);
      })
      .catch(() => {});
  }, [mounted]);

  const handleDismiss = useCallback(() => {
    if (announcement) {
      try {
        localStorage.setItem(
          `announcement_banner_dismissed_${announcement.id}_${announcement.updatedAt}`,
          'true'
        );
        sessionStorage.setItem(
          `announcement_banner_dismissed_${announcement.id}_${announcement.updatedAt}`,
          'true'
        );
      } catch {}
      setAnnouncement(null);
    }
  }, [announcement]);

  if (!mounted || !announcement) return null;

  const isHigh = announcement.priority === 'high';
  const isMed = announcement.priority === 'medium';

  const badgeBg = isHigh ? 'bg-[#FF3D00] text-[#0A0A0A]' : isMed ? 'bg-amber-400 text-[#0A0A0A]' : 'bg-cyan-400 text-[#0A0A0A]';
  const borderColor = isHigh ? 'border-[#FF3D00]/50' : isMed ? 'border-amber-500/50' : 'border-cyan-500/50';
  const glowColor = isHigh ? 'shadow-[0_2px_12px_rgba(255,61,0,0.25)]' : isMed ? 'shadow-[0_2px_12px_rgba(245,158,11,0.25)]' : 'shadow-[0_2px_12px_rgba(6,182,212,0.25)]';
  const label = isHigh ? 'SYSTEM ALERT' : isMed ? 'UPDATE' : 'NOTICE';

  const IconComponent = isHigh ? ShieldAlert : isMed ? AlertCircle : Bell;

  return (
    <div 
      className={`w-full bg-[#0D0D0E] border-b ${borderColor} ${glowColor} transition-all duration-300 font-mono text-xs z-30 relative`}
      role="region"
      aria-label="Platform Announcement"
    >
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        
        {/* Left: Indicator & Message */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className={`${badgeBg} font-black text-[9px] px-2 py-0.5 uppercase tracking-widest shrink-0 flex items-center gap-1`}>
            <IconComponent className="w-3 h-3" />
            <span>{label}</span>
          </span>

          <div className="min-w-0 flex-1">
            <span className="font-bold text-white tracking-tight mr-2 truncate">
              {announcement.title}
            </span>
            <span className="text-zinc-400 text-[11px] hidden md:inline">
              &mdash; {announcement.content.length > 90 ? `${announcement.content.slice(0, 90)}...` : announcement.content}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="text-[10px] uppercase font-bold text-zinc-300 hover:text-[#FF3D00] transition-colors flex items-center gap-0.5 bg-transparent border-none cursor-pointer py-1 px-1.5"
            aria-label={isExpanded ? "Collapse announcement details" : "Expand announcement details"}
          >
            <span>{isExpanded ? 'Less' : 'Details'}</span>
            <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>

          <button
            onClick={handleDismiss}
            className="p-1 text-zinc-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            aria-label="Dismiss announcement banner"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable details panel */}
      {isExpanded && (
        <div className="border-t border-zinc-800 bg-[#080809] px-4 py-4 max-w-5xl mx-auto text-xs text-zinc-300 space-y-2 animate-in fade-in duration-200">
          <p className="whitespace-pre-wrap leading-relaxed font-mono">
            {announcement.content}
          </p>
          <div className="text-[10px] text-zinc-500 flex justify-between items-center pt-2 border-t border-zinc-900">
            <span>Posted: {new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <button
              onClick={handleDismiss}
              className="text-[#FF3D00] hover:underline font-bold uppercase bg-transparent border-none cursor-pointer text-[10px]"
            >
              Acknowledge & Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementBanner;
