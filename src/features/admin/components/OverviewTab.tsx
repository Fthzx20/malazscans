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
    <div className="space-y-8 text-xs font-mono text-white">
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen className="w-4 h-4 text-[#FF3D00]" />} label="Total Novels" value={stats.content.totalNovels} sub="Active titles in database" />
        <StatCard icon={<FileText className="w-4 h-4 text-[#FF3D00]" />} label="Published Chapters" value={stats.content.totalChapters} sub="Translated and live" />
        <StatCard icon={<Star className="w-4 h-4 text-[#FF3D00]" />} label="Average Rating" value={`${stats.content.avgRating} ★`} sub="All novels" />
        <StatCard icon={<Users className="w-4 h-4 text-[#FF3D00]" />} label="Registered Users" value={stats.community.totalUsers} sub="Supabase Auth" />
        <StatCard icon={<MessageSquare className="w-4 h-4 text-[#FF3D00]" />} label="Total Comments" value={stats.community.totalComments} sub="All chapters" />
        <StatCard icon={<Bookmark className="w-4 h-4 text-[#FF3D00]" />} label="Total Bookmarks" value={stats.community.totalBookmarks} sub="User saves" />
        <StatCard icon={<Activity className="w-4 h-4 text-[#FF3D00]" />} label="Reading Sessions" value={stats.community.totalReadingHistory} sub="Logged progress" />
        <StatCard icon={<FileText className="w-4 h-4 text-[#FF3D00]" />} label="Total Words" value={stats.content.totalWords.toLocaleString()} sub="All chapters combined" />
      </div>

      {/* Quick Navigation + System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-[#262626] bg-[#0F0F0F] p-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-tight text-white pb-2 border-b border-[#262626]">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setAdminActiveSubTab('novels')} className="flex flex-col items-center justify-center p-4 border border-[#262626] hover:border-[#FF3D00] bg-[#151515] transition-all text-center rounded-none cursor-pointer text-white">
              <span className="text-[#FF3D00] font-black text-sm uppercase mb-1">Create Novel</span>
              <span className="text-[9px] text-[#737373]">Register new metadata</span>
            </button>
            <button onClick={() => setAdminActiveSubTab('chapters')} className="flex flex-col items-center justify-center p-4 border border-[#262626] hover:border-[#FF3D00] bg-[#151515] transition-all text-center rounded-none cursor-pointer text-white">
              <span className="text-[#FF3D00] font-black text-sm uppercase mb-1">New Chapter</span>
              <span className="text-[9px] text-[#737373]">Write and edit content</span>
            </button>
            <button onClick={() => setAdminActiveSubTab('recommendations')} className="flex flex-col items-center justify-center p-4 border border-[#262626] hover:border-[#FF3D00] bg-[#151515] transition-all text-center rounded-none cursor-pointer text-white">
              <span className="text-[#FF3D00] font-black text-sm uppercase mb-1">Reorder Slides</span>
              <span className="text-[9px] text-[#737373]">Manage recommendations</span>
            </button>
            <button onClick={() => setAdminActiveSubTab('analytics')} className="flex flex-col items-center justify-center p-4 border border-[#262626] hover:border-[#FF3D00] bg-[#151515] transition-all text-center rounded-none cursor-pointer text-white">
              <span className="text-[#FF3D00] font-black text-sm uppercase mb-1">View Analytics</span>
              <span className="text-[9px] text-[#737373]">Real-time metrics</span>
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
              <span className="text-[#737373]">Database</span>
              <span className="font-bold text-green-500">Supabase Postgres</span>
            </div>
            <div className="flex justify-between border-b border-[#262626]/40 pb-1.5">
              <span className="text-[#737373]">Authentication</span>
              <span className="font-bold text-green-500">Supabase Auth</span>
            </div>
            <div className="flex justify-between border-b border-[#262626]/40 pb-1.5">
              <span className="text-[#737373]">Storage</span>
              <span className="font-bold text-green-500">Cloudflare R2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Active Announcements</span>
              <span className="font-bold text-[#FF3D00]">{stats.community.activeAnnouncements}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub: string }) {
  return (
    <div className="border border-[#262626] p-4 bg-[#0F0F0F] space-y-1">
      <div className="flex items-center justify-between text-[#737373]">
        <span className="text-[10px] uppercase font-bold">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <span className="text-[9px] text-[#737373] block">{sub}</span>
    </div>
  );
}

export default OverviewTab;
