import React from 'react';

export const RsV1C1Illustration: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg className="w-full max-w-lg mx-auto border border-[#262626] h-80" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="600" height="400" fill="#0F0F0F"/>
    <path d="M50 350 L200 200 L350 350 Z" fill="#151515"/>
    <circle cx="450" cy="150" r="40" fill="#FF3D00" opacity="0.8"/>
    <path d="M380 300 Q450 180 520 300" stroke="#FAFAFA" strokeWidth="3" strokeLinecap="round"/>
    <text x="30" y="50" fontFamily="monospace" fontSize="12" fill="#737373">INSERT ILLUSTRATION: KENJI & THE DRAGON</text>
  </svg>
);
