import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Star, Users, MessageSquare, Bookmark, Activity } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { CONFIG } from '../../../config';

interface AdminStats {
  content: { totalNovels: number; totalVolumes: number; totalChapters: number; totalIllustrations: number; totalWords: number; avgRating: string };
  community: { totalUsers: number; totalComments: number; totalReactions: number; totalBookmarks: number; totalReadingHistory: number; totalRecommendations: number; activeAnnouncements: number };
  activity: { last24h: { comments: number; bookmarks: number; readingSessions: number }; last7d: { comments: number; bookmarks: number; readingSessions: number }; last30d: { comments: number; bookmarks: number; readingSessions: number } };
  topPerformers: { mostViewed: { title: string; views: number } | null; highestRated: { title: string; rating: number } | null };
}

export const OverviewTab: React.FC = () => {
  const setAdminActiveSubTab = useAdminStore((state) => state.setAdminActiveSubTab);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs font-mono text-[#737373] animate-pulse p-4">Loading statistics from database...</div>;
  }

  if (!stats) {
    return <div className="text-xs font-mono text-red-400 p-4">Failed to load statistics. Check database connection.</div>;
  }

  return (
    <div className="space-y-6 text-xs font-mono text-white">
      {/* Dual-DB Live Telemetry Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-[#262626] bg-[#0A0A0A] p-4">
        {/* Neon PostgreSQL */}
        <div className="border border-[#262626] bg-[#0F0F0F] p-4 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-black text-white uppercase tracking-wider text-xs">Neon PostgreSQL (Cloud Engine)</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
              ONLINE
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Powers user authentication, OAuth provider identities, coin transactions, chapter unlocks, ratings, and cloud sync.
          </p>
          <div className="flex items-center gap-4 text-[10px] text-zinc-500 pt-2 border-t border-zinc-900">
            <span>Users: <strong className="text-white">{stats.community.totalUsers}</strong></span>
            <span>Shelf Saves: <strong className="text-white">{stats.community.totalBookmarks}</strong></span>
            <span>History Logs: <strong className="text-white">{stats.community.totalReadingHistory}</strong></span>
          </div>
        </div>

        {/* Turso libSQL */}
        <div className="border border-[#262626] bg-[#0F0F0F] p-4 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-black text-white uppercase tracking-wider text-xs">Turso libSQL (Edge Engine)</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase">
              ONLINE
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Delivers ultra-low latency manuscript content, volumes, chapter text, reader comments, and site announcements.
          </p>
          <div className="flex items-center gap-4 text-[10px] text-zinc-500 pt-2 border-t border-zinc-900">
            <span>Novels: <strong className="text-white">{stats.content.totalNovels}</strong></span>
            <span>Chapters: <strong className="text-white">{stats.content.totalChapters}</strong></span>
            <span>Comments: <strong className="text-white">{stats.community.totalComments}</strong></span>
          </div>
        </div>
      </div>

      {/* Overview Cards Grid - Interactive Drill-downs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<BookOpen className="w-4 h-4 text-[#FF3D00]" />} 
          label="Total Novels" 
          value={stats.content.totalNovels} 
          sub="Click to manage novels"
          onClick={() => setAdminActiveSubTab('novels')}
        />
        <StatCard 
          icon={<FileText className="w-4 h-4 text-[#FF3D00]" />} 
          label="Published Chapters" 
          value={stats.content.totalChapters} 
          sub="Click to manage chapters"
          onClick={() => setAdminActiveSubTab('chapters')}
        />
        <StatCard 
          icon={<Star className="w-4 h-4 text-[#FF3D00]" />} 
          label="Average Rating" 
          value={`${stats.content.avgRating} ★`} 
          sub="Across all novels" 
        />
        <StatCard 
          icon={<Users className="w-4 h-4 text-[#FF3D00]" />} 
          label="Registered Users" 
          value={stats.community.totalUsers} 
          sub="Click to manage users"
          onClick={() => setAdminActiveSubTab('users')}
        />
        <StatCard 
          icon={<MessageSquare className="w-4 h-4 text-[#FF3D00]" />} 
          label="Total Comments" 
          value={stats.community.totalComments} 
          sub="Across all chapters" 
          onClick={() => setAdminActiveSubTab('analytics')}
        />
        <StatCard 
          icon={<Bookmark className="w-4 h-4 text-[#FF3D00]" />} 
          label="Total Bookmarks" 
          value={stats.community.totalBookmarks} 
          sub="User shelf saves"
          onClick={() => setAdminActiveSubTab('analytics')}
        />
        <StatCard 
          icon={<Activity className="w-4 h-4 text-[#FF3D00]" />} 
          label="Reading Sessions" 
          value={stats.community.totalReadingHistory} 
          sub="Logged progress events"
          onClick={() => setAdminActiveSubTab('analytics')}
        />
        <StatCard 
          icon={<FileText className="w-4 h-4 text-[#FF3D00]" />} 
          label="Total Words" 
          value={stats.content.totalWords.toLocaleString()} 
          sub="Combined chapter text" 
        />
      </div>

      {/* Top Performers (if available) */}
      {stats.topPerformers && (stats.topPerformers.mostViewed || stats.topPerformers.highestRated) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.topPerformers.mostViewed && (
            <div className="border border-[#262626] bg-[#0F0F0F] p-4 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-[#737373] uppercase font-bold block">Most Viewed Novel</span>
                <span className="text-sm font-black text-white">{stats.topPerformers.mostViewed.title}</span>
              </div>
              <span className="text-xs font-mono font-bold text-[#FF3D00] bg-[#FF3D00]/10 px-2 py-1 border border-[#FF3D00]/25">
                {stats.topPerformers.mostViewed.views.toLocaleString()} views
              </span>
            </div>
          )}
          {stats.topPerformers.highestRated && (
            <div className="border border-[#262626] bg-[#0F0F0F] p-4 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-[#737373] uppercase font-bold block">Highest Rated Novel</span>
                <span className="text-sm font-black text-white">{stats.topPerformers.highestRated.title}</span>
              </div>
              <span className="text-xs font-mono font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 border border-yellow-500/25">
                ★ {stats.topPerformers.highestRated.rating}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Quick Navigation + System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-[#262626] bg-[#0F0F0F] p-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-tight text-white pb-2 border-b border-[#262626]">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button 
              onClick={() => setAdminActiveSubTab('novels')} 
              className="flex flex-col items-center justify-center p-3 border border-[#262626] hover:border-[#FF3D00] hover:shadow-[3px_3px_0px_0px_#FF3D00] bg-[#151515] transition-all text-center rounded-none cursor-pointer text-white group"
            >
              <span className="text-[#FF3D00] font-black text-xs uppercase mb-1 group-hover:scale-105 transition-transform">Novels</span>
              <span className="text-[9px] text-[#737373]">Register & edit</span>
            </button>
            <button 
              onClick={() => setAdminActiveSubTab('chapters')} 
              className="flex flex-col items-center justify-center p-3 border border-[#262626] hover:border-[#FF3D00] hover:shadow-[3px_3px_0px_0px_#FF3D00] bg-[#151515] transition-all text-center rounded-none cursor-pointer text-white group"
            >
              <span className="text-[#FF3D00] font-black text-xs uppercase mb-1 group-hover:scale-105 transition-transform">Chapters</span>
              <span className="text-[9px] text-[#737373]">Write & publish</span>
            </button>
            <button 
              onClick={() => setAdminActiveSubTab('coins')} 
              className="flex flex-col items-center justify-center p-3 border border-[#262626] hover:border-amber-400 hover:shadow-[3px_3px_0px_0px_#F59E0B] bg-[#151515] transition-all text-center rounded-none cursor-pointer text-white group"
            >
              <span className="text-amber-400 font-black text-xs uppercase mb-1 group-hover:scale-105 transition-transform">Coins</span>
              <span className="text-[9px] text-[#737373]">Ledger & unlocks</span>
            </button>
            <button 
              onClick={() => setAdminActiveSubTab('users')} 
              className="flex flex-col items-center justify-center p-3 border border-[#262626] hover:border-[#FF3D00] hover:shadow-[3px_3px_0px_0px_#FF3D00] bg-[#151515] transition-all text-center rounded-none cursor-pointer text-white group"
            >
              <span className="text-[#FF3D00] font-black text-xs uppercase mb-1 group-hover:scale-105 transition-transform">Users</span>
              <span className="text-[9px] text-[#737373]">Roles & status</span>
            </button>
            <button 
              onClick={() => setAdminActiveSubTab('recommendations')} 
              className="flex flex-col items-center justify-center p-3 border border-[#262626] hover:border-[#FF3D00] hover:shadow-[3px_3px_0px_0px_#FF3D00] bg-[#151515] transition-all text-center rounded-none cursor-pointer text-white group"
            >
              <span className="text-[#FF3D00] font-black text-xs uppercase mb-1 group-hover:scale-105 transition-transform">Carousel</span>
              <span className="text-[9px] text-[#737373]">Homepage curator</span>
            </button>
            <button 
              onClick={() => setAdminActiveSubTab('announcements')} 
              className="flex flex-col items-center justify-center p-3 border border-[#262626] hover:border-[#FF3D00] hover:shadow-[3px_3px_0px_0px_#FF3D00] bg-[#151515] transition-all text-center rounded-none cursor-pointer text-white group"
            >
              <span className="text-[#FF3D00] font-black text-xs uppercase mb-1 group-hover:scale-105 transition-transform">Alerts</span>
              <span className="text-[9px] text-[#737373]">Announcements</span>
            </button>
          </div>
        </div>

        <div className="border border-[#262626] bg-[#0F0F0F] p-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-tight text-white pb-2 border-b border-[#262626]">System Status</h3>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-[#262626]/40 pb-1.5">
              <span className="text-[#737373]">Platform Version</span>
              <span className="font-bold text-white">v{CONFIG.VERSION}</span>
            </div>
            <div className="flex justify-between border-b border-[#262626]/40 pb-1.5">
              <span className="text-[#737373]">Auth & Users DB</span>
              <span className="font-bold text-green-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Neon PostgreSQL (Active)
              </span>
            </div>
            <div className="flex justify-between border-b border-[#262626]/40 pb-1.5">
              <span className="text-[#737373]">Novel Content DB</span>
              <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                Turso libSQL (Active)
              </span>
            </div>
            <div className="flex justify-between border-b border-[#262626]/40 pb-1.5">
              <span className="text-[#737373]">Object Storage</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Cloudflare R2
              </span>
            </div>
            <div className="flex justify-between border-b border-[#262626]/40 pb-1.5">
              <span className="text-[#737373]">Active Announcements</span>
              <span className="font-bold text-[#FF3D00]">{stats.community.activeAnnouncements}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Environment</span>
              <span className="font-bold text-[#A3A3A3] uppercase">{process.env.NODE_ENV || 'production'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({ 
  icon, 
  label, 
  value, 
  sub, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  sub: string;
  onClick?: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className={`border border-[#262626] p-4 bg-[#0F0F0F] space-y-1 transition-all ${
        onClick 
          ? 'hover:border-[#FF3D00] hover:shadow-[3px_3px_0px_0px_#FF3D00] hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer' 
          : ''
      }`}
    >
      <div className="flex items-center justify-between text-[#737373]">
        <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <span className="text-[9px] text-[#737373] block truncate">{sub}</span>
    </div>
  );
}

export default OverviewTab;
