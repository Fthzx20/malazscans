import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, BookOpen, ExternalLink, FileText, Star } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { useNovelStore } from '../../novels/store/novelStore';
import { Novel } from '../../../types';
import { CreateNovelDrawer } from './CreateNovelDrawer';
import { getFlatChapters } from '../../novels/utils';

export const ManageNovelsTab: React.FC = () => {
  const novels = useNovelStore((state) => state.novels);
  const setNovels = useNovelStore((state) => state.setNovels);
  const triggerToast = useNovelStore((state) => state.triggerToast);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONGOING' | 'COMPLETED'>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'views' | 'rating' | 'title'>('newest');

  const {
    editingNovelId,
    isNovelDrawerOpen,
    setIsNovelDrawerOpen,
    adminNovelTitle,
    adminNovelCustomSlug,
    setAdminNovelCustomSlug,
    adminNovelAlt,
    adminNovelOriginalTitle,
    adminNovelJapaneseTitle,
    adminNovelRomajiTitle,
    adminNovelAuthor,
    adminNovelIllustrator,
    adminNovelTranslator,
    adminNovelPublisher,
    adminNovelGenres,
    adminNovelTags,
    adminNovelStatus,
    adminNovelSchedule,
    adminNovelIsRecommended,
    adminNovelSynopsis,
    adminNovelCoverImage,
    setEditingNovelId,
    setAdminNovelTitle,
    setAdminNovelAlt,
    setAdminNovelOriginalTitle,
    setAdminNovelJapaneseTitle,
    setAdminNovelRomajiTitle,
    setAdminNovelAuthor,
    setAdminNovelIllustrator,
    setAdminNovelTranslator,
    setAdminNovelPublisher,
    setAdminNovelGenres,
    setAdminNovelTags,
    setAdminNovelStatus,
    setAdminNovelSchedule,
    setAdminNovelIsRecommended,
    setAdminNovelSynopsis,
    setAdminNovelCoverImage,
    resetNovelForm,
  } = useAdminStore();

  const handleAddOrUpdateNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNovelTitle.trim() || !adminNovelAlt.trim() || !adminNovelAuthor.trim() || !adminNovelTranslator.trim()) {
      triggerToast('Main Title, Alternative Title, Author, and Translator are required.');
      return;
    }

    const genreList = adminNovelGenres.split(',').map(s => s.trim()).filter(Boolean);
    const tagList = adminNovelTags.split(',').map(s => s.trim()).filter(Boolean);

    if (editingNovelId) {
      // UPDATE existing novel via API
      try {
        const res = await fetch(`/api/admin/novels/${editingNovelId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: adminNovelTitle,
            alternativeTitle: adminNovelAlt,
            originalTitle: adminNovelOriginalTitle,
            japaneseTitle: adminNovelJapaneseTitle,
            romajiTitle: adminNovelRomajiTitle,
            author: adminNovelAuthor,
            illustrator: adminNovelIllustrator,
            translator: adminNovelTranslator,
            publisher: adminNovelPublisher,
            genres: genreList,
            tags: tagList,
            status: adminNovelStatus,
            releaseSchedule: adminNovelSchedule,
            isRecommended: adminNovelIsRecommended,
            synopsis: adminNovelSynopsis,
            coverImage: adminNovelCoverImage,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          triggerToast(data.error || 'Failed to update novel.');
          return;
        }
        // Refresh novels from API
        const novelsRes = await fetch('/api/novels');
        if (novelsRes.ok) {
          const freshNovels = await novelsRes.json();
          setNovels(freshNovels);
        }
        triggerToast('Novel updated successfully.');
      } catch {
        triggerToast('Failed to update novel. Check connection.');
        return;
      }
    } else {
      // CREATE new novel via API
      const defaultSlug = adminNovelTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const uniqueId = adminNovelCustomSlug.trim()
        ? adminNovelCustomSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        : defaultSlug;

      if (novels.find((n) => n.id === uniqueId)) {
        triggerToast('A novel with this slug/title already exists.');
        return;
      }

      try {
        const res = await fetch('/api/admin/novels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: uniqueId,
            title: adminNovelTitle,
            alternativeTitle: adminNovelAlt,
            originalTitle: adminNovelOriginalTitle,
            japaneseTitle: adminNovelJapaneseTitle,
            romajiTitle: adminNovelRomajiTitle,
            author: adminNovelAuthor,
            illustrator: adminNovelIllustrator,
            translator: adminNovelTranslator,
            publisher: adminNovelPublisher,
            genres: genreList,
            tags: tagList,
            status: adminNovelStatus,
            releaseSchedule: adminNovelSchedule,
            isRecommended: adminNovelIsRecommended,
            synopsis: adminNovelSynopsis,
            coverImage: adminNovelCoverImage,
            volumes: [{ volumeNumber: 1, title: 'Volume 01: Opening Session', chapters: [] }],
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          triggerToast(data.error || 'Failed to create novel.');
          return;
        }
        // Refresh novels from API
        const novelsRes = await fetch('/api/novels');
        if (novelsRes.ok) {
          const freshNovels = await novelsRes.json();
          setNovels(freshNovels);
        }
        triggerToast('Novel registered successfully.');
      } catch {
        triggerToast('Failed to create novel. Check connection.');
        return;
      }
    }
    resetNovelForm();
  };

  const handleEditNovelClick = (novel: Novel) => {
    setEditingNovelId(novel.id);
    setAdminNovelCustomSlug(novel.id);
    setAdminNovelTitle(novel.title);
    setAdminNovelAlt(novel.alternativeTitle);
    setAdminNovelOriginalTitle(novel.originalTitle || '');
    setAdminNovelJapaneseTitle(novel.japaneseTitle || '');
    setAdminNovelRomajiTitle(novel.romajiTitle || '');
    setAdminNovelAuthor(novel.author);
    setAdminNovelIllustrator(novel.illustrator || '');
    setAdminNovelTranslator(novel.translator);
    setAdminNovelPublisher(novel.publisher || '');
    setAdminNovelGenres(novel.genres.join(', '));
    setAdminNovelTags(novel.tags ? novel.tags.join(', ') : '');
    setAdminNovelStatus(novel.status);
    setAdminNovelSchedule(novel.releaseSchedule);
    setAdminNovelIsRecommended(novel.isRecommended);
    setAdminNovelSynopsis(novel.synopsis);
    setAdminNovelCoverImage(novel.coverImage || '');
    setIsNovelDrawerOpen(true);
  };

  const handleDeleteNovelClick = async (novelId: string) => {
    if (confirm('Are you sure you want to delete this novel and all of its volumes/chapters?')) {
      try {
        const res = await fetch(`/api/admin/novels/${novelId}`, { method: 'DELETE' });
        if (!res.ok) {
          triggerToast('Failed to delete novel.');
          return;
        }
        // Refresh from API
        const novelsRes = await fetch('/api/novels');
        if (novelsRes.ok) {
          const freshNovels = await novelsRes.json();
          setNovels(freshNovels);
        }
        triggerToast('Novel deleted from database.');
        if (editingNovelId === novelId) resetNovelForm();
      } catch {
        triggerToast('Failed to delete novel. Check connection.');
      }
    }
  };

  const handleViewOnSite = (novel: Novel) => {
    useNovelStore.getState().setSelectedNovel(novel);
    useNovelStore.getState().setCurrentPage('detail');
  };

  const handleManageChapters = (novelId: string) => {
    useAdminStore.getState().setSelectedAdminNovelId(novelId);
    useAdminStore.getState().setAdminActiveSubTab('chapters');
  };

  const handleToggleStatus = async (novel: Novel) => {
    const newStatus = novel.status === 'ONGOING' ? 'COMPLETED' : 'ONGOING';
    try {
      const res = await fetch(`/api/admin/novels/${novel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setNovels(novels.map(n => n.id === novel.id ? { ...n, status: newStatus } : n));
        triggerToast(`"${novel.title}" marked as ${newStatus}.`);
      }
    } catch {
      triggerToast('Failed to update status.');
    }
  };

  const handleToggleFeatured = async (novel: Novel) => {
    const newFeatured = !novel.isRecommended;
    try {
      const res = await fetch(`/api/admin/novels/${novel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRecommended: newFeatured }),
      });
      if (res.ok) {
        setNovels(novels.map(n => n.id === novel.id ? { ...n, isRecommended: newFeatured } : n));
        triggerToast(`"${novel.title}" ${newFeatured ? 'marked as Featured.' : 'removed from Featured.'}`);
      } else {
        triggerToast('Failed to update featured status.');
      }
    } catch {
      triggerToast('Failed to update featured status. Check connection.');
    }
  };

  // Filtered & sorted novels for display
  const filtered = useMemo(() => {
    return novels
      .filter((n) => {
        const matchSearch = searchTerm === '' ||
          n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.author.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'ALL' || n.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        if (sortBy === 'oldest') return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
        if (sortBy === 'views') {
          const viewsB = Number(String(b.views || 0).replace(/,/g, '')) || 0;
          const viewsA = Number(String(a.views || 0).replace(/,/g, '')) || 0;
          return viewsB - viewsA;
        }
        if (sortBy === 'rating') return Number(b.rating || 0) - Number(a.rating || 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [novels, searchTerm, statusFilter, sortBy]);

  return (
    <div className="space-y-5 text-xs font-mono text-white">
      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Left: Search + Filter + Sort */}
        <div className="flex flex-col sm:flex-row gap-2 flex-grow">
          {/* Search Input */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#737373]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or author..."
              className="w-full bg-[#111111] border border-[#262626] pl-8 pr-3 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#FF3D00] rounded-none placeholder:text-[#444]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ONGOING' | 'COMPLETED')}
            className="bg-[#111111] border border-[#262626] px-3 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#FF3D00] rounded-none cursor-pointer sm:w-36 w-full"
            aria-label="Filter by Status"
          >
            <option value="ALL">All Status</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Sort By */}
          <div className="relative sm:w-44 w-full">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'views' | 'rating' | 'title')}
              className="w-full bg-[#111111] border border-[#262626] px-3 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#FF3D00] rounded-none cursor-pointer"
              aria-label="Sort Novels"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="views">Most Views</option>
              <option value="rating">Highest Rating</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Right: Create Button */}
        <button
          onClick={() => { resetNovelForm(); setIsNovelDrawerOpen(true); }}
          className="inline-flex items-center justify-center gap-2 bg-[#FF3D00] text-[#0A0A0A] font-mono font-black text-xs py-2.5 px-5 uppercase hover:bg-white transition-colors border-none cursor-pointer w-full lg:w-auto flex-shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Novel
        </button>
      </div>

      {/* Table Summary */}
      <div className="flex justify-between items-center text-[10px] text-[#737373] uppercase tracking-widest font-bold">
        <span>
          {filtered.length === novels.length
            ? `${novels.length} novel${novels.length !== 1 ? 's' : ''} registered`
            : `Showing ${filtered.length} of ${novels.length}`
          }
        </span>
        <span>Sorted by {sortBy.replace('-', ' ')}</span>
      </div>

      {/* Novels Table */}
      {filtered.length > 0 ? (
        <div className="border border-[#262626] overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[800px] text-left text-xs font-mono text-[#FAFAFA] border-collapse">
              <thead>
                <tr className="bg-[#0A0A0A] border-b border-[#262626] text-[#737373] uppercase text-[10px] tracking-widest">
                  <th className="px-4 py-3 font-bold w-16">Cover</th>
                  <th className="px-4 py-3 font-bold">Title</th>
                  <th className="px-4 py-3 font-bold">Author</th>
                  <th className="px-4 py-3 font-bold text-center">Status</th>
                  <th className="px-4 py-3 font-bold text-center">Chapters</th>
                  <th className="px-4 py-3 font-bold text-center">Views</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {filtered.map((novel) => {
                  const chapterCount = novel.volumes.reduce((acc, vol) => acc + vol.chapters.length, 0);
                  return (
                    <tr key={novel.id} className="bg-[#0F0F0F] hover:bg-[#141414] transition-colors group">
                      {/* Cover Thumbnail */}
                      <td className="px-4 py-3">
                        <div className="w-9 h-12 bg-[#1a1a1a] border border-[#262626] overflow-hidden flex-shrink-0">
                          {novel.coverImage ? (
                            <img
                              src={novel.coverImage}
                              alt={novel.title}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-3.5 h-3.5 text-[#444]" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="font-black text-white max-w-[200px] truncate" title={novel.title}>
                            {novel.title}
                          </div>
                          {novel.isRecommended && (
                            <span className="text-[8px] font-mono font-black text-[#FF3D00] bg-[#FF3D00]/10 border border-[#FF3D00]/30 px-1 py-0.2 uppercase flex-shrink-0">
                              Featured
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-[#737373] mt-0.5 max-w-[200px] truncate" title={novel.alternativeTitle}>
                          {novel.alternativeTitle}
                        </div>
                      </td>

                      {/* Author */}
                      <td className="px-4 py-3 text-[#A3A3A3] max-w-[120px] truncate">{novel.author}</td>

                      {/* Status Badge with Quick Toggle */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleStatus(novel)}
                          className={`text-[9px] font-black uppercase px-2 py-0.5 border tracking-wider transition-all cursor-pointer ${
                            novel.status === 'ONGOING'
                              ? 'text-green-400 border-green-500/30 bg-green-500/10 hover:bg-green-500/20'
                              : 'text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20'
                          }`}
                          title="Click to toggle status (Ongoing / Completed)"
                        >
                          {novel.status}
                        </button>
                      </td>

                      {/* Chapter Count */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-white font-bold">{chapterCount}</span>
                      </td>

                      {/* Views */}
                      <td className="px-4 py-3 text-center text-[#737373]">{novel.views.toLocaleString()}</td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick toggle featured */}
                          <button
                            onClick={() => handleToggleFeatured(novel)}
                            className={`p-1.5 transition-all border-none bg-transparent cursor-pointer ${
                              novel.isRecommended
                                ? 'text-[#FF3D00] hover:text-white'
                                : 'text-[#444] hover:text-[#FF3D00]'
                            }`}
                            title={novel.isRecommended ? 'Featured on carousel (click to remove)' : 'Not featured (click to feature)'}
                          >
                            <Star className={`w-3.5 h-3.5 ${novel.isRecommended ? 'fill-[#FF3D00]' : ''}`} />
                          </button>

                          {/* View on public site */}
                          <button
                            onClick={() => handleViewOnSite(novel)}
                            className="p-1.5 text-[#737373] hover:text-[#FF3D00] hover:bg-[#1a1a1a] transition-all border-none bg-transparent cursor-pointer"
                            title="View on public site"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* Jump to chapters */}
                          <button
                            onClick={() => handleManageChapters(novel.id)}
                            className="p-1.5 text-[#737373] hover:text-[#FF3D00] hover:bg-[#1a1a1a] transition-all border-none bg-transparent cursor-pointer"
                            title="Manage chapters"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleEditNovelClick(novel)}
                            className="p-1.5 text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-all border-none bg-transparent cursor-pointer"
                            title="Edit metadata"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteNovelClick(novel.id)}
                            className="p-1.5 text-[#737373] hover:text-red-400 hover:bg-red-500/10 transition-all border-none bg-transparent cursor-pointer"
                            title="Delete novel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="border border-dashed border-[#262626] bg-[#0A0A0A] py-20 text-center">
          <BookOpen className="w-10 h-10 text-[#333] mx-auto mb-4" />
          <p className="text-sm font-black uppercase text-[#737373] mb-2">
            {searchTerm || statusFilter !== 'ALL' ? 'No novels match your filters' : 'No novels registered yet'}
          </p>
          <p className="text-[10px] text-[#555] font-mono mb-6">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Try adjusting your search or filter criteria.'
              : 'Start by registering your first light novel to the platform.'
            }
          </p>
          {!searchTerm && statusFilter === 'ALL' && (
            <button
              onClick={() => { resetNovelForm(); setIsNovelDrawerOpen(true); }}
              className="inline-flex items-center gap-2 bg-[#FF3D00] text-[#0A0A0A] font-mono font-black text-xs py-2.5 px-6 uppercase hover:bg-white transition-colors border-none cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register First Novel
            </button>
          )}
        </div>
      )}

      {/* The Drawer (rendered at end to overlay everything) */}
      <CreateNovelDrawer onSubmit={handleAddOrUpdateNovel} />
    </div>
  );
};

export default ManageNovelsTab;
