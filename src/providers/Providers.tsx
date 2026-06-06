"use client";

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../features/auth/store/authStore';
import { useNovelStore } from '../features/novels/store/novelStore';
import { useLibraryStore } from '../features/library/store/libraryStore';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5
      }
    }
  }));

  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const initializeNovels = useNovelStore((state) => state.initializeNovels);
  const initializeLibrary = useLibraryStore((state) => state.initializeLibrary);

  useEffect(() => {
    initializeAuth();
    initializeNovels();
    initializeLibrary();
  }, [initializeAuth, initializeNovels, initializeLibrary]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
export default Providers;
