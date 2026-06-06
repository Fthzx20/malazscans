import React from 'react';
import { Novel } from '../../../types';
import { NovelCard } from './NovelCard';

import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';

interface NovelGridProps {
  novels: Novel[];
}

export const NovelGrid: React.FC<NovelGridProps> = ({ novels }) => {
  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  if (novels.length === 0) {
    return (
      <div className={`col-span-full border border-dashed py-16 text-center text-xs font-mono ${themeStyles.border} ${themeStyles.accentText}`}>
        No data yet / No novels found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {novels.map((novel) => (
        <NovelCard key={novel.id} novel={novel} variant="browse" />
      ))}
    </div>
  );
};
export default NovelGrid;
