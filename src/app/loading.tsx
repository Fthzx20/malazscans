import React from 'react';

export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0A0A0A] text-[#FAFAFA] min-h-screen font-mono text-xs uppercase tracking-widest">
      <span className="w-2.5 h-2.5 bg-[#FF3D00] animate-ping mr-2"></span>
      <span>Memuat data...</span>
    </div>
  );
}
