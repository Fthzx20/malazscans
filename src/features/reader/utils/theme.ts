import { ReaderSettings } from '../../../types';

export const getThemeStyles = (theme: ReaderSettings['theme']) => {
  switch (theme) {
    case 'light':
      return {
        bg: 'bg-[#FAFAFA]',
        text: 'text-[#0A0A0A]',
        border: 'border-[#E5E5E5]',
        cardBg: 'bg-[#F5F5F5]',
        accentText: 'text-[#737373]',
        headerBg: 'bg-[#FAFAFA]/95',
        footerBg: 'bg-[#FAFAFA]',
      };
    case 'sepia':
      return {
        bg: 'bg-[#F4ECD8]',
        text: 'text-[#5C4033]',
        border: 'border-[#D9CDB8]',
        cardBg: 'bg-[#EFE5CD]',
        accentText: 'text-[#8B7355]',
        headerBg: 'bg-[#F4ECD8]/95',
        footerBg: 'bg-[#F4ECD8]',
      };
    case 'amoled':
      return {
        bg: 'bg-black',
        text: 'text-[#FFFFFF]',
        border: 'border-[#1A1A1A]',
        cardBg: 'bg-[#0A0A0A]',
        accentText: 'text-[#8C8C8C]',
        headerBg: 'bg-black/95',
        footerBg: 'bg-black',
      };
    case 'dark':
    default:
      return {
        bg: 'bg-[#0A0A0A]',
        text: 'text-[#FAFAFA]',
        border: 'border-[#262626]',
        cardBg: 'bg-[#0F0F0F]',
        accentText: 'text-[#737373]',
        headerBg: 'bg-[#0A0A0A]/95',
        footerBg: 'bg-[#0A0A0A]',
      };
  }
};
