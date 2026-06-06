import { useReaderStore } from '../store/readerStore';

export const useReaderSettings = () => {
  const isSettingsOpen = useReaderStore((state) => state.isSettingsOpen);
  const showIllustrations = useReaderStore((state) => state.showIllustrations);
  const readerSettings = useReaderStore((state) => state.readerSettings);
  const setIsSettingsOpen = useReaderStore((state) => state.setIsSettingsOpen);
  const setShowIllustrations = useReaderStore((state) => state.setShowIllustrations);
  const setReaderSettings = useReaderStore((state) => state.setReaderSettings);

  return {
    isSettingsOpen,
    showIllustrations,
    readerSettings,
    setIsSettingsOpen,
    setShowIllustrations,
    setReaderSettings,
  };
};
export default useReaderSettings;
