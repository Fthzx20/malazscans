import React from 'react';

export const EmptySignalCover: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg className="w-full h-full object-cover" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="300" height="400" fill="#0F0F0F"/>
    <rect x="50" y="80" width="200" height="240" stroke="#737373" strokeWidth="2"/>
    <circle cx="150" cy="200" r="60" stroke="#FF3D00" strokeWidth="3" strokeDasharray="8 4"/>
    <path d="M150 100 L150 300" stroke="#FAFAFA" strokeWidth="1"/>
    <text x="150" y="375" fontFamily="sans-serif" fontWeight="900" fontSize="14" fill="#FAFAFA" textAnchor="middle" letterSpacing="4">VOID SIGNAL</text>
  </svg>
);
