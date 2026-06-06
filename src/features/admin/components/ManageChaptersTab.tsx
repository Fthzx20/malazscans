import React, { useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { useNovelStore } from '../../novels/store/novelStore';
import { getFlatChapters } from '../../novels/utils';
import { Chapter } from '../../../types';

interface ManageChaptersTabProps {
  handleDeleteChapter: (chapterId: string) => void;
}

export const ManageChaptersTab: React.FC<ManageChaptersTabProps> = ({ handleDeleteChapter }) => {
  const novels = useNovelStore((state) => state.novels);
  
  const {
    selectedAdminNovelId,
    setSelectedAdminNovelId,
    setActiveEditorMode,
    setEditingChapterId,
    setAdminChapTitle,
    setAdminChapContent,
    resetChapterForm
  } = useAdminStore();

  // Initialize selectedAdminNovelId to first novel on load if empty
  useEffect(() => {
    if (!selectedAdminNovelId && novels.length > 0) {
      setSelectedAdminNovelId(novels[0].id);
    }
  }, [novels, selectedAdminNovelId, setSelectedAdminNovelId]);

  const targetNovel = novels.find(n => n.id === selectedAdminNovelId) || null;
  const flatChapters = getFlatChapters(targetNovel);

  const handleOpenChapterEditor = (mode: 'create' | 'edit', chapter?: Chapter) => {
    if (mode === 'create') {
      resetChapterForm();
      setActiveEditorMode('create');
    } else if (mode === 'edit' && chapter) {
      setEditingChapterId(chapter.id);
      // Strip "Chapter X: " or "Bab X: " prefix from title to keep editing clean
      const cleanedTitle = chapter.title.replace(/^(Chapter|Bab) \d+:\s*/i, '');
      setAdminChapTitle(cleanedTitle);
      setAdminChapContent(chapter.content);
      setActiveEditorMode('edit');
    }
  };

  return (
    <div className="border border-[#262626] bg-[#0F0F0F] p-6 space-y-6 text-white text-xs font-mono">
      
      {/* Novel Selector Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div className="space-y-1.5 w-full sm:max-w-md">
          <label className="text-[10px] text-[#737373] uppercase font-bold block">Select Target Novel</label>
          <select 
            value={selectedAdminNovelId}
            onChange={(e) => setSelectedAdminNovelId(e.target.value)}
            className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00] rounded-none font-mono text-xs font-bold uppercase cursor-pointer"
          >
            {novels.map(n => (
              <option key={n.id} value={n.id}>{n.title}</option>
            ))}
          </select>
        </div>

        {/* Dedicated Create Chapter Action Button */}
        <button
          onClick={() => handleOpenChapterEditor('create')}
          className="inline-flex items-center gap-1.5 bg-[#FF3D00] text-[#0A0A0A] font-mono text-xs font-black py-3 px-6 uppercase hover:bg-white transition-colors self-end rounded-none cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" />
          <span>Create Chapter</span>
        </button>
      </div>

      {/* Chapters List Table */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-tight text-white">
          Chapters List for: <span className="text-[#FF3D00]">{targetNovel?.title}</span>
        </h3>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[600px] text-left text-xs font-mono text-[#FAFAFA]">
            <thead>
              <tr className="border-b border-[#262626] text-[#737373] uppercase">
                <th className="pb-3">Volume</th>
                <th className="pb-3">Chapter Title</th>
                <th className="pb-3">Release Date</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/40">
              {flatChapters.length > 0 ? (
                flatChapters.map((chap) => (
                  <tr key={chap.id} className="hover:bg-[#151515] transition-colors">
                    <td className="py-3.5 text-white font-bold">{chap.volumeTitle}</td>
                    <td className="py-3.5 text-[#FF3D00] font-black">{chap.title}</td>
                    <td className="py-3.5 text-[#737373]">{new Date(chap.publishDate).toLocaleDateString('en-US')}</td>
                    <td className="py-3.5 text-right space-x-3 text-current">
                      <button 
                        onClick={() => handleOpenChapterEditor('edit', chap)}
                        className="text-white hover:text-[#FF3D00] inline-flex items-center gap-1 underline font-bold bg-transparent border-none cursor-pointer"
                        title="Open Editor"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Open Editor</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteChapter(chap.id)}
                        className="text-red-500 hover:text-red-400 inline-flex items-center gap-1 underline font-bold bg-transparent border-none cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#737373] font-bold">
                    No chapters released for this novel. Click "Create Chapter" to write.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ManageChaptersTab;
