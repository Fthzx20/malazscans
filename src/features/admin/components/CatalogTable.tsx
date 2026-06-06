import React from 'react';
import { Novel } from '../../../types';
import { useNovelStore } from '../../novels/store/novelStore';

interface CatalogTableProps {
  novels: Novel[];
  getFlatChapters: (novel: Novel) => any[];
}

export const CatalogTable: React.FC<CatalogTableProps> = ({ novels, getFlatChapters }) => {
  const setSelectedNovel = useNovelStore((state) => state.setSelectedNovel);
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);

  const handleViewDetail = (novel: Novel) => {
    setSelectedNovel(novel);
    setCurrentPage('detail');
  };

  return (
    <div className="border border-[#262626] bg-[#0F0F0F] p-6 space-y-4">
      <h3 className="text-base font-black uppercase tracking-tight text-white">Katalog Manajemen</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono text-[#FAFAFA]">
          <thead>
            <tr className="border-b border-[#262626] text-[#737373] uppercase">
              <th className="pb-3">Judul Novel</th>
              <th className="pb-3">Genre</th>
              <th className="pb-3">Author</th>
              <th className="pb-3">Jumlah Bab</th>
              <th className="pb-3 text-right">Opsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626]/40">
            {novels.map((n) => (
              <tr key={n.id} className="hover:bg-[#151515]">
                <td className="py-3.5 font-bold text-white">{n.title}</td>
                <td className="py-3.5 text-[#FF3D00]">{n.genres.join(', ')}</td>
                <td className="py-3.5">{n.author}</td>
                <td className="py-3.5">{getFlatChapters(n).length} Bab</td>
                <td className="py-3.5 text-right">
                  <button 
                    onClick={() => handleViewDetail(n)} 
                    className="text-white hover:text-[#FF3D00] underline bg-transparent border-none cursor-pointer"
                  >
                    Lihat Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default CatalogTable;
