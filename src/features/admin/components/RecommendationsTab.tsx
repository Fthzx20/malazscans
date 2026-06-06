import React, { useState, useEffect } from 'react';
import { Plus, ArrowUp, ArrowDown, Trash2, Star, Bookmark } from 'lucide-react';
import { useNovelStore } from '../../novels/store/novelStore';
import { recommendationRepository } from '../../../repositories';
import { Recommendation } from '../../../types';

export const RecommendationsTab: React.FC = () => {
  const novels = useNovelStore((state) => state.novels);
  const triggerToast = useNovelStore((state) => state.triggerToast);
  const [recs, setRecs] = useState<Recommendation[]>([]);

  // Selected inputs
  const [selectedNovelId, setSelectedNovelId] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    const data = recommendationRepository.getAll();
    setTimeout(() => {
      setRecs(data);
      if (novels.length > 0) {
        setSelectedNovelId(novels[0].id);
      }
    }, 0);
  }, [novels]);

  const saveRecommendationsState = (updatedRecs: Recommendation[]) => {
    setRecs(updatedRecs);
    recommendationRepository.save(updatedRecs);
  };

  const handleAddRec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNovelId) return;

    // Check if already recommended
    if (recs.find(r => r.novelId === selectedNovelId)) {
      triggerToast("This novel is already recommended.");
      return;
    }

    const newRec: Recommendation = {
      id: `rec-${Date.now()}`,
      novelId: selectedNovelId,
      order: recs.length + 1,
      isPinned,
      isFeatured,
      addedDate: new Date().toISOString().split('T')[0]
    };

    const updated = [...recs, newRec];
    saveRecommendationsState(updated);
    triggerToast("Recommendation added successfully.");
    setIsPinned(false);
    setIsFeatured(false);
  };

  const handleRemoveRec = (id: string) => {
    const updated = recs.filter(r => r.id !== id).map((r, idx) => ({
      ...r,
      order: idx + 1 // Re-normalize order
    }));
    saveRecommendationsState(updated);
    triggerToast("Recommendation removed.");
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === recs.length - 1) return;

    const swapWith = direction === 'up' ? index - 1 : index + 1;
    const updated = [...recs];
    
    // Swap order numbers
    const tempOrder = updated[index].order;
    updated[index].order = updated[swapWith].order;
    updated[swapWith].order = tempOrder;

    // Swap elements in list
    const tempItem = updated[index];
    updated[index] = updated[swapWith];
    updated[swapWith] = tempItem;

    saveRecommendationsState(updated);
  };

  const handleToggleFlag = (id: string, field: 'isPinned' | 'isFeatured') => {
    const updated = recs.map(r => {
      if (r.id === id) {
        return { ...r, [field]: !r[field] };
      }
      return r;
    });
    saveRecommendationsState(updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-xs font-mono text-white">
      {/* Left Form: Add Recommendation */}
      <div className="lg:col-span-4 border border-[#262626] bg-[#0F0F0F] p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#262626] pb-3 text-white">
          <Plus className="w-5 h-5 text-[#FF3D00]" />
          <h3 className="text-base font-black uppercase tracking-tight">Add Recommendation</h3>
        </div>

        <form onSubmit={handleAddRec} className="space-y-4 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#737373] uppercase font-bold block">Select Novel</label>
            <select
              value={selectedNovelId}
              onChange={(e) => setSelectedNovelId(e.target.value)}
              className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00] rounded-none uppercase font-bold"
            >
              {novels.map(n => (
                <option key={n.id} value={n.id}>{n.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="pin_rec"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
              />
              <label htmlFor="pin_rec" className="ml-2 text-white font-bold cursor-pointer select-none">Pin Recommendation</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="feature_rec"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
              />
              <label htmlFor="feature_rec" className="ml-2 text-white font-bold cursor-pointer select-none">Feature on Carousel</label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#FF3D00] text-[#0A0A0A] font-black py-3 uppercase hover:bg-white transition-colors cursor-pointer border-none"
          >
            Create Recommendation
          </button>
        </form>
      </div>

      {/* Right List: Table of recommendations */}
      <div className="lg:col-span-8 border border-[#262626] bg-[#0F0F0F] p-6 space-y-4">
        <h3 className="text-base font-black uppercase tracking-tight border-b border-[#262626] pb-3">Recommendations Catalogue</h3>
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[500px] text-left text-xs font-mono text-[#FAFAFA]">
            <thead>
              <tr className="border-b border-[#262626] text-[#737373] uppercase">
                <th className="pb-3">Order</th>
                <th className="pb-3">Novel Title</th>
                <th className="pb-3 text-center">Pinned</th>
                <th className="pb-3 text-center">Featured</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/40">
              {recs.length > 0 ? (
                recs.map((rec, index) => {
                  const novel = novels.find(n => n.id === rec.novelId);
                  return (
                    <tr key={rec.id} className="hover:bg-[#151515] transition-colors">
                      <td className="py-3.5 text-[#FF3D00] font-black">{rec.order}</td>
                      <td className="py-3.5 font-bold text-white max-w-[200px] truncate">
                        {novel ? novel.title : 'Deleted Novel'}
                      </td>
                      <td className="py-3.5 text-center">
                        <button
                          onClick={() => handleToggleFlag(rec.id, 'isPinned')}
                          className="bg-transparent border-none cursor-pointer"
                        >
                          <Bookmark className={`w-4 h-4 mx-auto ${rec.isPinned ? 'text-[#FF3D00] fill-[#FF3D00]' : 'text-[#737373]'}`} />
                        </button>
                      </td>
                      <td className="py-3.5 text-center">
                        <button
                          onClick={() => handleToggleFlag(rec.id, 'isFeatured')}
                          className="bg-transparent border-none cursor-pointer"
                        >
                          <Star className={`w-4 h-4 mx-auto ${rec.isFeatured ? 'text-[#FF3D00] fill-[#FF3D00]' : 'text-[#737373]'}`} />
                        </button>
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleMoveOrder(index, 'up')}
                          disabled={index === 0}
                          className={`p-1 bg-transparent border-none cursor-pointer ${index === 0 ? 'text-[#333] cursor-not-allowed' : 'text-white hover:text-[#FF3D00]'}`}
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(index, 'down')}
                          disabled={index === recs.length - 1}
                          className={`p-1 bg-transparent border-none cursor-pointer ${index === recs.length - 1 ? 'text-[#333] cursor-not-allowed' : 'text-white hover:text-[#FF3D00]'}`}
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveRec(rec.id)}
                          className="text-red-500 hover:text-red-400 p-1 bg-transparent border-none cursor-pointer"
                          title="Delete Recommendation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#737373]">
                    No recommendations registered. Select a novel on the left to recommend it.
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

export default RecommendationsTab;
