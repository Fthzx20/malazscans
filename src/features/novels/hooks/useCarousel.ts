import { useEffect, useState, useCallback } from 'react';
import { useNovelStore } from '../store/novelStore';
import { Novel } from '../../../types';

export const useCarousel = (recommendedNovels: Novel[]) => {
  const carouselIndex = useNovelStore((state) => state.carouselIndex);
  const setCarouselIndex = useNovelStore((state) => state.setCarouselIndex);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (recommendedNovels.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setCarouselIndex((prev) => (prev + 1) % recommendedNovels.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [recommendedNovels.length, isPaused, setCarouselIndex]);

  const selectIndex = useCallback((index: number) => {
    setCarouselIndex(index);
  }, [setCarouselIndex]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  return {
    carouselIndex,
    selectIndex,
    pause,
    resume,
    isPaused,
  };
};
export default useCarousel;
