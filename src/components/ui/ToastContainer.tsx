"use client";

import React from 'react';
import { X, Info } from 'lucide-react';
import { useNovelStore } from '../../features/novels/store/novelStore';
import { useReaderStore } from '../../features/reader/store/readerStore';
import { getThemeStyles } from '../../features/reader/utils/theme';

export const ToastContainer: React.FC = () => {
  const toastMessage = useNovelStore((state) => state.toastMessage);
  const clearToast = useNovelStore((state) => state.clearToast);
  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  if (!toastMessage) return null;

  return (
    <div 
      className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-auto pointer-events-none transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-5"
      role="status"
      aria-live="polite"
    >
      <div 
        className={`pointer-events-auto border-2 border-[#FF3D00] ${themeStyles.cardBg} ${themeStyles.text} p-3.5 sm:p-4 shadow-2xl flex items-start gap-3 select-none backdrop-blur-md`}
      >
        <div className="p-1 bg-[#FF3D00]/10 text-[#FF3D00] flex-shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 pr-2">
          <span className="text-[10px] font-mono text-[#FF3D00] font-black uppercase tracking-wider block">
            System Notice
          </span>
          <p className="text-xs sm:text-sm font-mono leading-snug mt-0.5 text-current break-words">
            {toastMessage}
          </p>
        </div>
        <button
          onClick={clearToast}
          className="text-current/60 hover:text-[#FF3D00] p-1 transition-colors bg-transparent border-none cursor-pointer flex-shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ToastContainer;
