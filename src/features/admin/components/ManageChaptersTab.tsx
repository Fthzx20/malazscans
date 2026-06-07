import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, FolderPlus, BookOpen } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { useNovelStore } from '../../novels/store/novelStore';
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
    resetChapterForm
  } = useAdminStore();

  const [volumes, setVolumes] = useState<VolumeInfo[]>([]);
  const [showNewVolume, setShowNewVolume] = useState(false);
  const [newVolumeTitle, setNewVolumeTitle] = useState('');
  const [isCreatingVolume, setIsCreatingVolume] = useState(false);

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
      setActiveEditorMode('edit');
    }
  };

  return (
    <div className="border border-[#262626] bg-[#0F0F0F] p-6 space-y-6 text-white text-xs font-mono">
      
      {/* Novel Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 border-b border-[#262626] pb-4">
        <div className="space-y-1.5 w-full sm:max-w-md">
          <label className="text-[10px] text-[#737373] uppercase font-bold block">Target Novel</label>
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
      </div>

      {/* Volume Section */}
      {targetNovel && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-tight">
              <BookOpen className="w-4 h-4 text-[#FF3D00] inline mr-1.5" />
              Volumes
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
                    onClick={() => setSelectedVolumeId(vol.id)}
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

      {/* Chapter Create Button */}
      {selectedVolumeId && (
        <div className="flex items-center justify-between border-t border-[#262626] pt-4">
          <h3 className="text-sm font-black uppercase tracking-tight">
            Chapters in: <span className="text-[#FF3D00]">{volumes.find(v => v.id === selectedVolumeId)?.title}</span>
          </h3>
          <button
            onClick={() => handleOpenChapterEditor('create')}
            className="inline-flex items-center gap-1.5 bg-[#FF3D00] text-[#0A0A0A] font-mono text-xs font-black py-2.5 px-5 uppercase hover:bg-white transition-colors cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            Create Chapter
          </button>
        </div>
      )}

      {/* Chapters Table */}
      {selectedVolumeId && (
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[500px] text-left text-xs font-mono text-[#FAFAFA]">
            <thead>
              <tr className="border-b border-[#262626] text-[#737373] uppercase text-[10px]">
                <th className="pb-3">Chapter Title</th>
                <th className="pb-3">Release Date</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/40">
              {chaptersForVolume.length > 0 ? (
                chaptersForVolume.map((chap) => (
                  <tr key={chap.id} className="hover:bg-[#151515] transition-colors">
                    <td className="py-3.5 text-[#FF3D00] font-bold">{chap.title}</td>
                    <td className="py-3.5 text-[#737373]">{new Date(chap.publishDate).toLocaleDateString('en-US')}</td>
                    <td className="py-3.5 text-right space-x-3">
                      <button 
                        onClick={() => handleOpenChapterEditor('edit', chap)}
                        className="text-white hover:text-[#FF3D00] inline-flex items-center gap-1 font-bold bg-transparent border-none cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteChapter(chap.id)}
                        className="text-red-500 hover:text-red-400 inline-flex items-center gap-1 font-bold bg-transparent border-none cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-[#737373]">
                    No chapters in this volume yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageChaptersTab;
