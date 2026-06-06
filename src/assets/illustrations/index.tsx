import React from 'react';
import { RsV1C1Illustration } from './RsV1C1Illustration';
import { EsV1C1Illustration } from './EsV1C1Illustration';

export {
  RsV1C1Illustration,
  EsV1C1Illustration
};

export const ILLUSTRATIONS: Record<string, React.ReactNode> = {
  "rs-v1-c1-illus": <RsV1C1Illustration />,
  "es-v1-c1-illus": <EsV1C1Illustration />
};
