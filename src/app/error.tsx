"use client";

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home, Terminal } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client runtime errors for diagnostics
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] text-[#FAFAFA] p-4 sm:p-6 text-center font-mono select-none relative overflow-hidden">
      {/* Background Grid Accent */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none" 
        style={{
          backgroundImage: 'linear-gradient(#FAFAFA 1px, transparent 1px), linear-gradient(90deg, #FAFAFA 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="max-w-md w-full border-2 border-[#262626] bg-[#0F0F10] p-6 sm:p-8 space-y-6 relative shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-3 text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#FF3D00]" />
            <span className="font-bold uppercase tracking-wider text-zinc-400">SYS_FAULT // 500</span>
          </div>
          <span className="text-[10px] text-[#FF3D00] font-black uppercase tracking-widest animate-pulse">
            INTERRUPT DETECTED
          </span>
        </div>

        <div className="w-12 h-12 bg-[#FF3D00]/10 text-[#FF3D00] flex items-center justify-center mx-auto border border-[#FF3D00]/30">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] text-[#FF3D00] font-black uppercase tracking-widest block">
            Execution Interrupted
          </span>
          <h2 className="text-xl sm:text-2xl font-black font-sans uppercase tracking-tight text-white">
            System Fault Occurred
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
            An unexpected runtime error interrupted the interface pipeline. You can attempt a hot reload or return to the main catalog.
          </p>
          
          {/* Telemetry Digest */}
          <div className="bg-[#050505] border border-zinc-800 p-3 text-left font-mono space-y-1 text-[11px]">
            <div className="flex justify-between text-zinc-500">
              <span>ERR_DIGEST</span>
              <span className="text-zinc-300 font-bold">{error?.digest || '0xUNKNOWN_FAULT'}</span>
            </div>
            {error?.message && process.env.NODE_ENV !== 'production' && (
              <div className="pt-2 border-t border-zinc-900 text-red-400 text-[10px] overflow-x-auto max-h-24 leading-snug">
                {error.message}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 bg-[#FF3D00] text-[#0A0A0A] font-bold py-3 px-4 text-xs uppercase hover:bg-white transition-colors cursor-pointer border-none flex items-center justify-center gap-2 font-mono tracking-wider"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Re-initialize</span>
          </button>
          <a
            href="/"
            className="flex-1 border border-zinc-700 text-white font-bold py-3 px-4 text-xs uppercase hover:border-[#FF3D00] hover:text-[#FF3D00] transition-colors cursor-pointer flex items-center justify-center gap-2 font-mono no-underline tracking-wider"
          >
            <Home className="w-4 h-4" />
            <span>Return to Grid</span>
          </a>
        </div>
      </div>
    </div>
  );
}
