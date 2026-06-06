import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Calendar, TrendingUp, Users, MessageSquare, Bookmark, Award } from 'lucide-react';

interface AdminStats {
  content: { totalNovels: number; totalVolumes: number; totalChapters: number; totalIllustrations: number; totalWords: number; avgRating: string };
  community: { totalUsers: number; totalComments: number; totalReactions: number; totalBookmarks: number; totalReadingHistory: number; totalRecommendations: number; activeAnnouncements: number };
  activity: { last24h: { comments: number; bookmarks: number; readingSessions: number }; last7d: { comments: number; bookmarks: number; readingSessions: number }; last30d: { comments: number; bookmarks: number; readingSessions: number } };
  topPerformers: {
    mostViewed: { title: string; views: number } | null;
    highestRated: { title: string; rating: number } | null;
    mostMentioned: { title: string; count: number }[];
  };
}

export const AnalyticsTab: React.FC = () => {
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
    return <div className="text-xs font-mono text-[#737373] animate-pulse p-4">Fetching analytics from Supabase...</div>;
  }

  if (!stats) {
    return <div className="text-xs font-mono text-red-400 p-4">Failed to load analytics data.</div>;
  }

  return (
    <div className="space-y-8 text-xs font-mono text-white">
      
      {/* Content Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Novels" value={stats.content.totalNovels} icon={<BookOpen className="w-4 h-4 text-[#FF3D00]" />} />
        <MetricCard label="Total Chapters" value={stats.content.totalChapters} icon={<FileText className="w-4 h-4 text-[#FF3D00]" />} />
        <MetricCard label="Total Volumes" value={stats.content.totalVolumes} icon={<Calendar className="w-4 h-4 text-[#FF3D00]" />} />
        <MetricCard label="Total Words" value={stats.content.totalWords.toLocaleString()} icon={<FileText className="w-4 h-4 text-[#FF3D00]" />} />
      </div>

      {/* Community + Engagement */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Registered Users" value={stats.community.totalUsers} icon={<Users className="w-4 h-4 text-[#FF3D00]" />} />
        <MetricCard label="Total Comments" value={stats.community.totalComments} icon={<MessageSquare className="w-4 h-4 text-[#FF3D00]" />} />
        <MetricCard label="Total Bookmarks" value={stats.community.totalBookmarks} icon={<Bookmark className="w-4 h-4 text-[#FF3D00]" />} />
        <MetricCard label="Reading Sessions" value={stats.community.totalReadingHistory} icon={<TrendingUp className="w-4 h-4 text-[#FF3D00]" />} />
      </div>

      {/* Activity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityPanel title="Last 24 Hours" data={stats.activity.last24h} />
        <ActivityPanel title="Last 7 Days" data={stats.activity.last7d} />
        <ActivityPanel title="Last 30 Days" data={stats.activity.last30d} />
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-[#262626] bg-[#0F0F0F] p-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-tight text-white pb-2 border-b border-[#262626] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#FF3D00]" />
            Novel Performance
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-[#262626]/40 pb-1.5">
              <span className="text-[#737373]">Most Viewed</span>
              <span className="font-bold text-white truncate max-w-[120px]">
                {stats.topPerformers.mostViewed?.title || 'No data'}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#262626]/40 pb-1.5">
              <span className="text-[#737373]">Views</span>
              <span className="font-bold text-[#FF3D00]">
                {stats.topPerformers.mostViewed?.views.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#262626]/40 pb-1.5">
              <span className="text-[#737373]">Highest Rated</span>
              <span className="font-bold text-white truncate max-w-[120px]">
                {stats.topPerformers.highestRated?.title || 'No data'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Rating</span>
              <span className="font-bold text-green-500">
                {stats.topPerformers.highestRated?.rating.toFixed(1) || '0.0'} ★
              </span>
            </div>
          </div>
        </div>

        <div className="border border-[#262626] bg-[#0F0F0F] p-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-tight text-white pb-2 border-b border-[#262626] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FF3D00]" />
            Database Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-[#262626]/40 pb-1.5">
              <span className="text-[#737373]">Illustrations</span>
              <span className="font-bold text-white">{stats.content.totalIllustrations}</span>
            </div>
            <div className="flex justify-between border-b border-[#262626]/40 pb-1.5">
              <span className="text-[#737373]">Reactions</span>
              <span className="font-bold text-white">{stats.community.totalReactions}</span>
            </div>
            <div className="flex justify-between border-b border-[#262626]/40 pb-1.5">
              <span className="text-[#737373]">Recommendations</span>
              <span className="font-bold text-white">{stats.community.totalRecommendations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Active Announcements</span>
              <span className="font-bold text-[#FF3D00]">{stats.community.activeAnnouncements}</span>
            </div>
          </div>
        </div>

        <div className="border border-[#262626] bg-[#0F0F0F] p-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-tight text-white pb-2 border-b border-[#262626] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#FF3D00]" />
            Most Mentioned
          </h3>
          <div className="space-y-3">
            {stats.topPerformers.mostMentioned && stats.topPerformers.mostMentioned.length > 0 ? (
              stats.topPerformers.mostMentioned.map((item, idx) => (
                <div key={idx} className="flex justify-between border-b border-[#262626]/40 pb-1.5 last:border-b-0 last:pb-0">
                  <span className="text-[#737373] truncate max-w-[130px]" title={item.title}>
                    {idx + 1}. {item.title}
                  </span>
                  <span className="font-bold text-[#FF3D00] flex-shrink-0">
                    {item.count} {item.count === 1 ? 'mention' : 'mentions'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-[#737373] py-5">No mentions tracked yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function MetricCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="border border-[#262626] p-4 bg-[#0F0F0F] space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#737373] uppercase font-bold">{label}</span>
        {icon}
      </div>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  );
}

function ActivityPanel({ title, data }: { title: string; data: { comments: number; bookmarks: number; readingSessions: number } }) {
  return (
    <div className="border border-[#262626] bg-[#0F0F0F] p-4 space-y-3">
      <div className="border-b border-[#262626]/40 pb-2">
        <span className="font-bold text-[#FF3D00] uppercase text-[10px]">{title}</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-[#737373]">New Comments</span>
          <span className="font-bold text-white">{data.comments}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#737373]">New Bookmarks</span>
          <span className="font-bold text-white">{data.bookmarks}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#737373]">Reading Sessions</span>
          <span className="font-bold text-white">{data.readingSessions}</span>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsTab;
