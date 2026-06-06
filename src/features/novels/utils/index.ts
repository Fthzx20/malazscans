import { Novel, Chapter } from '../../../types';

export const getFlatChapters = (novel: Novel | null): (Chapter & { volumeTitle: string })[] => {
  if (!novel) return [];
  const flat: (Chapter & { volumeTitle: string })[] = [];
  novel.volumes.forEach((vol) => {
    vol.chapters.forEach((chap) => {
      flat.push({ ...chap, volumeTitle: vol.title });
    });
  });
  return flat;
};

export const getRelativeTime = (isoString: string): string => {
  const past = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${diffDays} hari lalu`;
};
