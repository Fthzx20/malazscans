import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0A] text-[#FAFAFA] min-h-screen font-mono text-center p-6 space-y-4">
      <h1 className="text-4xl font-black text-[#FF3D00] tracking-tighter animate-pulse">404 : NOT FOUND</h1>
      <p className="text-xs uppercase text-[#737373] max-w-xs leading-relaxed">
        The page or manuscript release you are looking for cannot be found in our directory.
      </p>
      <Link 
        href="/"
        className="inline-block border border-white hover:border-[#FF3D00] hover:text-[#FF3D00] text-xs font-bold py-2.5 px-6 uppercase transition-colors text-white"
      >
        Back to Home
      </Link>
    </div>
  );
}
