import { useEffect } from 'react';
import { useNovelStore } from '../store/novelStore';
import { Novel } from '../../../types';

export const useCarousel = (recommendedNovels: Novel[]) => {
  const carouselIndex = useNovelStore((state) => state.carouselIndex);
  const setCarouselIndex = useNovelStore((state) => state.setCarouselIndex);

  useEffect(() => {
    if (recommendedNovels.length === 0) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % recommendedNovels.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [recommendedNovels.length, setCarouselIndex]);

  const selectIndex = (index: number) => {
    setCarouselIndex(index);
  };

  return {
    carouselIndex,
    selectIndex,
  };
};
export default useCarousel;
