import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Edit, Trash2, FolderPlus, BookOpen, Search, Eye, ExternalLink, Lock } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { useNovelStore } from '../../novels/store/novelStore';
import { useReaderStore } from '../../reader/store/readerStore';
import { Chapter } from '../../../types';

interface VolumeInfo {
  id: string;
  volumeNumber: number;
  title: string;
  chapterCount: number;
}

interface ManageChaptersTabProps {
  handleDeleteChapter: (chapterId: string) => void;
}

export const ManageChaptersTab: React.FC<ManageChaptersTabProps> = ({ handleDeleteChapter }) => {
  const novels = useNovelStore((state) => state.novels);
  const triggerToast = useNovelStore((state) => state.triggerToast);
  
  const {
    selectedAdminNovelId,
    setSelectedAdminNovelId,
    setActiveEditorMode,
    setEditingChapterId,
    setAdminChapTitle,
    setAdminChapContent,
    setAdminChapIsLocked,
    setAdminChapCoinPrice,
    resetChapterForm
  } = useAdminStore();

  const [volumes, setVolumes] = useState<VolumeInfo[]>([]);
  const [showNewVolume, setShowNewVolume] = useState(false);
  const [newVolumeTitle, setNewVolumeTitle] = useState('');
  const [isCreatingVolume, setIsCreatingVolume] = useState(false);
  const [chapterSearch, setChapterSearch] = useState('');

  const selectedVolumeId = useAdminStore((state) => state.selectedAdminVolumeId);
  const setSelectedVolumeId = useAdminStore((state) => state.setSelectedAdminVolumeId);

  // Initialize novel selection
  useEffect(() => {
    if (!selectedAdminNovelId && novels.length > 0) {
      setSelectedAdminNovelId(novels[0].id);
    }
  }, [novels, selectedAdminNovelId, setSelectedAdminNovelId]);

  // Fetch volumes when novel changes
  useEffect(() => {
    if (!selectedAdminNovelId) return;
    fetch(`/api/admin/novels/${selectedAdminNovelId}/volumes`)
      .then(res => res.ok ? res.json() : [])
      .then((data: VolumeInfo[]) => {
        setVolumes(data);
        if (data.length > 0 && !selectedVolumeId) {
          setSelectedVolumeId(data[0].id);
        } else if (data.length > 0 && !data.find(v => v.id === selectedVolumeId)) {
          setSelectedVolumeId(data[0].id);
        }
      })
      .catch(() => setVolumes([]));
  }, [selectedAdminNovelId]);

  const targetNovel = novels.find(n => n.id === selectedAdminNovelId) || null;

  // Get chapters for selected volume from the novels state
  const getVolumeChapters = (): (Chapter & { volumeTitle: string })[] => {
    if (!targetNovel || !selectedVolumeId) return [];
    const vol = targetNovel.volumes.find(v => {
      // Match by volumeNumber since local data doesn't have UUID
      const volInfo = volumes.find(vi => vi.id === selectedVolumeId);
      return volInfo && v.volumeNumber === volInfo.volumeNumber;
    });
    if (!vol) return [];
    return vol.chapters.map(c => ({ ...c, volumeTitle: vol.title }));
  };

  const chaptersForVolume = getVolumeChapters();

  const handleCreateVolume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolumeTitle.trim()) {
      triggerToast('Volume title is required.');
      return;
    }
    setIsCreatingVolume(true);
    try {
      const res = await fetch(`/api/admin/novels/${selectedAdminNovelId}/volumes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newVolumeTitle.trim() }),
      });
      if (!res.ok) {
        triggerToast('Failed to create volume.');
        return;
      }
      const created = await res.json();
      setVolumes(prev => [...prev, created]);
      setSelectedVolumeId(created.id);
      setNewVolumeTitle('');
      setShowNewVolume(false);
      triggerToast(`Volume "${created.title}" created.`);

      // Refresh novels to get updated volume list
      const novelsRes = await fetch('/api/novels');
      if (novelsRes.ok) {
        const { setNovels } = useNovelStore.getState();
        setNovels(await novelsRes.json());
      }
    } catch {
      triggerToast('Failed to create volume.');
    } finally {
      setIsCreatingVolume(false);
    }
  };

  const handleDeleteVolume = async (volumeId: string) => {
    const vol = volumes.find(v => v.id === volumeId);
    if (!vol) return;
    if (!confirm(`Delete "${vol.title}" and all its chapters?`)) return;

    try {
      const res = await fetch(`/api/admin/volumes/${volumeId}`, { method: 'DELETE' });
      if (!res.ok) { triggerToast('Failed to delete volume.'); return; }
      setVolumes(prev => prev.filter(v => v.id !== volumeId));
      if (selectedVolumeId === volumeId) {
        const remaining = volumes.filter(v => v.id !== volumeId);
        setSelectedVolumeId(remaining.length > 0 ? remaining[0].id : '');
      }
      triggerToast('Volume deleted.');

      const novelsRes = await fetch('/api/novels');
      if (novelsRes.ok) {
        const { setNovels } = useNovelStore.getState();
        setNovels(await novelsRes.json());
      }
    } catch {
      triggerToast('Failed to delete volume.');
    }
  };

  const handleOpenChapterEditor = (mode: 'create' | 'edit', chapter?: Chapter) => {
    if (mode === 'create') {
      resetChapterForm();
      setActiveEditorMode('create');
    } else if (mode === 'edit' && chapter) {
      setEditingChapterId(chapter.id);
      const cleanedTitle = chapter.title.replace(/^(Chapter|Bab) \d+:\s*/i, '');
      setAdminChapTitle(cleanedTitle);
      setAdminChapContent(chapter.content);
      setAdminChapIsLocked(Boolean(chapter.isLocked));
      setAdminChapCoinPrice(chapter.coinPrice || 5);
      setActiveEditorMode('edit');
    }
  };

  const handlePreviewChapter = (chapter: Chapter) => {
    if (targetNovel) {
      useNovelStore.getState().setSelectedNovel(targetNovel);
      useReaderStore.getState().setActiveChapter(chapter);
      useNovelStore.getState().setCurrentPage('reader');
    }
  };

  const handleViewNovelOnSite = () => {
    if (targetNovel) {
      useNovelStore.getState().setSelectedNovel(targetNovel);
      useNovelStore.getState().setCurrentPage('detail');
    }
  };

  // Helper to approximate word count from string or JSON content
  const getWordCount = (content: string) => {
    try {
      if (content.startsWith('{')) {
        const parsed = JSON.parse(content);
        const extractText = (node: any): string => {
          if (node.text) return node.text;
          if (node.content && Array.isArray(node.content)) {
            return node.content.map(extractText).join(' ');
          }
          return '';
        };
        const text = extractText(parsed);
        return text.trim() ? text.trim().split(/\s+/).length : 0;
      }
    } catch {}
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  };

  // Filter chapters by search term
  const filteredChapters = useMemo(() => {
    if (!chapterSearch.trim()) return chaptersForVolume;
    const term = chapterSearch.toLowerCase();
    return chaptersForVolume.filter(c => c.title.toLowerCase().includes(term) || c.id.toLowerCase().includes(term));
  }, [chaptersForVolume, chapterSearch]);

  return (
    <div className="border border-[#262626] bg-[#0F0F0F] p-6 space-y-6 text-white text-xs font-mono">
      
      {/* Novel Selector + Novel Header Card */}
      <div className="border-b border-[#262626] pb-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-1.5 w-full sm:max-w-md">
            <label className="text-[10px] text-[#737373] uppercase font-bold block">Select Target Novel</label>
            <select 
              value={selectedAdminNovelId}
              onChange={(e) => { setSelectedAdminNovelId(e.target.value); setSelectedVolumeId(''); }}
              className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00] rounded-none font-mono text-xs font-bold uppercase cursor-pointer"
            >
              {novels.length === 0 && <option value="">No novels registered</option>}
              {novels.map(n => (
                <option key={n.id} value={n.id}>{n.title}</option>
              ))}
            </select>
          </div>

          {targetNovel && (
            <button
              onClick={handleViewNovelOnSite}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FF3D00] hover:text-white border border-[#FF3D00]/30 hover:border-[#FF3D00] px-3 py-2 bg-[#FF3D00]/5 hover:bg-[#FF3D00]/10 transition-all cursor-pointer"
              title="View public novel page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Novel on Site</span>
            </button>
          )}
        </div>

        {/* Selected Novel Context Pill */}
        {targetNovel && (
          <div className="flex items-center gap-3 bg-[#141414] border border-[#262626] p-3">
            <div className="w-8 h-11 bg-[#1a1a1a] border border-[#333] overflow-hidden flex-shrink-0 flex items-center justify-center">
              {targetNovel.coverImage ? (
                <img src={targetNovel.coverImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-3.5 h-3.5 text-[#555]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black text-white truncate">{targetNovel.title}</h4>
              <p className="text-[10px] text-[#737373] truncate">
                Author: <strong className="text-[#A3A3A3]">{targetNovel.author}</strong> &bull; Total Volumes: <strong className="text-white">{targetNovel.volumes.length}</strong> &bull; Total Chapters: <strong className="text-[#FF3D00]">{targetNovel.volumes.reduce((a, v) => a + v.chapters.length, 0)}</strong>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Volume Section */}
      {targetNovel && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-tight">
              <BookOpen className="w-4 h-4 text-[#FF3D00] inline mr-1.5" />
              Volume Management
            </h3>
            <button
              onClick={() => setShowNewVolume(!showNewVolume)}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF3D00] hover:text-white bg-transparent border border-[#FF3D00]/30 hover:border-[#FF3D00] px-3 py-1.5 cursor-pointer transition-colors uppercase"
            >
              <FolderPlus className="w-3 h-3" />
              Add Volume
            </button>
          </div>

          {/* New Volume Form */}
          {showNewVolume && (
            <form onSubmit={handleCreateVolume} className="flex gap-2 items-end border border-[#262626] bg-[#0A0A0A] p-3">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] text-[#737373] uppercase font-bold block">Volume Title</label>
                <input
                  type="text"
                  value={newVolumeTitle}
                  onChange={(e) => setNewVolumeTitle(e.target.value)}
                  placeholder="e.g. Volume 02: The Rising Storm"
                  className="w-full bg-[#151515] border border-[#262626] p-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#FF3D00] rounded-none"
                />
              </div>
              <button
                type="submit"
                disabled={isCreatingVolume}
                className="bg-[#FF3D00] text-[#0A0A0A] font-bold px-4 py-2.5 text-[10px] uppercase cursor-pointer border-none hover:bg-white transition-colors disabled:opacity-50"
              >
                {isCreatingVolume ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowNewVolume(false); setNewVolumeTitle(''); }}
                className="text-[#737373] hover:text-white border border-[#262626] px-3 py-2.5 bg-transparent cursor-pointer text-[10px] uppercase font-bold"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Volume Tabs */}
          {volumes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {volumes.map(vol => (
                <div key={vol.id} className="flex items-center gap-0">
                  <button
                    onClick={() => { setSelectedVolumeId(vol.id); setChapterSearch(''); }}
                    className={`px-3 py-2 text-[10px] font-bold uppercase border cursor-pointer transition-colors ${
                      selectedVolumeId === vol.id
                        ? 'bg-[#FF3D00] text-[#0A0A0A] border-[#FF3D00]'
                        : 'bg-transparent text-[#737373] border-[#262626] hover:border-[#FF3D00] hover:text-white'
                    }`}
                  >
                    Vol {vol.volumeNumber} ({vol.chapterCount})
                  </button>
                  <button
                    onClick={() => handleDeleteVolume(vol.id)}
                    className="px-1.5 py-2 text-[#737373] hover:text-red-400 border border-l-0 border-[#262626] bg-transparent cursor-pointer transition-colors"
                    title={`Delete ${vol.title}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#737373] text-center py-4">No volumes yet. Create one to start adding chapters.</p>
          )}
        </div>
      )}

      {/* Chapter Section Header & Search */}
      {selectedVolumeId && (
        <div className="border-t border-[#262626] pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight">
                Chapters in: <span className="text-[#FF3D00]">{volumes.find(v => v.id === selectedVolumeId)?.title}</span>
              </h3>
              <span className="text-[10px] text-[#737373]">
                {filteredChapters.length} chapter{filteredChapters.length !== 1 ? 's' : ''} in this volume
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Chapter Search Filter */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#737373]" />
                <input
                  type="text"
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  placeholder="Filter chapters..."
                  className="bg-[#151515] border border-[#262626] pl-7 pr-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#FF3D00] rounded-none placeholder:text-[#444] w-36 sm:w-48"
                />
              </div>

              <button
                onClick={() => handleOpenChapterEditor('create')}
                className="inline-flex items-center gap-1.5 bg-[#FF3D00] text-[#0A0A0A] font-mono text-xs font-black py-2 px-4 uppercase hover:bg-white transition-colors cursor-pointer border-none flex-shrink-0 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Chapter</span>
              </button>
            </div>
          </div>

          {/* Chapters Table */}
          <div className="overflow-x-auto w-full border border-[#262626]">
            <table className="w-full min-w-[650px] text-left text-xs font-mono text-[#FAFAFA] border-collapse">
              <thead>
                <tr className="bg-[#0A0A0A] border-b border-[#262626] text-[#737373] uppercase text-[10px] tracking-widest">
                  <th className="px-4 py-3 font-bold">Chapter Title</th>
                  <th className="px-4 py-3 font-bold text-center">Status / Price</th>
                  <th className="px-4 py-3 font-bold text-center">Words</th>
                  <th className="px-4 py-3 font-bold">Release Date</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {filteredChapters.length > 0 ? (
                  filteredChapters.map((chap) => {
                    const words = getWordCount(chap.content);
                    return (
                      <tr key={chap.id} className="bg-[#0F0F0F] hover:bg-[#151515] transition-colors group">
                        <td className="px-4 py-3 font-bold text-white group-hover:text-[#FF3D00] transition-colors">
                          {chap.title}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {chap.isLocked ? (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono inline-flex items-center gap-1 font-bold">
                              <Lock className="w-3 h-3" /> {chap.coinPrice || 5} Coins
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-mono inline-flex items-center gap-1">
                              FREE
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-[#737373]">
                          ~{words.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-[#737373]">
                          {new Date(chap.publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Preview in Reader */}
                            <button
                              onClick={() => handlePreviewChapter(chap)}
                              className="p-1.5 text-[#737373] hover:text-[#FF3D00] hover:bg-[#1a1a1a] transition-all border-none bg-transparent cursor-pointer"
                              title="Preview in Reader"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Chapter */}
                            <button 
                              onClick={() => handleOpenChapterEditor('edit', chap)}
                              className="p-1.5 text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-all border-none bg-transparent cursor-pointer"
                              title="Edit Chapter"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Chapter */}
                            <button 
                              onClick={() => handleDeleteChapter(chap.id)}
                              className="p-1.5 text-[#737373] hover:text-red-400 hover:bg-red-500/10 transition-all border-none bg-transparent cursor-pointer"
                              title="Delete Chapter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#737373]">
                      {chapterSearch ? 'No chapters match your search.' : 'No chapters in this volume yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageChaptersTab;
