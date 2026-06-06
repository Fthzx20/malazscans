"use client";

import React, { useEffect } from 'react';
import MainAppLayout from '../../components/layout/MainAppLayout';
import { useNovelStore } from '../../features/novels/store/novelStore';

export default function DmcaRoute() {
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);

  useEffect(() => {
    setCurrentPage('dmca');
  }, [setCurrentPage]);

  return <MainAppLayout />;
}
