import React from 'react';
import { RedSunsetCover } from './RedSunsetCover';
import { EmptySignalCover } from './EmptySignalCover';
import { MidnightCafeCover } from './MidnightCafeCover';
import { HeavenlyDragonCover } from './HeavenlyDragonCover';
import { ReincarnationSystemCover } from './ReincarnationSystemCover';

export {
  RedSunsetCover,
  EmptySignalCover,
  MidnightCafeCover,
  HeavenlyDragonCover,
  ReincarnationSystemCover
};

export const COVERS: Record<string, React.ReactNode> = {
  "red-sunset": <RedSunsetCover />,
  "empty-signal": <EmptySignalCover />,
  "midnight-cafe": <MidnightCafeCover />,
  "heavenly-dragon": <HeavenlyDragonCover />,
  "reincarnation-system": <ReincarnationSystemCover />
};
