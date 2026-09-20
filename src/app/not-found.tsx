import React from 'react';
import Link from 'next/link';
import { Compass, Home, Terminal, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] font-mono flex items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Ambient background grid lines */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none" 
        style={{
          backgroundImage: 'linear-gradient(#FAFAFA 1px, transparent 1px), linear-gradient(90deg, #FAFAFA 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="max-w-md w-full border-2 border-[#262626] bg-[#0F0F10] p-6 sm:p-8 space-y-6 relative shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10">
        
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-3 text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#FF3D00]" />
            <span className="font-bold uppercase tracking-wider text-zinc-400">SYS_ERR // 404</span>
          </div>
          <span className="text-[10px] text-[#FF3D00] font-black uppercase tracking-widest animate-pulse">
            SIGNAL LOST
          </span>
        </div>

        {/* Hero 404 Display */}
        <div className="text-center space-y-2 py-4">
          <div className="inline-block px-3 py-1 bg-[#FF3D00]/10 border border-[#FF3D00]/30 text-[#FF3D00] text-[10px] font-black uppercase tracking-widest mb-2">
            Target Unreachable
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tighter uppercase font-sans">
            4<span className="text-[#FF3D00]">0</span>4
          </h1>
          <p className="text-xs uppercase text-zinc-400 font-bold tracking-wider">
            Sector Unmapped &bull; Manuscript Not Found
          </p>
        </div>

        {/* Diagnostic Telemetry Block */}
        <div className="bg-[#050505] border border-zinc-800 p-3.5 text-[11px] space-y-1.5 text-zinc-400">
          <div className="flex justify-between border-b border-zinc-900 pb-1">
            <span className="text-zinc-600">ERROR_CODE</span>
            <span className="text-[#FF3D00] font-bold">404_PAGE_NOT_FOUND</span>
          </div>
          <div className="flex justify-between border-b border-zinc-900 pb-1">
            <span className="text-zinc-600">GRID_SECTOR</span>
            <span className="text-zinc-300">MALAZ_CORE_0x00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">DIAGNOSIS</span>
            <span className="text-zinc-300">BROKEN_LINK_OR_MOVED</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/"
            className="flex-1 bg-[#FF3D00] text-[#0A0A0A] font-bold py-3 px-4 text-xs uppercase hover:bg-white transition-colors cursor-pointer border-none flex items-center justify-center gap-2 no-underline tracking-wider font-mono text-center"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>Return to Grid</span>
          </Link>
          <Link
            href="/browse"
            className="flex-1 border border-zinc-700 text-white font-bold py-3 px-4 text-xs uppercase hover:border-[#FF3D00] hover:text-[#FF3D00] transition-colors cursor-pointer flex items-center justify-center gap-2 no-underline tracking-wider font-mono text-center"
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>Browse Library</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
