import React from 'react';

export const ReincarnationSystemCover: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg className="w-full h-full object-cover" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="300" height="400" fill="#0F0F0F"/>
    <rect x="80" y="80" width="140" height="240" fill="#111111" stroke="#262626"/>
    <path d="M150 100 L210 280 L90 280 Z" fill="#FF3D00" opacity="0.3"/>
    <text x="150" y="360" fontFamily="sans-serif" fontWeight="900" fontSize="14" fill="#FAFAFA" textAnchor="middle" letterSpacing="3">REINKARNASI</text>
  </svg>
);
