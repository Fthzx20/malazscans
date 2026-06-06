import React from 'react';
import { BookOpen, User, FileText, BarChart2 } from 'lucide-react';
import { useNovelStore } from '../../novels/store/novelStore';
import { getFlatChapters } from '../../novels/utils';

export const MetricsTab: React.FC = () => {
  const novels = useNovelStore((state) => state.novels);

  const totalChapters = novels.reduce((acc, n) => acc + getFlatChapters(n).length, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="border border-[#262626] p-4 bg-[#0F0F0F] space-y-1">
        <div className="flex items-center justify-between text-[#737373]">
          <span className="text-[10px] font-mono uppercase font-bold">TOTAL NOVEL</span>
          <BookOpen className="w-4 h-4 text-[#FF3D00]" />
        </div>
        <p className="text-2xl font-black text-white">{novels.length}</p>
        <span className="text-[9px] text-[#737373] block">Judul Terdaftar di Sistem</span>
      </div>

      <div className="border border-[#262626] p-4 bg-[#0F0F0F] space-y-1">
        <div className="flex items-center justify-between text-[#737373]">
          <span className="text-[10px] font-mono uppercase font-bold">PEMBACA AKTIF</span>
          <User className="w-4 h-4 text-[#FF3D00]" />
        </div>
        <p className="text-2xl font-black text-white">48,450</p>
        <span className="text-[9px] text-[#FF3D00] font-bold block">+12% Bulan Ini</span>
      </div>

      <div className="border border-[#262626] p-4 bg-[#0F0F0F] space-y-1">
        <div className="flex items-center justify-between text-[#737373]">
          <span className="text-[10px] font-mono uppercase font-bold">BAB TERBIT</span>
          <FileText className="w-4 h-4 text-[#FF3D00]" />
        </div>
        <p className="text-2xl font-black text-white">{totalChapters}</p>
        <span className="text-[9px] text-[#737373] block">Translasi Selesai</span>
      </div>

      <div className="border border-[#262626] p-4 bg-[#0F0F0F] space-y-1">
        <div className="flex items-center justify-between text-[#737373]">
          <span className="text-[10px] font-mono uppercase font-bold">ESTIMASI KONTRIBUSI</span>
          <BarChart2 className="w-4 h-4 text-[#FF3D00]" />
        </div>
        <p className="text-2xl font-black text-white">Rp 4.9M</p>
        <span className="text-[9px] text-green-500 font-bold block">VIP Pendapatan</span>
      </div>
    </div>
  );
};
export default MetricsTab;
