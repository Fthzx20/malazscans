"use client";

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, BookOpen } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { useNovelStore } from '../../novels/store/novelStore';
import { Novel } from '../../../types';
import { CreateNovelDrawer } from './CreateNovelDrawer';
import { getFlatChapters } from '../../novels/utils';

export const ManageNovelsTab: React.FC = () => {
  const novels = useNovelStore((state) => state.novels);
  const setNovels = useNovelStore((state) => state.setNovels);
  const triggerToast = useNovelStore((state) => state.triggerToast);

  const {
    editingNovelId,
    isNovelDrawerOpen,
    setIsNovelDrawerOpen,
    adminNovelTitle,
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

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONGOING' | 'COMPLETED'>('ALL');

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
      const uniqueId = adminNovelTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      if (novels.find((n) => n.id === uniqueId)) {
        triggerToast('A novel with this title already exists.');
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

  // Filtered novels for display
  const filtered = novels.filter((n) => {
    const matchSearch = searchTerm === '' ||
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || n.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5 text-xs font-mono text-white">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Left: Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-2 flex-grow">
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ONGOING' | 'COMPLETED')}
            className="bg-[#111111] border border-[#262626] px-3 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#FF3D00] rounded-none appearance-none cursor-pointer sm:w-40 w-full"
          >
            <option value="ALL">All Status</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* Right: Create Button */}
        <button
          onClick={() => { resetNovelForm(); setIsNovelDrawerOpen(true); }}
          className="inline-flex items-center justify-center gap-2 bg-[#FF3D00] text-[#0A0A0A] font-mono font-black text-xs py-2.5 px-5 uppercase hover:bg-white transition-colors border-none cursor-pointer w-full md:w-auto flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Novel
        </button>
      </div>

      {/* Table Summary */}
      <div className="text-[10px] text-[#737373] uppercase tracking-widest font-bold">
        {filtered.length === novels.length
          ? `${novels.length} novel${novels.length !== 1 ? 's' : ''} registered`
          : `Showing ${filtered.length} of ${novels.length}`
        }
      </div>

      {/* Novels Table */}
      {filtered.length > 0 ? (
        <div className="border border-[#262626] overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[768px] text-left text-xs font-mono text-[#FAFAFA] border-collapse">
              <thead>
                <tr className="bg-[#0A0A0A] border-b border-[#262626] text-[#737373] uppercase text-[10px] tracking-widest">
                  <th className="px-4 py-3 font-bold w-16">Cover</th>
                  <th className="px-4 py-3 font-bold">Title</th>
                  <th className="px-4 py-3 font-bold">Author</th>
                  <th className="px-4 py-3 font-bold">Status</th>
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
                        <div className="font-black text-white max-w-[220px] truncate" title={novel.title}>
                          {novel.title}
                        </div>
                        <div className="text-[9px] text-[#737373] mt-0.5 max-w-[220px] truncate" title={novel.alternativeTitle}>
                          {novel.alternativeTitle}
                        </div>
                      </td>

                      {/* Author */}
                      <td className="px-4 py-3 text-[#A3A3A3] max-w-[120px] truncate">{novel.author}</td>

                      {/* Status Badge */}
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 border tracking-wider ${
                          novel.status === 'ONGOING'
                            ? 'text-green-400 border-green-500/30 bg-green-500/5'
                            : 'text-blue-400 border-blue-500/30 bg-blue-500/5'
                        }`}>
                          {novel.status}
                        </span>
                      </td>

                      {/* Chapter Count */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-white font-bold">{chapterCount}</span>
                      </td>

                      {/* Views */}
                      <td className="px-4 py-3 text-center text-[#737373]">{novel.views}</td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditNovelClick(novel)}
                            className="p-1.5 text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-all border-none bg-transparent cursor-pointer"
                            title="Edit novel"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNovelClick(novel.id)}
                            className="p-1.5 text-[#737373] hover:text-red-400 hover:bg-red-500/5 transition-all border-none bg-transparent cursor-pointer"
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
