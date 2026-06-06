import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { Novel } from '../../../types';
import { useNovelStore } from '../../novels/store/novelStore';
import { useReaderSettings } from '../hooks/useReaderSettings';
import { useHistory } from '../../library/hooks/useHistory';
import { getThemeStyles } from '../utils/theme';

interface ReaderToolbarProps {
  novel: Novel;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({ novel }) => {
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    readerSettings,
    setReaderSettings
  } = useReaderSettings();
  const { clearReadChapters } = useHistory();

  const themeStyles = getThemeStyles(readerSettings.theme);

  const handleBack = () => {
    setCurrentPage('detail');
  };

  const handleClearProgress = () => {
    clearReadChapters();
    useNovelStore.getState().triggerToast("Reading history cleared.");
  };

  return (
    <>
      {/* Reader Top Bar */}
      <div className={`sticky top-16 z-30 border-b ${themeStyles.border} ${themeStyles.headerBg} py-3 transition-colors duration-200 text-current`}>
        <div className="max-w-3xl mx-auto px-4 flex justify-between items-center gap-4">
          
          <button 
            onClick={handleBack}
            className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#737373] hover:text-[#FF3D00] truncate max-w-[200px] bg-transparent border-none cursor-pointer text-current"
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{novel.title}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 border border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/5 hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Aa Text Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Control Drawer */}
      {isSettingsOpen && (
        <div className={`border-b ${themeStyles.border} ${themeStyles.cardBg} py-4 transition-all text-current`}>
          <div className="max-w-xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Font Family Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-[#737373] font-bold block uppercase font-sans">Font Style</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setReaderSettings({ fontFamily: 'font-serif' })}
                  className={`flex-1 py-1.5 border text-xs font-mono cursor-pointer transition-colors bg-transparent ${readerSettings.fontFamily === 'font-serif' ? 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/10' : 'border-[#262626] text-current'}`}
                >
                  SERIF
                </button>
                <button 
                  onClick={() => setReaderSettings({ fontFamily: 'font-sans' })}
                  className={`flex-1 py-1.5 border text-xs font-mono cursor-pointer transition-colors bg-transparent ${readerSettings.fontFamily === 'font-sans' ? 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/10' : 'border-[#262626] text-current'}`}
                >
                  SANS
                </button>
              </div>
            </div>

            {/* Font Size Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-[#737373] font-bold block uppercase font-sans">Size</span>
              <div className="flex gap-1">
                {['text-base', 'text-lg', 'text-xl'].map((sz) => (
                  <button 
                    key={sz}
                    onClick={() => setReaderSettings({ fontSize: sz })}
                    className={`flex-1 py-1.5 border text-[10px] font-mono uppercase cursor-pointer transition-colors bg-transparent ${readerSettings.fontSize === sz ? 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/10' : 'border-[#262626] text-current'}`}
                  >
                    {sz.replace('text-', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-[#737373] font-bold block uppercase font-sans">Theme</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { key: 'light', label: 'LIGHT' },
                  { key: 'dark', label: 'DARK' },
                  { key: 'sepia', label: 'SEPIA' },
                  { key: 'amoled', label: 'AMOLED' }
                ].map((t) => (
                  <button 
                    key={t.key}
                    onClick={() => setReaderSettings({ theme: t.key as any })}
                    className={`flex-1 py-1 px-1.5 border text-[9px] font-mono cursor-pointer transition-colors bg-transparent ${readerSettings.theme === t.key ? 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/10' : 'border-[#262626] text-current'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
          
          {/* Reset Progress Action in Drawer */}
          <div className="max-w-xl mx-auto px-4 pt-4 border-t border-[#262626] flex justify-end">
            <button
              onClick={handleClearProgress}
              className="text-[9px] font-mono uppercase bg-[#FF3D00]/10 text-[#FF3D00] border border-[#FF3D00]/30 hover:bg-[#FF3D00] hover:text-[#0A0A0A] px-3 py-1.5 transition-all active:scale-95 font-bold cursor-pointer"
            >
              Clear Reading History
            </button>
          </div>

          <div className="text-center pt-3">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="text-[10px] font-mono uppercase text-[#737373] hover:text-[#FF3D00] bg-transparent border-none cursor-pointer"
            >
              Close Settings &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ReaderToolbar;
